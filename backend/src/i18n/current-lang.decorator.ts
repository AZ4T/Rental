import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DEFAULT_LANG, Lang } from './types';

// Pulls the language picked by I18nMiddleware out of the request so
// controllers/services can pass it to I18nService.t() when throwing.
export const CurrentLang = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): Lang => {
        const req = ctx.switchToHttp().getRequest<{ lang?: Lang }>();
        return req.lang ?? DEFAULT_LANG;
    },
);
