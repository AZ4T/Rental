import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "./config";

// next-intl reads this for every server render to pick the right messages.
// We honour the user's cookie (set by the locale switcher); fall back to RU.
export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

    const messages = (await import(`../../messages/${locale}.json`)).default;
    return { locale, messages };
});
