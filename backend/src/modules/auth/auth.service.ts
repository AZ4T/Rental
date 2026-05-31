import {
    BadRequestException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash, randomUUID } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Request, Response } from 'express';
import { MailerService } from './mailer.service';

function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain ?? '?'}`;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private config: ConfigService,
        private prisma: PrismaService,
        private mailer: MailerService,
    ) {}

    async register(dto: RegisterDto, res: Response, ip: string, ua: string, mobile = false) {
        const email = dto.email.toLowerCase();
        const exists = await this.usersService.findByEmail(email);
        if (exists) {
            this.logger.warn(`register conflict | email=${maskEmail(email)} ip=${ip}`);
            // Timing equalization: prevent email enumeration via response-time difference
            await bcrypt.hash('dummy-constant-timing', 10);
            throw new BadRequestException('Не удалось создать аккаунт');
        }

        const password_hash = await bcrypt.hash(dto.password, 10);

        const user = await this.usersService.create({
            name: dto.name,
            email,
            password_hash,
        });

        this.logger.log(`register success | email=${maskEmail(email)} ip=${ip} ua=${ua}`);
        return this.issueTokens(user.id, user.email, user.role, user.token_version, dto.device_id ?? randomUUID(), res, mobile);
    }

    async login(dto: LoginDto, res: Response, ip: string, ua: string, mobile = false) {
        const email = dto.email.toLowerCase();
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            this.logger.warn(`login failed (unknown email) | email=${maskEmail(email)} ip=${ip}`);
            throw new UnauthorizedException('Неверный email или пароль');
        }

        const isValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!isValid) {
            this.logger.warn(`login failed (wrong password) | email=${maskEmail(email)} ip=${ip} ua=${ua}`);
            throw new UnauthorizedException('Неверный email или пароль');
        }

        this.logger.log(`login success | email=${maskEmail(email)} ip=${ip} ua=${ua}`);
        return this.issueTokens(user.id, user.email, user.role, user.token_version, dto.device_id ?? randomUUID(), res, mobile);
    }

    async refresh(req: Request, res: Response, ip: string, ua: string, mobile = false) {
        // Web uses httpOnly cookie; mobile clients can't use cookies so they POST
        // refresh_token in the request body.
        const refreshToken =
            (req.cookies['refresh_token'] as string | undefined) ||
            ((req.body as { refresh_token?: string } | undefined)?.refresh_token as string | undefined);
        if (!refreshToken) {
            this.logger.warn(`refresh failed (no cookie) | ip=${ip} ua=${ua}`);
            throw new UnauthorizedException('Нет refresh токена');
        }

        let payload: { sub: string; email: string; jti: string; device_id: string };
        try {
            payload = this.jwtService.verify<{ sub: string; email: string; jti: string; device_id: string }>(refreshToken, {
                secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            });
        } catch {
            this.logger.warn(`refresh failed (invalid token) | ip=${ip} ua=${ua}`);
            this.clearRefreshCookie(res);
            throw new UnauthorizedException('Refresh токен недействителен');
        }

        const stored = await this.prisma.refreshToken.findUnique({ where: { jti: payload.jti } });
        if (!stored) {
            this.logger.warn(`refresh failed (unknown jti) | userId=${payload.sub} ip=${ip}`);
            this.clearRefreshCookie(res);
            throw new UnauthorizedException('Refresh токен недействителен');
        }

        if (stored.revoked) {
            // Grace window: a token revoked in the last 5 seconds is almost certainly
            // a duplicate concurrent refresh from the same client (e.g. multiple tabs,
            // or AuthInitializer racing with an API retry). Find the freshest active
            // token for the same user+device and reissue against THAT instead of
            // nuking every session as a "reuse" event.
            const GRACE_MS = 5_000;
            const revokedAt = stored.created_at.getTime();
            if (Date.now() - revokedAt < GRACE_MS) {
                const replacement = await this.prisma.refreshToken.findFirst({
                    where: {
                        user_id: payload.sub,
                        device_id: payload.device_id,
                        revoked: false,
                        expires_at: { gt: new Date() },
                    },
                    orderBy: { created_at: 'desc' },
                });
                if (replacement) {
                    this.logger.log(`refresh grace-hit | userId=${payload.sub} ip=${ip} ua=${ua}`);
                    const user = await this.usersService.findById(payload.sub);
                    if (user) {
                        // Rotate replacement too, then issue brand new pair
                        await this.prisma.refreshToken.update({
                            where: { jti: replacement.jti },
                            data: { revoked: true },
                        });
                        return this.issueTokens(payload.sub, payload.email, user.role, user.token_version, payload.device_id, res, mobile);
                    }
                }
            }

            // Real reuse — token used after grace window has passed. Treat as theft.
            this.logger.warn(`REFRESH TOKEN REUSE DETECTED | userId=${payload.sub} ip=${ip} ua=${ua}`);
            await this.prisma.refreshToken.updateMany({
                where: { user_id: payload.sub, revoked: false },
                data: { revoked: true },
            });
            this.clearRefreshCookie(res);
            throw new UnauthorizedException('Подозрительная активность — все сессии отозваны');
        }

        await this.prisma.refreshToken.update({
            where: { jti: payload.jti },
            data: { revoked: true },
        });

        const user = await this.usersService.findById(payload.sub);
        if (!user) {
            this.logger.warn(`refresh failed (user deleted) | userId=${payload.sub} ip=${ip}`);
            this.clearRefreshCookie(res);
            throw new UnauthorizedException('Пользователь не найден');
        }

        this.logger.log(`refresh success | userId=${payload.sub} ip=${ip} ua=${ua}`);
        return this.issueTokens(payload.sub, payload.email, user.role, user.token_version, payload.device_id, res, mobile);
    }

    private clearRefreshCookie(res: Response) {
        const secure = this.config.get('COOKIE_SECURE') === 'true';
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure,
            sameSite: secure ? 'none' : 'lax',
            path: '/',
        });
    }

    async logout(res: Response, userId: string | undefined, ip: string, rawRefreshToken?: string) {
        if (userId) {
            // Инкремент token_version — все выданные access_token немедленно невалидны
            await this.prisma.user.update({
                where: { id: userId },
                data: { token_version: { increment: 1 } },
            });
        }

        if (rawRefreshToken) {
            try {
                const payload = this.jwtService.decode(rawRefreshToken) as { jti?: string } | null;
                if (payload?.jti) {
                    await this.prisma.refreshToken.updateMany({
                        where: { jti: payload.jti },
                        data: { revoked: true },
                    });
                }
            } catch { /* невалидный токен — игнорируем */ }
        }

        this.logger.log(`logout | userId=${userId ?? 'unknown'} ip=${ip}`);
        // Must match cookie set options (secure/sameSite/path) or browser ignores the clear
        this.clearRefreshCookie(res);
        return { message: 'Вышли успешно' };
    }

    async forgotPassword(dto: ForgotPasswordDto, ip: string) {
        const email = dto.email.toLowerCase();
        const user = await this.usersService.findByEmail(email);

        // Always return the same response to prevent email enumeration
        if (!user) {
            this.logger.warn(`forgot-password (unknown email) | email=${maskEmail(email)} ip=${ip}`);
            // Timing equalization: match the bcrypt work done on the happy path
            await bcrypt.hash('dummy-constant-timing', 10);
            return { message: 'Если аккаунт существует, письмо будет отправлено' };
        }

        // Invalidate previous unused tokens for this user
        await this.prisma.passwordResetToken.updateMany({
            where: { user_id: user.id, used: false },
            data: { used: true },
        });

        const rawToken = randomBytes(32).toString('hex');
        const token_hash = createHash('sha256').update(rawToken).digest('hex');
        const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await this.prisma.passwordResetToken.create({
            data: { token_hash, user_id: user.id, expires_at },
        });

        await this.mailer.sendPasswordReset(user.email, rawToken);
        this.logger.log(`forgot-password email sent | userId=${user.id} ip=${ip}`);

        return { message: 'Если аккаунт существует, письмо будет отправлено' };
    }

    async resetPassword(dto: ResetPasswordDto, ip: string) {
        const token_hash = createHash('sha256').update(dto.token).digest('hex');

        const record = await this.prisma.passwordResetToken.findUnique({ where: { token_hash } });

        if (!record || record.used || record.expires_at < new Date()) {
            this.logger.warn(`reset-password failed (invalid/expired token) | ip=${ip}`);
            throw new BadRequestException('Ссылка недействительна или истекла');
        }

        // Mark token used before changing password (prevent reuse even if hash collision)
        await this.prisma.passwordResetToken.update({
            where: { token_hash },
            data: { used: true },
        });

        const password_hash = await bcrypt.hash(dto.password, 10);

        // Invalidate all sessions: bump token_version + revoke all refresh tokens
        await this.prisma.user.update({
            where: { id: record.user_id },
            data: { password_hash, token_version: { increment: 1 } },
        });

        await this.prisma.refreshToken.updateMany({
            where: { user_id: record.user_id, revoked: false },
            data: { revoked: true },
        });

        this.logger.log(`reset-password success | userId=${record.user_id} ip=${ip}`);
        return { message: 'Пароль успешно изменён. Войдите заново.' };
    }

    async changePassword(userId: string, dto: ChangePasswordDto, ip: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException();

        const isValid = await bcrypt.compare(dto.current_password, user.password_hash);
        if (!isValid) {
            this.logger.warn(`change-password failed (wrong current password) | userId=${userId} ip=${ip}`);
            throw new BadRequestException('Текущий пароль неверен');
        }

        const password_hash = await bcrypt.hash(dto.new_password, 10);

        // Invalidate all other sessions (keeps current session by bumping version in issueTokens on next login)
        await this.prisma.user.update({
            where: { id: userId },
            data: { password_hash, token_version: { increment: 1 } },
        });

        await this.prisma.refreshToken.updateMany({
            where: { user_id: userId, revoked: false },
            data: { revoked: true },
        });

        this.logger.log(`change-password success | userId=${userId} ip=${ip}`);
        return { message: 'Пароль успешно изменён. Войдите заново.' };
    }

    private async issueTokens(userId: string, email: string, role: string, tokenVersion: number, deviceId: string, res: Response, mobile = false) {
        const jti = randomUUID();
        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const accessPayload = { sub: userId, email, role, version: tokenVersion };
        const refreshPayload = { sub: userId, email, role, jti, device_id: deviceId };

        const access_token = this.jwtService.sign(accessPayload, {
            secret: this.config.getOrThrow('JWT_SECRET'),
            expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
        });

        const refresh_token = this.jwtService.sign(refreshPayload, {
            secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });

        // Revoke old device tokens and issue new one atomically
        await this.prisma.$transaction([
            this.prisma.refreshToken.updateMany({
                where: { user_id: userId, device_id: deviceId, revoked: false },
                data: { revoked: true },
            }),
            this.prisma.refreshToken.create({
                data: { jti, user_id: userId, device_id: deviceId, expires_at: refreshExpiresAt },
            }),
        ]);

        // Удаляем истёкшие записи (и отозванные старше 7 дней), не засоряя таблицу
        await this.prisma.refreshToken.deleteMany({
            where: { user_id: userId, expires_at: { lt: new Date() } },
        });

        const cookieSecure = this.config.get('COOKIE_SECURE') === 'true';

        // Web clients keep refresh_token in an httpOnly cookie.
        // Mobile clients can't use cookies — we additionally return refresh_token
        // in the body so they can persist it in SecureStore.
        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: cookieSecure,
            sameSite: cookieSecure ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const user = await this.usersService.getProfile(userId);

        return mobile ? { access_token, refresh_token, user } : { access_token, user };
    }
}
