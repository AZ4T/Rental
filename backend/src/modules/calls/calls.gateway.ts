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
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface AuthSocket extends Socket {
    userId: string;
}

@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, namespace: 'calls' })
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private jwtService: JwtService,
        private config: ConfigService,
        private prisma: PrismaService,
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
            await client.join(`user:${payload.sub}`);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(_client: AuthSocket) {}

    private async findChat(userAId: string, userBId: string) {
        const [p1, p2] = [userAId, userBId].sort();
        return this.prisma.chat.findUnique({
            where: { participant1_id_participant2_id: { participant1_id: p1, participant2_id: p2 } },
        });
    }

    private async saveCallMessage(chatId: string, senderId: string, content: string) {
        const msg = await this.prisma.message.create({
            data: { chat_id: chatId, sender_id: senderId, content, type: 'call', is_read: false },
            include: { sender: { select: { id: true, name: true, avatar_url: true } } },
        });
        return msg;
    }

    @SubscribeMessage('call:initiate')
    handleInitiate(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody()
        data: {
            calleeId: string;
            callerName: string;
            callerAvatar?: string;
            offer: unknown;
            isVideo?: boolean;
        },
    ) {
        this.server.to(`user:${data.calleeId}`).emit('call:incoming', {
            callerId: client.userId,
            callerName: data.callerName,
            callerAvatar: data.callerAvatar,
            offer: data.offer,
            isVideo: data.isVideo ?? false,
        });
    }

    @SubscribeMessage('call:answer')
    handleAnswer(
        @ConnectedSocket() _client: AuthSocket,
        @MessageBody() data: { callerId: string; answer: unknown },
    ) {
        this.server.to(`user:${data.callerId}`).emit('call:answered', { answer: data.answer });
    }

    @SubscribeMessage('call:ice-candidate')
    handleIce(
        @ConnectedSocket() _client: AuthSocket,
        @MessageBody() data: { targetId: string; candidate: unknown },
    ) {
        this.server.to(`user:${data.targetId}`).emit('call:ice-candidate', { candidate: data.candidate });
    }

    @SubscribeMessage('call:reject')
    async handleReject(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { callerId: string },
    ) {
        this.server.to(`user:${data.callerId}`).emit('call:rejected');
        const chat = await this.findChat(client.userId, data.callerId);
        if (chat) {
            const content = JSON.stringify({ outcome: 'rejected' });
            const msg = await this.saveCallMessage(chat.id, client.userId, content);
            this.server.to(`user:${data.callerId}`).emit('message:new', msg);
            this.server.to(`user:${client.userId}`).emit('message:new', msg);
        }
    }

    @SubscribeMessage('call:end')
    async handleEnd(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { targetId: string; duration?: number },
    ) {
        this.server.to(`user:${data.targetId}`).emit('call:ended');
        const chat = await this.findChat(client.userId, data.targetId);
        if (chat) {
            const content = JSON.stringify({ outcome: 'completed', duration: data.duration ?? 0 });
            const msg = await this.saveCallMessage(chat.id, client.userId, content);
            this.server.to(`user:${data.targetId}`).emit('message:new', msg);
            this.server.to(`user:${client.userId}`).emit('message:new', msg);
        }
    }

    @SubscribeMessage('call:busy')
    async handleBusy(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { callerId: string },
    ) {
        this.server.to(`user:${data.callerId}`).emit('call:busy');
        const chat = await this.findChat(client.userId, data.callerId);
        if (chat) {
            const content = JSON.stringify({ outcome: 'missed' });
            const msg = await this.saveCallMessage(chat.id, client.userId, content);
            this.server.to(`user:${data.callerId}`).emit('message:new', msg);
            this.server.to(`user:${client.userId}`).emit('message:new', msg);
        }
    }
}
