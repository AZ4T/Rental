import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private config: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.getOrThrow('JWT_SECRET'),
            ignoreExpiration: false,
        });
    }

    async validate(payload: { sub: string; email: string }) {
        const user = await this.usersService.getProfile(payload.sub);
        return {
            userId: payload.sub,
            email: payload.email,
            role: user.role,
        };
    }
}
