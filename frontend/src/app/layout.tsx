import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/providers/theme-provider";
import { ScrollToTop } from "@/components/scroll-to-top";
import { NotificationsProvider } from "@/providers/notifications-provider";
import { CallProvider } from "@/providers/call-provider";
import { CallOverlay } from "@/components/call-overlay";
import { CompareBar } from "@/components/compare-bar";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { AuthInitializer } from "@/components/auth-initializer";

export const metadata: Metadata = {
    title: "Rental App",
    description: "Платформа аренды вещей",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider>
                    <QueryProvider>
                        <AuthInitializer />
                        <NotificationsProvider>
                            <CallProvider>
                                <Navbar />
                                <main className="max-w-7xl mx-auto px-4 py-8">
                                    {children}
                                </main>
                                <ScrollToTop />
                                <CompareBar />
                                <KeyboardShortcuts />
                                <CallOverlay />
                                <Toaster />
                            </CallProvider>
                        </NotificationsProvider>
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
