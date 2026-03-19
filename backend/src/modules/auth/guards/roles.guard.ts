import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRole =
            this.reflector.get<string>('role', context.getHandler()) ??
            this.reflector.get<string>('role', context.getClass());

        if (!requiredRole) return true;

        const request = context
            .switchToHttp()
            .getRequest<{ user?: { role?: string } }>();

        if (request.user?.role !== requiredRole) {
            throw new ForbiddenException('Недостаточно прав');
        }

        return true;
    }
}
