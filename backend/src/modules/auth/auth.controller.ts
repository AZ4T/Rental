import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CsrfGuard } from './guards/csrf.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

function extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.ip ?? 'unknown';
}

// Mobile clients can't use httpOnly cookies, so they identify themselves
// via this header and receive the refresh_token in the response body.
function isMobile(req: Request): boolean {
    return req.headers['x-mobile-client'] === '1';
}

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Throttle({ default: { ttl: 60_000, limit: 5 } })
    @Post('register')
    register(
        @Body() dto: RegisterDto,
        @Res({ passthrough: true }) res: Response,
        @Req() req: Request,
    ) {
        return this.authService.register(dto, res, extractIp(req), req.headers['user-agent'] ?? '', isMobile(req));
    }

    @Throttle({ default: { ttl: 60_000, limit: 5 } })
    @Post('login')
    login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
        @Req() req: Request,
    ) {
        return this.authService.login(dto, res, extractIp(req), req.headers['user-agent'] ?? '', isMobile(req));
    }

    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @UseGuards(CsrfGuard)
    @Post('refresh')
    refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        return this.authService.refresh(req, res, extractIp(req), req.headers['user-agent'] ?? '', isMobile(req));
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
        const user = req.user as { userId: string } | undefined;
        const rawRefreshToken = req.cookies['refresh_token'] as string | undefined;
        return this.authService.logout(res, user?.userId, extractIp(req), rawRefreshToken);
    }

    @Throttle({ default: { ttl: 3600_000, limit: 3 } })
    @Post('forgot-password')
    forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
        return this.authService.forgotPassword(dto, extractIp(req));
    }

    @Throttle({ default: { ttl: 60_000, limit: 5 } })
    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
        return this.authService.resetPassword(dto, extractIp(req));
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request) {
        const user = req.user as { userId: string };
        return this.authService.changePassword(user.userId, dto, extractIp(req));
    }
}
