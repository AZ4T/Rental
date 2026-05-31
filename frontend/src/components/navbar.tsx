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
import { Menu, X, Plus, MessageCircle, Inbox, Heart, ClipboardList, Wallet, ShieldCheck, User as UserIcon, Info } from "lucide-react";
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
            router.push(`/listings?search=${encodeURIComponent(search.trim())}`);
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

                    {/* Десктоп навигация — только основные ссылки, остальное в аватарке */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            href="/listings"
                            className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Объявления
                        </Link>
                        {isAuthenticated && (
                            <>
                                <Link
                                    href="/rentals/incoming"
                                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors relative inline-flex items-center gap-1.5"
                                >
                                    <Inbox className="h-4 w-4" />
                                    Заявки
                                    {!!incomingCount && (
                                        <span className="ml-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                                            {incomingCount > 9 ? "9+" : incomingCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href="/chats"
                                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors relative inline-flex items-center gap-1.5"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Сообщения
                                    {!!unreadCount && (
                                        <span className="ml-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Правая часть */}
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        {isAuthenticated && user ? (
                            <>
                                {/* Prominent "Разместить" — больше, ярче, всегда заметно */}
                                <Button
                                    asChild
                                    size="default"
                                    className="hidden md:inline-flex gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium"
                                >
                                    <Link href="/listings/create">
                                        <Plus className="h-4 w-4" />
                                        Разместить
                                    </Link>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Avatar className="cursor-pointer h-10 w-10 ring-2 ring-transparent hover:ring-blue-500/30 transition-all">
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
                                        className="w-56"
                                    >
                                        <div className="px-2 py-1.5">
                                            <p className="text-sm font-semibold truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/profile/me" className="cursor-pointer">
                                                <UserIcon className="h-4 w-4 mr-2" />
                                                Мой профиль
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/profile/my-listings" className="cursor-pointer">
                                                <ClipboardList className="h-4 w-4 mr-2" />
                                                Мои объявления
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/rentals/my" className="cursor-pointer">
                                                <ClipboardList className="h-4 w-4 mr-2" />
                                                Мои заявки
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/favorites" className="cursor-pointer">
                                                <Heart className="h-4 w-4 mr-2" />
                                                Избранное
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/wallet" className="cursor-pointer">
                                                <Wallet className="h-4 w-4 mr-2" />
                                                Кошелёк
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/about" className="cursor-pointer">
                                                <Info className="h-4 w-4 mr-2" />
                                                О платформе
                                            </Link>
                                        </DropdownMenuItem>
                                        {user.role === "ADMIN" && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin" className="cursor-pointer">
                                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                                    Админ панель
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-500 cursor-pointer"
                                            // onSelect lets Radix close the menu cleanly,
                                            // then we trigger logout on the next tick so the
                                            // dropdown isn't unmounted mid-animation —
                                            // otherwise Radix leaves a pointer-events:none
                                            // lock on <body> that freezes the whole page.
                                            onSelect={() => {
                                                setTimeout(() => logout(), 0);
                                            }}
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
                            className="md:hidden p-2 -mr-2"
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
                                href="/listings"
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
                                    <Link
                                        href="/about"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        О платформе
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
