"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
    const { user, isAuthenticated } = useAuthStore();
    const { mutate: logout } = useLogout();

    return (
        <header className="border-b bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Лого */}
                <Link href="/" className="text-xl font-bold text-blue-600">
                    Rental
                </Link>

                {/* Навигация */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link
                        href="/"
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Объявления
                    </Link>
                    {isAuthenticated && (
                        <>
                            <Link
                                href="/rentals/my"
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Мои аренды
                            </Link>
                            <Link
                                href="/rentals/incoming"
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Входящие
                            </Link>
                            <Link
                                href="/favorites"
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Избранное
                            </Link>
                        </>
                    )}
                </nav>

                {/* Правая часть */}
                <div className="flex items-center gap-3">
                    {isAuthenticated && user ? (
                        <>
                            <Button asChild size="sm">
                                <Link href="/listings/create">
                                    + Разместить
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar className="cursor-pointer h-9 w-9">
                                        <AvatarImage
                                            src={user.avatar_url ?? ""}
                                        />
                                        <AvatarFallback>
                                            {user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                >
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile/me">
                                            Мой профиль
                                        </Link>
                                    </DropdownMenuItem>
                                    {user.role === "ADMIN" && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin">
                                                Админ панель
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-500 cursor-pointer"
                                        onClick={() => logout()}
                                    >
                                        Выйти
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" asChild size="sm">
                                <Link href="/auth/login">Войти</Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link href="/auth/register">Регистрация</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
