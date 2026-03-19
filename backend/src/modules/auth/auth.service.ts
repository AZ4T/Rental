import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private config: ConfigService,
    ) {}

    async register(dto: RegisterDto, res: Response) {
        const exists = await this.usersService.findByEmail(dto.email);
        if (exists) throw new ConflictException('Email уже занят');

        const password_hash = await bcrypt.hash(dto.password, 10);

        const user = await this.usersService.create({
            name: dto.name,
            email: dto.email,
            password_hash,
        });

        return this.issueTokens(user.id, user.email, res);
    }

    async login(dto: LoginDto, res: Response) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) throw new UnauthorizedException('Неверный email или пароль');

        const isValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!isValid)
            throw new UnauthorizedException('Неверный email или пароль');

        return this.issueTokens(user.id, user.email, res);
    }

    async refresh(req: Request, res: Response) {
        const refreshToken = req.cookies['refresh_token'] as string | undefined;
        if (!refreshToken)
            throw new UnauthorizedException('Нет refresh токена');

        try {
            const payload = this.jwtService.verify<{
                sub: string;
                email: string;
            }>(refreshToken, {
                secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            });

            return this.issueTokens(payload.sub, payload.email, res);
        } catch {
            throw new UnauthorizedException('Refresh токен недействителен');
        }
    }

    logout(res: Response) {
        res.clearCookie('refresh_token');
        return { message: 'Вышли успешно' };
    }

    private async issueTokens(userId: string, email: string, res: Response) {
        const payload = { sub: userId, email };

        const access_token = this.jwtService.sign(payload, {
            secret: this.config.getOrThrow('JWT_SECRET'),
            expiresIn: '15m',
        });

        const refresh_token = this.jwtService.sign(payload, {
            secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });

        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        });

        // Получаем пользователя и возвращаем вместе с токеном
        const user = await this.usersService.getProfile(userId); // ← добавляем

        return { access_token, user }; // ← добавляем user
    }
}
