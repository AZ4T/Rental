import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.getOrThrow('JWT_SECRET'),
            ignoreExpiration: false,
        });
    }

    async validate(payload: { sub: string; email: string; role: string; version: number }) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { token_version: true },
        });

        if (!user || user.token_version !== payload.version) {
            throw new UnauthorizedException();
        }

        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}
