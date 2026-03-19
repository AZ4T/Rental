import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Роуты которые требуют авторизации
const protectedRoutes = [
    "/listings/create",
    "/listings",
    "/favorites",
    "/rentals",
    "/profile/me",
    "/admin",
];

// Роуты только для гостей
const authRoutes = ["/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;
    const { pathname } = request.nextUrl;

    // Проверяем защищённые роуты
    const isProtected = protectedRoutes.some(
        (route) => pathname.startsWith(route) && pathname !== "/listings",
    );

    // Проверяем роуты для гостей
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Не авторизован → редирект на логин
    if (isProtected && !token) {
        const url = new URL("/auth/login", request.url);
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // Авторизован → редирект с логина на главную
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
