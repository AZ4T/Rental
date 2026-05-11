import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, namespace: 'notifications' })
export class NotificationsGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    constructor(
        private jwtService: JwtService,
        private config: ConfigService,
    ) {}

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            const payload = this.jwtService.verify<{ sub: string }>(token, {
                secret: this.config.getOrThrow('JWT_SECRET'),
            });

            client.data.userId = payload.sub;
            await client.join(`user:${payload.sub}`);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(_client: Socket) {}

    sendToUser(userId: string, event: string, data: unknown) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
}
