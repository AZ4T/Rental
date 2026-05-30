import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatsService } from './chats.service';

interface AuthSocket extends Socket {
    userId: string;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'chats' })
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private chatsService: ChatsService,
        private jwtService: JwtService,
        private config: ConfigService,
    ) {}

    async handleConnection(client: AuthSocket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            const payload = this.jwtService.verify<{ sub: string; exp: number }>(token, {
                secret: this.config.getOrThrow('JWT_SECRET'),
            });
            client.userId = payload.sub;

            const msUntilExpiry = Math.min(payload.exp * 1000 - Date.now(), 2_147_483_647);
            client.data.expiryTimer = setTimeout(() => client.disconnect(), msUntilExpiry);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthSocket) {
        clearTimeout(client.data.expiryTimer as ReturnType<typeof setTimeout>);
    }

    @SubscribeMessage('join_chat')
    async handleJoin(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() chatId: string,
    ) {
        await this.chatsService.markAsRead(chatId, client.userId);
        await client.join(chatId);
    }

    @SubscribeMessage('leave_chat')
    handleLeave(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() chatId: string,
    ) {
        void client.leave(chatId);
    }

    @SubscribeMessage('send_message')
    async handleMessage(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { chatId: string; content: string },
    ) {
        if (!client.userId) return;
        const message = await this.chatsService.createMessage(
            data.chatId,
            client.userId,
            data.content,
        );
        // Ensure sender is in the room so they receive the new_message broadcast
        if (!client.rooms.has(data.chatId)) {
            await client.join(data.chatId);
        }
        this.server.to(data.chatId).emit('new_message', message);
        return message;
    }
}
