import { Injectable } from '@nestjs/common';
import { MESSAGES, MessageKey } from './messages';
import { DEFAULT_LANG, Lang } from './types';

@Injectable()
export class I18nService {
    // t('wallet.insufficient', 'kk', { amount: 100 })
    // Falls back to the Russian copy, then to the bare key if missing.
    t(
        key: MessageKey,
        lang: Lang = DEFAULT_LANG,
        params?: Record<string, string | number>,
    ): string {
        const template =
            MESSAGES[lang]?.[key] ??
            MESSAGES[DEFAULT_LANG]?.[key] ??
            (key as string);
        if (!params) return template;
        return template.replace(/\{(\w+)\}/g, (_, name: string) =>
            params[name] !== undefined ? String(params[name]) : `{${name}}`,
        );
    }
}
