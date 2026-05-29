import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Throttle({ default: { ttl: 60_000, limit: 5 } })
    @Post('register')
    register(
        @Body() dto: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.register(dto, res);
    }

    @Throttle({ default: { ttl: 60_000, limit: 5 } })
    @Post('login')
    login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        return this.authService.login(dto, res);
    }

    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @Post('refresh')
    refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        return this.authService.refresh(req, res);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        return this.authService.logout(res);
    }
}
