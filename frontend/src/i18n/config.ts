// Cookie-based locale (no URL prefix). The full list lives here so the
// switcher in the navbar and the request-config helper stay in sync.
export const SUPPORTED_LOCALES = ["ru", "kk", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, string> = {
    ru: "Русский",
    kk: "Қазақша",
    en: "English",
};

export const LOCALE_SHORT: Record<Locale, string> = {
    ru: "RU",
    kk: "KZ",
    en: "EN",
};

export function isLocale(value: string | undefined): value is Locale {
    return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
