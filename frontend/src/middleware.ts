import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Роуты которые требуют авторизации
const protectedRoutes = [
    "/listings/create",
    "/listings/edit",
    "/favorites",
    "/rentals",
    "/profile/me",
    "/profile/my-listings",
    "/admin",
    "/chats",
    "/wallet",
];

// Роуты только для гостей
const authRoutes = ["/auth/login", "/auth/register"];

// Декодирует exp из JWT без верификации подписи (только для UX-редиректов).
// Реальная проверка подлинности — на бэкенде.
function isTokenAlive(token: string): boolean {
    try {
        const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = b64 + "==".slice(0, (4 - (b64.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        return typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
    } catch {
        return false;
    }
}

export function middleware(request: NextRequest) {
    const raw = request.cookies.get("refresh_token")?.value;
    const authenticated = !!raw && isTokenAlive(raw);
    const { pathname } = request.nextUrl;

    const isProtected = protectedRoutes.some(
        (route) => pathname.startsWith(route) && pathname !== "/listings",
    );
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Не авторизован → редирект на логин
    if (isProtected && !authenticated) {
        const url = new URL("/auth/login", request.url);
        // Разрешаем только внутренние пути: / но не //evil.com
        const safeRedirect = pathname.startsWith("/") && !pathname.startsWith("//")
            ? pathname
            : "/";
        url.searchParams.set("redirect", safeRedirect);
        return NextResponse.redirect(url);
    }

    // Auth pages: always reachable. We can't tell from the cookie alone whether
    // the session is still valid server-side — bouncing users away on a stale
    // refresh_token cookie would trap them in a loop they can't escape from.
    void isAuthRoute;

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
