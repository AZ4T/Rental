"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIncomingRentalsCount } from "@/hooks/use-rentals";
import { useUnreadCount } from "@/hooks/use-chats";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative"
        >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
    );
}

export function Navbar() {
    const { user, isAuthenticated } = useAuthStore();
    const { mutate: logout } = useLogout();
    const { data: incomingCount } = useIncomingRentalsCount();
    const { data: unreadCount } = useUnreadCount(isAuthenticated);
    const [mobileOpen, setMobileOpen] = useState(false);
    const router = useRouter();
    const [search, setSearch] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/?search=${encodeURIComponent(search.trim())}`);
            setSearch("");
        }
    };

    return (
        <>
            <header className="border-b bg-white dark:bg-gray-950 dark:border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Лого */}
                    <Link href="/" className="text-xl font-bold text-blue-600">
                        Rental
                    </Link>

                    <form
                        onSubmit={handleSearch}
                        className="hidden md:flex items-center relative"
                    >
                        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Поиск..."
                            className="pl-9 pr-4 py-1.5 text-sm rounded-full border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring w-48 focus:w-64 transition-all"
                        />
                    </form>

                    {/* Десктоп навигация */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            href="/"
                            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                            Объявления
                        </Link>
                        {isAuthenticated && (
                            <>
                                <Link
                                    href="/rentals/my"
                                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                >
                                    Мои заявки
                                </Link>
                                <Link
                                    href="/rentals/incoming"
                                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white relative"
                                >
                                    Входящие заявки
                                    {!!incomingCount && (
                                        <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                            {incomingCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href="/chats"
                                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white relative"
                                >
                                    Сообщения
                                    {!!unreadCount && (
                                        <span className="absolute -top-2 -right-4 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href="/favorites"
                                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                >
                                    Избранное
                                </Link>
                                <Link
                                    href="/about"
                                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                >
                                    О платформе
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Правая часть */}
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        {isAuthenticated && user ? (
                            <>
                                <Button
                                    asChild
                                    size="sm"
                                    className="hidden md:flex"
                                >
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
                                                {user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
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
                                        <DropdownMenuItem asChild>
                                            <Link href="/profile/my-listings">
                                                Мои объявления
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/wallet">
                                                Кошелёк
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
                                            className="text-red-500"
                                            onClick={() => logout()}
                                        >
                                            Выйти
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <div className="hidden md:flex gap-2">
                                <Button variant="ghost" asChild size="sm">
                                    <Link href="/auth/login">Войти</Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href="/auth/register">
                                        Регистрация
                                    </Link>
                                </Button>
                            </div>
                        )}

                        {/* Гамбургер */}
                        <button
                            className="md:hidden"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Мобильное меню — вне основного div */}
                {mobileOpen && (
                    <div className="md:hidden border-t dark:border-gray-800 bg-white dark:bg-gray-950 animate-slideDown">
                        <nav className="flex flex-col px-4 py-3 gap-1">
                            <Link
                                href="/"
                                onClick={() => setMobileOpen(false)}
                                className="py-2 text-sm text-gray-600 dark:text-gray-300"
                            >
                                Объявления
                            </Link>
                            {isAuthenticated && (
                                <>
                                    <Link
                                        href="/rentals/my"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        Мои заявки
                                    </Link>
                                    <Link
                                        href="/rentals/incoming"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"
                                    >
                                        Входящие заявки
                                        {!!incomingCount && (
                                            <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                {incomingCount}
                                            </span>
                                        )}
                                    </Link>
                                    <Link
                                        href="/chats"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"
                                    >
                                        Сообщения
                                        {!!unreadCount && (
                                            <span className="bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                {unreadCount > 9 ? "9+" : unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                    <Link
                                        href="/favorites"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        Избранное
                                    </Link>
                                    <Link
                                        href="/listings/create"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        + Разместить
                                    </Link>
                                </>
                            )}
                            {!isAuthenticated && (
                                <>
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm"
                                    >
                                        Войти
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm"
                                    >
                                        Регистрация
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </header>
        </>
    );
}
