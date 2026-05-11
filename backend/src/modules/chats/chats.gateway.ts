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

            const payload = this.jwtService.verify<{ sub: string }>(token, {
                secret: this.config.getOrThrow('JWT_SECRET'),
            });
            client.userId = payload.sub;
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthSocket) {
        void client;
    }

    @SubscribeMessage('join_chat')
    async handleJoin(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() chatId: string,
    ) {
        await client.join(chatId);
        await this.chatsService.markAsRead(chatId, client.userId);
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
        const message = await this.chatsService.createMessage(
            data.chatId,
            client.userId,
            data.content,
        );
        this.server.to(data.chatId).emit('new_message', message);
        return message;
    }
}
