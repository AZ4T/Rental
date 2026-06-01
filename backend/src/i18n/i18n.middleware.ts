import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { DEFAULT_LANG, isLang, SUPPORTED_LANGS, Lang } from './types';

// Augment Express's Request type so `req.lang` is strongly typed
// across the codebase (and our @CurrentLang() decorator can read it).
declare module 'express-serve-static-core' {
    interface Request {
        lang?: Lang;
    }
}

@Injectable()
export class I18nMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction) {
        req.lang = pickLanguage(req.headers['accept-language']);
        next();
    }
}

// Honour q-values like `Accept-Language: kk-KZ,ru;q=0.9,en;q=0.8`.
// Return the highest-q supported language; ignore region suffixes.
function pickLanguage(header: string | undefined): Lang {
    if (!header) return DEFAULT_LANG;

    const candidates = header
        .split(',')
        .map((part) => {
            const [tag, ...rest] = part.trim().split(';');
            const q = rest
                .map((p) => p.trim())
                .find((p) => p.startsWith('q='));
            const quality = q ? Number(q.slice(2)) : 1;
            return {
                lang: tag.toLowerCase().split('-')[0],
                quality: Number.isFinite(quality) ? quality : 1,
            };
        })
        .filter((c) => (SUPPORTED_LANGS as readonly string[]).includes(c.lang))
        .sort((a, b) => b.quality - a.quality);

    const top = candidates[0]?.lang;
    return isLang(top) ? top : DEFAULT_LANG;
}
