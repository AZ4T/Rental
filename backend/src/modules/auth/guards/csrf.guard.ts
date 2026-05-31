import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
    constructor(private config: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();

        // Mobile clients don't use cookies, so CSRF (which relies on auto-sent
        // cookies) doesn't apply. They identify themselves via this header.
        if (request.headers['x-mobile-client'] === '1') {
            return true;
        }

        const origin = request.headers['origin'];
        const referer = request.headers['referer'];

        const allowedOrigin = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

        const source = origin ?? (referer ? new URL(referer).origin : undefined);

        if (!source || source !== allowedOrigin) {
            throw new ForbiddenException('CSRF check failed');
        }
        return true;
    }
}
