"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Inbox, User as UserIcon, Plus } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useIncomingRentalsCount } from "@/hooks/use-rentals";
import { useUnreadCount } from "@/hooks/use-chats";
import { NavBadge } from "@/components/nav-badge";
import { useTranslations } from "next-intl";

interface Tab {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: "blue" | "red";
    primary?: boolean;
    activePaths?: string[];
}

/**
 * Fixed bottom tab bar shown only on small viewports. Mirrors mobile-app
 * UX patterns — primary destinations are one tap away.
 */
export function MobileBottomNav() {
    const t = useTranslations("Nav");
    const pathname = usePathname();
    const { isAuthenticated } = useAuthStore();
    const { data: incomingCount } = useIncomingRentalsCount();
    const { data: unreadCount } = useUnreadCount(isAuthenticated);

    // Hide on auth pages to give the form the full viewport height.
    if (pathname?.startsWith("/auth/")) return null;

    const tabs: Tab[] = isAuthenticated
        ? [
              { href: "/", label: t("home"), icon: Home, activePaths: ["/", "/listings"] },
              { href: "/rentals/incoming", label: t("rentals"), icon: Inbox, badge: incomingCount, badgeColor: "red" },
              { href: "/listings/create", label: t("create"), icon: Plus, primary: true },
              { href: "/chats", label: t("chats"), icon: MessageCircle, badge: unreadCount, badgeColor: "blue" },
              { href: "/profile/me", label: t("profile"), icon: UserIcon },
          ]
        : [
              { href: "/", label: t("home"), icon: Home, activePaths: ["/", "/listings"] },
              { href: "/auth/login", label: t("loginShort"), icon: UserIcon },
          ];

    const isActive = (tab: Tab): boolean => {
        if (!pathname) return false;
        if (tab.activePaths) return tab.activePaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
        return pathname === tab.href || pathname.startsWith(tab.href + "/");
    };

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-950 border-t dark:border-gray-800 pb-[env(safe-area-inset-bottom)]"
            aria-label={t("mainNav")}
        >
            <ul className="flex items-center justify-around h-16">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab);
                    if (tab.primary) {
                        return (
                            <li key={tab.href} className="-mt-6">
                                <Link
                                    href={tab.href}
                                    aria-label={tab.label}
                                    className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                                >
                                    <Icon className="h-6 w-6" />
                                </Link>
                            </li>
                        );
                    }
                    return (
                        <li key={tab.href}>
                            <Link
                                href={tab.href}
                                className={`relative flex flex-col items-center justify-center px-3 py-1 transition-colors ${
                                    active
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400"
                                }`}
                            >
                                <div className="relative">
                                    <Icon className="h-5 w-5" />
                                    {tab.badge != null && tab.badge > 0 && (
                                        <span className="absolute -top-1.5 -right-2">
                                            <NavBadge
                                                count={tab.badge}
                                                color={tab.badgeColor ?? "blue"}
                                            />
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
