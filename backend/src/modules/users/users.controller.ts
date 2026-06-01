import {
    Controller,
    Delete,
    Get,
    Patch,
    Param,
    ParseUUIDPipe,
    Body,
    Post,
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

    @UseGuards(JwtAuthGuard)
    @Get('me/blocked')
    getBlocked(@Req() req: AuthRequest) {
        return this.usersService.getBlockedUsers(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/block')
    block(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
        return this.usersService.blockUser(req.user.userId, id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/block')
    unblock(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
        return this.usersService.unblockUser(req.user.userId, id);
    }

    @Get(':id')
    getProfile(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.getProfile(id);
    }
}
