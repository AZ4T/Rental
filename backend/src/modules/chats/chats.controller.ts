import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
    constructor(private chatsService: ChatsService) {}

    @Get()
    getMyChats(@Request() req: { user: { userId: string } }) {
        return this.chatsService.getMyChats(req.user.userId);
    }

    @Get('unread-count')
    getUnreadCount(@Request() req: { user: { userId: string } }) {
        return this.chatsService.getUnreadCount(req.user.userId);
    }

    @Post('with/:userId')
    findOrCreate(
        @Param('userId') userId: string,
        @Request() req: { user: { userId: string } },
    ) {
        return this.chatsService.findOrCreate(req.user.userId, userId);
    }

    @Get(':id/messages')
    getMessages(
        @Param('id') id: string,
        @Request() req: { user: { userId: string } },
    ) {
        return this.chatsService.getMessages(id, req.user.userId);
    }

    @Post(':id/read')
    markAsRead(
        @Param('id') id: string,
        @Request() req: { user: { userId: string } },
    ) {
        return this.chatsService.markAsRead(id, req.user.userId);
    }
}
