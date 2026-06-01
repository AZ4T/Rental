"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIncomingRentalsCount } from "@/hooks/use-rentals";
import { useUnreadCount } from "@/hooks/use-chats";
import {
    Menu,
    X,
    Plus,
    MessageCircle,
    Inbox,
    Heart,
    ClipboardList,
    Wallet,
    ShieldCheck,
    ShieldAlert,
    Ban,
    User as UserIcon,
    Info,
    Search,
    Sun,
    Moon,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { NavBadge } from "@/components/nav-badge";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "next-intl";

export function Navbar() {
    const t = useTranslations("Nav");
    const tCommon = useTranslations("Common");
    const tAuth = useTranslations("Auth");
    const { user, isAuthenticated } = useAuthStore();
    const { mutate: logout } = useLogout();
    const { data: incomingCount } = useIncomingRentalsCount();
    const { data: unreadCount } = useUnreadCount(isAuthenticated);
    const { theme, setTheme } = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);
    const router = useRouter();
    const [search, setSearch] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/listings?search=${encodeURIComponent(search.trim())}`);
            setSearch("");
            setMobileOpen(false);
        }
    };

    const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

    return (
        <>
            <header className="border-b bg-white dark:bg-gray-950 dark:border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    {/* Лого */}
                    <Link href="/" className="text-xl font-bold text-blue-600 shrink-0">
                        Rental
                    </Link>

                    {/* Поиск — десктоп */}
                    <form
                        onSubmit={handleSearch}
                        className="hidden md:flex items-center relative"
                    >
                        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`${tCommon("search")}...`}
                            className="pl-9 pr-4 py-1.5 text-sm rounded-full border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring w-48 focus:w-64 transition-all"
                        />
                    </form>

                    {/* Десктоп навигация — только основные ссылки, остальное в аватарке */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            href="/listings"
                            className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            {t("listings")}
                        </Link>
                        {isAuthenticated && (
                            <>
                                <Link
                                    href="/rentals/incoming"
                                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors relative inline-flex items-center gap-1.5"
                                >
                                    <Inbox className="h-4 w-4" />
                                    {t("rentals")}
                                    <NavBadge count={incomingCount ?? 0} color="red" className="ml-0.5" />
                                </Link>
                                <Link
                                    href="/chats"
                                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors relative inline-flex items-center gap-1.5"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    {t("messages")}
                                    <NavBadge count={unreadCount ?? 0} color="blue" className="ml-0.5" />
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Правая часть */}
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <LocaleSwitcher />
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
                                        {t("post")}
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
                                                {t("profile")}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/profile/my-listings" className="cursor-pointer">
                                                <ClipboardList className="h-4 w-4 mr-2" />
                                                {t("myListings")}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/rentals/my" className="cursor-pointer">
                                                <ClipboardList className="h-4 w-4 mr-2" />
                                                {t("myRentals")}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/favorites" className="cursor-pointer">
                                                <Heart className="h-4 w-4 mr-2" />
                                                {t("favorites")}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/wallet" className="cursor-pointer">
                                                <Wallet className="h-4 w-4 mr-2" />
                                                {t("wallet")}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/disputes" className="cursor-pointer">
                                                <ShieldAlert className="h-4 w-4 mr-2" />
                                                {t("disputes")}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/profile/me/blocked" className="cursor-pointer">
                                                <Ban className="h-4 w-4 mr-2" />
                                                {t("blocked")}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            // Don't auto-close the menu so the user can toggle and see the change
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                toggleTheme();
                                            }}
                                            className="cursor-pointer"
                                        >
                                            {theme === "dark" ? (
                                                <>
                                                    <Sun className="h-4 w-4 mr-2" />
                                                    {t("themeLight")}
                                                </>
                                            ) : (
                                                <>
                                                    <Moon className="h-4 w-4 mr-2" />
                                                    {t("themeDark")}
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/about" className="cursor-pointer">
                                                <Info className="h-4 w-4 mr-2" />
                                                {t("about")}
                                            </Link>
                                        </DropdownMenuItem>
                                        {user.role === "ADMIN" && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin" className="cursor-pointer">
                                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                                    {t("admin")}
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
                                            {t("logout")}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <div className="hidden md:flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    aria-label="Сменить тему"
                                >
                                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                </Button>
                                <Button variant="ghost" asChild size="sm">
                                    <Link href="/auth/login">{tAuth("login")}</Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href="/auth/register">
                                        {tAuth("register")}
                                    </Link>
                                </Button>
                            </div>
                        )}

                        {/* Гамбургер */}
                        <button
                            className="md:hidden p-2 -mr-2"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Меню"
                        >
                            {mobileOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Мобильное меню */}
                {mobileOpen && (
                    <div className="md:hidden border-t dark:border-gray-800 bg-white dark:bg-gray-950 animate-slideDown">
                        {/* Поиск в шапке мобильного меню */}
                        <form
                            onSubmit={handleSearch}
                            className="px-4 pt-3"
                        >
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={`${tCommon("search")}...`}
                                    className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                        </form>

                        <nav className="flex flex-col px-4 py-3 gap-1">
                            <Link
                                href="/listings"
                                onClick={() => setMobileOpen(false)}
                                className="py-2 text-sm text-gray-600 dark:text-gray-300"
                            >
                                {t("listings")}
                            </Link>
                            {isAuthenticated && (
                                <>
                                    <Link
                                        href="/rentals/my"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        {t("myRentals")}
                                    </Link>
                                    <Link
                                        href="/rentals/incoming"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"
                                    >
                                        {t("incomingRentals")}
                                        <NavBadge count={incomingCount ?? 0} color="red" />
                                    </Link>
                                    <Link
                                        href="/chats"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"
                                    >
                                        {t("messages")}
                                        <NavBadge count={unreadCount ?? 0} color="blue" />
                                    </Link>
                                    <Link
                                        href="/favorites"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        {t("favorites")}
                                    </Link>
                                    <Link
                                        href="/wallet"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        {t("wallet")}
                                    </Link>
                                    <Link
                                        href="/listings/create"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm font-semibold text-blue-600"
                                    >
                                        + {t("post")}
                                    </Link>
                                    <Link
                                        href="/about"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        {t("about")}
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
                                        {tAuth("login")}
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        onClick={() => setMobileOpen(false)}
                                        className="py-2 text-sm"
                                    >
                                        {tAuth("register")}
                                    </Link>
                                </>
                            )}
                            <button
                                onClick={toggleTheme}
                                className="py-2 text-sm text-gray-600 dark:text-gray-300 text-left flex items-center gap-2"
                            >
                                {theme === "dark" ? (
                                    <>
                                        <Sun className="h-4 w-4" />
                                        {t("themeLight")}
                                    </>
                                ) : (
                                    <>
                                        <Moon className="h-4 w-4" />
                                        {t("themeDark")}
                                    </>
                                )}
                            </button>
                        </nav>
                    </div>
                )}
            </header>
        </>
    );
}
