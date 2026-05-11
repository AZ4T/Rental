import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/providers/theme-provider";
import { ScrollToTop } from "@/components/scroll-to-top";
import { NotificationsProvider } from "@/providers/notifications-provider";

export const metadata: Metadata = {
    title: "Rental App",
    description: "Платформа аренды вещей",
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
                        <NotificationsProvider>
                            <Navbar />
                            <main className="max-w-7xl mx-auto px-4 py-8">
                                {children}
                            </main>
                            <ScrollToTop />
                            <Toaster />
                        </NotificationsProvider>
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
