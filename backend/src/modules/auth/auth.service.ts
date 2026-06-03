import {
    BadRequestException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { I18nBadRequest, I18nUnauthorized } from '../../i18n/i18n.exception';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash, randomUUID } from 'crypto';
import { OAuth2Client as GoogleAuthClient, TokenPayload } from 'google-auth-library';
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

        // Race-safe create: two simultaneous registrations with the same email
        // both pass findByEmail (no record yet), then one wins the unique-index
        // race and the loser throws P2002. Convert to the same friendly error.
        let user;
        try {
            user = await this.usersService.create({
                name: dto.name,
                email,
                password_hash,
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                this.logger.warn(`register conflict (race) | email=${maskEmail(email)} ip=${ip}`);
                throw new BadRequestException('Не удалось создать аккаунт');
            }
            throw e;
        }

        this.logger.log(`register success | email=${maskEmail(email)} ip=${ip} ua=${ua}`);
        return this.issueTokens(user.id, user.email, user.role, user.token_version, dto.device_id ?? randomUUID(), res, mobile);
    }

    async login(dto: LoginDto, res: Response, ip: string, ua: string, mobile = false) {
        const email = dto.email.toLowerCase();
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            this.logger.warn(`login failed (unknown email) | email=${maskEmail(email)} ip=${ip}`);
            throw new I18nUnauthorized('auth.invalidCredentials');
        }

        if (!user.password_hash) {
            // User signed up via OAuth and never set a local password.
            this.logger.warn(`login failed (oauth-only) | email=${maskEmail(email)} ip=${ip}`);
            throw new I18nUnauthorized('auth.invalidCredentials');
        }
        const isValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!isValid) {
            this.logger.warn(`login failed (wrong password) | email=${maskEmail(email)} ip=${ip} ua=${ua}`);
            throw new I18nUnauthorized('auth.invalidCredentials');
        }

        this.logger.log(`login success | email=${maskEmail(email)} ip=${ip} ua=${ua}`);
        return this.issueTokens(user.id, user.email, user.role, user.token_version, dto.device_id ?? randomUUID(), res, mobile);
    }

    /**
     * Sign-in (or sign-up) via Google. The client gets an id_token from
     * Google Identity Services and posts it here. We verify the token with
     * Google's public keys, then link the user by `sub` (preferred) or
     * email (for upgrade from an existing local account).
     */
    async googleSignIn(
        idToken: string,
        res: Response,
        ip: string,
        ua: string,
        mobile = false,
        deviceId?: string,
    ) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            this.logger.error('GOOGLE_CLIENT_ID not configured');
            throw new I18nUnauthorized('auth.invalidCredentials');
        }

        const client = new GoogleAuthClient();
        let payload: TokenPayload | undefined;
        try {
            const ticket = await client.verifyIdToken({ idToken, audience: clientId });
            payload = ticket.getPayload();
        } catch (e) {
            this.logger.warn(`google verify failed | ip=${ip} reason=${(e as Error).message}`);
            throw new I18nUnauthorized('auth.invalidCredentials');
        }
        if (!payload?.email || !payload.sub || payload.email_verified !== true) {
            throw new I18nUnauthorized('auth.invalidCredentials');
        }

        const email = payload.email.toLowerCase();
        const googleId = payload.sub;
        const name = payload.name?.trim() || email.split('@')[0];
        const avatarUrl = payload.picture ?? null;

        // 1. Existing user linked by google_id — fast path
        let user = await this.prisma.user.findUnique({ where: { google_id: googleId } });

        // 2. No google_id link but maybe a local account with same email — link it
        if (!user) {
            const byEmail = await this.usersService.findByEmail(email);
            if (byEmail) {
                user = await this.prisma.user.update({
                    where: { id: byEmail.id },
                    data: {
                        google_id: googleId,
                        // Don't switch provider away from "local" — they
                        // still have a password and can use either method.
                        ...(byEmail.avatar_url ? {} : { avatar_url: avatarUrl }),
                    },
                });
                this.logger.log(`google link existing | email=${maskEmail(email)} ip=${ip}`);
            }
        }

        // 3. Brand new user — create as oauth-only
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    name,
                    avatar_url: avatarUrl,
                    google_id: googleId,
                    provider: 'google',
                    password_hash: null,
                },
            });
            this.logger.log(`google signup | email=${maskEmail(email)} ip=${ip}`);
        } else {
            this.logger.log(`google login | email=${maskEmail(email)} ip=${ip}`);
        }

        return this.issueTokens(
            user.id,
            user.email,
            user.role,
            user.token_version,
            deviceId ?? randomUUID(),
            res,
            mobile,
        );
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
            // Grace window: a token revoked within the last 5 seconds is almost
            // always a duplicate concurrent refresh from the same client (e.g.
            // two tabs, or AuthInitializer racing with an API retry inside the
            // response interceptor). We return the SAME currently-active token
            // instead of rotating again — both racing clients then end up with
            // the identical cookie and neither has its session destroyed.
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
                        return this.reissueAccessTokenOnly(
                            payload.sub,
                            payload.email,
                            user.role,
                            user.token_version,
                            payload.device_id,
                            replacement.jti,
                            replacement.expires_at,
                            res,
                            mobile,
                        );
                    }
                }
            }

            // Real reuse — token used after the grace window has passed. Treat
            // as a stolen-token replay and burn every session.
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

    async logout(res: Response, ip: string, rawRefreshToken?: string) {
        // Identify the user from the refresh_token cookie (signature-verified,
        // not just decoded — otherwise a forged cookie could trigger writes
        // for arbitrary users).
        let userId: string | undefined;
        let jti: string | undefined;
        if (rawRefreshToken) {
            try {
                const payload = this.jwtService.verify<{ sub: string; jti: string }>(rawRefreshToken, {
                    secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
                });
                userId = payload.sub;
                jti = payload.jti;
            } catch { /* invalid/expired token — still clear the cookie below */ }
        }

        if (userId) {
            // Bump token_version → outstanding access_tokens immediately invalid
            await this.prisma.user.update({
                where: { id: userId },
                data: { token_version: { increment: 1 } },
            });
        }

        if (jti) {
            await this.prisma.refreshToken.updateMany({
                where: { jti },
                data: { revoked: true },
            });
        }

        this.logger.log(`logout | userId=${userId ?? 'unknown'} ip=${ip}`);
        // Must match cookie set options (secure/sameSite/path) or browser ignores the clear
        this.clearRefreshCookie(res);
        return { message: 'Вышли успешно' };
    }

    async forgotPassword(dto: ForgotPasswordDto, ip: string) {
        const email = dto.email.toLowerCase();
        // Process everything asynchronously so the response time is identical
        // whether the email exists or not — prevents enumeration via timing.
        void this.processForgotPassword(email, ip).catch((err) => {
            this.logger.warn(`forgot-password processing error | email=${maskEmail(email)} err=${(err as Error).message}`);
        });

        return { message: 'Если аккаунт существует, письмо будет отправлено' };
    }

    private async processForgotPassword(email: string, ip: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            this.logger.warn(`forgot-password (unknown email) | email=${maskEmail(email)} ip=${ip}`);
            return;
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
    }

    async resetPassword(dto: ResetPasswordDto, res: Response, ip: string) {
        const token_hash = createHash('sha256').update(dto.token).digest('hex');

        const record = await this.prisma.passwordResetToken.findUnique({ where: { token_hash } });

        if (!record || record.used || record.expires_at < new Date()) {
            this.logger.warn(`reset-password failed (invalid/expired token) | ip=${ip}`);
            throw new I18nBadRequest('auth.tokenInvalid');
        }

        // Mark token used before changing password (prevent reuse even if hash collision)
        await this.prisma.passwordResetToken.update({
            where: { token_hash },
            data: { used: true },
        });

        const password_hash = await bcrypt.hash(dto.password, 10);

        // Invalidate all sessions: bump token_version + revoke all refresh tokens
        const updatedUser = await this.prisma.user.update({
            where: { id: record.user_id },
            data: { password_hash, token_version: { increment: 1 } },
        });

        await this.prisma.refreshToken.updateMany({
            where: { user_id: record.user_id, revoked: false },
            data: { revoked: true },
        });

        // Clear refresh cookie so the browser doesn't ping /auth/refresh with
        // a now-revoked token (which would trigger a false reuse alarm).
        this.clearRefreshCookie(res);

        // Notify the user that their password was just reset. If they didn't
        // do it themselves, they have a chance to react. Fire-and-forget so a
        // failing mailer doesn't break the reset flow.
        void this.mailer.sendPasswordChangedNotice(updatedUser.email).catch((err) => {
            this.logger.warn(`reset-password notice failed | userId=${record.user_id} err=${(err as Error).message}`);
        });

        this.logger.log(`reset-password success | userId=${record.user_id} ip=${ip}`);
        return { message: 'Пароль успешно изменён. Войдите заново.' };
    }

    async changePassword(userId: string, dto: ChangePasswordDto, res: Response, ip: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException();

        if (!user.password_hash) {
            // OAuth-only user — setting a first password instead of changing.
            // For now we require they verify with current_password, which they
            // don't have. Block until we add a dedicated "set initial password"
            // flow.
            throw new I18nBadRequest('auth.passwordMismatch');
        }
        const isValid = await bcrypt.compare(dto.current_password, user.password_hash);
        if (!isValid) {
            this.logger.warn(`change-password failed (wrong current password) | userId=${userId} ip=${ip}`);
            throw new I18nBadRequest('auth.passwordMismatch');
        }

        const password_hash = await bcrypt.hash(dto.new_password, 10);

        // Invalidate every session — user has to re-login on every device
        await this.prisma.user.update({
            where: { id: userId },
            data: { password_hash, token_version: { increment: 1 } },
        });

        await this.prisma.refreshToken.updateMany({
            where: { user_id: userId, revoked: false },
            data: { revoked: true },
        });

        this.clearRefreshCookie(res);

        void this.mailer.sendPasswordChangedNotice(user.email).catch((err) => {
            this.logger.warn(`change-password notice failed | userId=${userId} err=${(err as Error).message}`);
        });

        this.logger.log(`change-password success | userId=${userId} ip=${ip}`);
        return { message: 'Пароль успешно изменён. Войдите заново.' };
    }

    /**
     * Issue a fresh access_token but reuse an existing active refresh token
     * (same jti, same exp). Called only from the grace-window code path to
     * make concurrent racing refreshes converge on the same refresh_token.
     */
    private async reissueAccessTokenOnly(
        userId: string,
        email: string,
        role: string,
        tokenVersion: number,
        deviceId: string,
        existingJti: string,
        existingExpiresAt: Date,
        res: Response,
        mobile: boolean,
    ) {
        const accessPayload = { sub: userId, email, role, version: tokenVersion };
        const refreshPayload = { sub: userId, email, role, jti: existingJti, device_id: deviceId };

        const access_token = this.jwtService.sign(accessPayload, {
            secret: this.config.getOrThrow('JWT_SECRET'),
            expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
        });

        // Re-sign the same refresh payload with whatever lifetime remains.
        // jwtService.sign needs a positive expiresIn; clamp to 1 second minimum.
        const secondsLeft = Math.max(1, Math.floor((existingExpiresAt.getTime() - Date.now()) / 1000));
        const refresh_token = this.jwtService.sign(refreshPayload, {
            secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: secondsLeft,
        });

        const cookieSecure = this.config.get('COOKIE_SECURE') === 'true';
        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: cookieSecure,
            sameSite: cookieSecure ? 'none' : 'lax',
            maxAge: secondsLeft * 1000,
        });

        const user = await this.usersService.getProfile(userId);
        return mobile ? { access_token, refresh_token, user } : { access_token, user };
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
