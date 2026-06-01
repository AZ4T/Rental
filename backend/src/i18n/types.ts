export const SUPPORTED_LANGS = ['ru', 'kk', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = 'ru';

export function isLang(value: string | undefined): value is Lang {
    return !!value && (SUPPORTED_LANGS as readonly string[]).includes(value);
}
