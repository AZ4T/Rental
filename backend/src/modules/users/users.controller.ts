import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    UseGuards,
    Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

type AuthRequest = Request & { user: { userId: string } };

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    // my profile
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@Req() req: AuthRequest) {
        return this.usersService.getProfile(req.user.userId);
    }

    // update my profile
    @UseGuards(JwtAuthGuard)
    @Patch('me')
    updateMe(@Req() req: AuthRequest, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(req.user.userId, dto);
    }

    @Get(':id')
    getProfile(@Param('id') id: string) {
        return this.usersService.getProfile(id);
    }
}
