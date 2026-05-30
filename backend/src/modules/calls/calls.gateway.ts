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

interface PendingCall {
    callerId: string;
    timer: ReturnType<typeof setTimeout>;
}

const RING_TIMEOUT_MS = 30_000;

@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws-calls' })
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // calleeId → { callerId, ringTimer }  (ringing, not yet answered)
    private pendingCalls = new Map<string, PendingCall>();
    // userId → peerId  (both directions, active/answered call)
    private activeCalls = new Map<string, string>();

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
            const payload = this.jwtService.verify<{ sub: string; exp: number }>(token, {
                secret: this.config.getOrThrow('JWT_SECRET'),
            });
            client.userId = payload.sub;
            await client.join(`user:${payload.sub}`);

            const msUntilExpiry = Math.min(payload.exp * 1000 - Date.now(), 2_147_483_647);
            client.data.expiryTimer = setTimeout(() => client.disconnect(), msUntilExpiry);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthSocket) {
        clearTimeout(client.data.expiryTimer as ReturnType<typeof setTimeout>);
        this.cleanupCallState(client.userId);
    }

    private clearPendingCall(calleeId: string) {
        const pending = this.pendingCalls.get(calleeId);
        if (pending) {
            clearTimeout(pending.timer);
            this.pendingCalls.delete(calleeId);
        }
    }

    private cleanupCallState(userId: string) {
        // Remove from pending as callee
        this.clearPendingCall(userId);
        // Remove from pending as caller — notify caller that callee disconnected
        for (const [calleeId, { callerId }] of this.pendingCalls.entries()) {
            if (callerId === userId) this.clearPendingCall(calleeId);
        }
        // Remove from active (both sides)
        const peerId = this.activeCalls.get(userId);
        if (peerId) {
            this.activeCalls.delete(peerId);
        }
        this.activeCalls.delete(userId);
    }

    private isPeer(userA: string, userB: string): boolean {
        return (
            this.activeCalls.get(userA) === userB ||
            this.pendingCalls.get(userA)?.callerId === userB ||
            this.pendingCalls.get(userB)?.callerId === userA
        );
    }

    private async findChat(userAId: string, userBId: string) {
        const [p1, p2] = [userAId, userBId].sort();
        return this.prisma.chat.findUnique({
            where: { participant1_id_participant2_id: { participant1_id: p1, participant2_id: p2 } },
        });
    }

    private async saveCallMessage(chatId: string, senderId: string, content: string) {
        return this.prisma.message.create({
            data: { chat_id: chatId, sender_id: senderId, content, type: 'call', is_read: false },
            include: { sender: { select: { id: true, name: true, avatar_url: true } } },
        });
    }

    @SubscribeMessage('call:initiate')
    async handleInitiate(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody()
        data: {
            calleeId: string;
            offer: unknown;
            isVideo?: boolean;
        },
    ) {
        const chat = await this.findChat(client.userId, data.calleeId);
        if (!chat) {
            client.emit('call:error', { message: 'No existing chat with this user' });
            return;
        }

        // Look up caller identity from DB — never trust client-provided name/avatar
        const caller = await this.prisma.user.findUnique({
            where: { id: client.userId },
            select: { name: true, avatar_url: true },
        });

        // Cancel any previous unanswered ring from this caller
        this.clearPendingCall(data.calleeId);

        // Auto-cancel ring after RING_TIMEOUT_MS if callee never answers
        const timer = setTimeout(() => {
            if (this.pendingCalls.get(data.calleeId)?.callerId !== client.userId) return;
            this.pendingCalls.delete(data.calleeId);
            client.emit('call:missed', { calleeId: data.calleeId });
            this.server.to(`user:${data.calleeId}`).emit('call:missed');
        }, RING_TIMEOUT_MS);

        this.pendingCalls.set(data.calleeId, { callerId: client.userId, timer });

        this.server.to(`user:${data.calleeId}`).emit('call:incoming', {
            callerId: client.userId,
            callerName: caller?.name ?? 'Пользователь',
            callerAvatar: caller?.avatar_url ?? null,
            offer: data.offer,
            isVideo: data.isVideo ?? false,
        });
    }

    @SubscribeMessage('call:answer')
    async handleAnswer(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { callerId: string; answer: unknown },
    ) {
        // Only the actual callee of this pending call may answer
        if (this.pendingCalls.get(client.userId)?.callerId !== data.callerId) {
            client.emit('call:error', { message: 'No pending call from this caller' });
            return;
        }

        this.clearPendingCall(client.userId);
        this.activeCalls.set(client.userId, data.callerId);
        this.activeCalls.set(data.callerId, client.userId);

        this.server.to(`user:${data.callerId}`).emit('call:answered', { answer: data.answer });
    }

    @SubscribeMessage('call:ice-candidate')
    handleIce(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { targetId: string; candidate: unknown },
    ) {
        if (!this.isPeer(client.userId, data.targetId)) return;
        this.server.to(`user:${data.targetId}`).emit('call:ice-candidate', { candidate: data.candidate });
    }

    @SubscribeMessage('call:reject')
    async handleReject(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { callerId: string },
    ) {
        if (this.pendingCalls.get(client.userId)?.callerId !== data.callerId) return;

        this.clearPendingCall(client.userId);
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
        if (!this.isPeer(client.userId, data.targetId)) return;

        const duration = Math.max(0, Math.min(data.duration ?? 0, 86400));

        this.cleanupCallState(client.userId);

        this.server.to(`user:${data.targetId}`).emit('call:ended');

        const chat = await this.findChat(client.userId, data.targetId);
        if (chat) {
            const content = JSON.stringify({ outcome: 'completed', duration });
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
        if (this.pendingCalls.get(client.userId)?.callerId !== data.callerId) return;

        this.clearPendingCall(client.userId);
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
