import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

type AuthRequest = Request & { user: { userId: string } };

interface IceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
}

interface IceServersResponse {
    iceServers: IceServer[];
    ttl: number;
}

@UseGuards(JwtAuthGuard)
@Controller('calls')
export class IceServersController {
    constructor(private config: ConfigService) {}

    // coturn `use-auth-secret` mode: client sends
    //   username = <unix-ts of expiry>:<userId>
    //   credential = base64(hmac-sha1(username, shared_secret))
    // coturn re-computes the HMAC with the same secret and grants access.
    // Expiry is enforced server-side so leaked creds die quickly.
    @Get('ice-servers')
    getIceServers(@Req() req: AuthRequest): IceServersResponse {
        const host = this.config.get<string>('TURN_HOST');
        const secret = this.config.get<string>('TURN_SHARED_SECRET');
        const port = this.config.get<string>('TURN_PORT') ?? '3478';
        const tlsPort = this.config.get<string>('TURN_TLS_PORT') ?? '5349';
        const ttlSeconds = Number(this.config.get<string>('TURN_TTL_SECONDS') ?? '3600');

        // Always include public STUN as fallback — cheap and helps when TURN
        // misconfigures or the user is on a happy NAT.
        const iceServers: IceServer[] = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ];

        if (host && secret) {
            const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
            const username = `${expiry}:${req.user.userId}`;
            const credential = crypto
                .createHmac('sha1', secret)
                .update(username)
                .digest('base64');

            iceServers.push({
                urls: [
                    `stun:${host}:${port}`,
                    `turn:${host}:${port}?transport=udp`,
                    `turn:${host}:${port}?transport=tcp`,
                    `turns:${host}:${tlsPort}?transport=tcp`,
                ],
                username,
                credential,
            });
        }

        return { iceServers, ttl: ttlSeconds };
    }
}
