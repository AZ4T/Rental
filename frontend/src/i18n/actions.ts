"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE } from "./config";

// 1-year cookie so the choice persists across visits. Path "/" so it
// applies to every route.
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocaleAction(locale: string): Promise<void> {
    if (!isLocale(locale)) return;
    const store = await cookies();
    store.set(LOCALE_COOKIE, locale, {
        path: "/",
        maxAge: ONE_YEAR,
        sameSite: "lax",
    });
    // Force every server-rendered route to re-fetch with the new locale.
    revalidatePath("/", "layout");
}
