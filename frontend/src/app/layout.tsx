import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";

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
        <html lang="ru">
            <body className={inter.className}>
                <QueryProvider>
                    <Navbar />
                    <main className="max-w-7xl mx-auto px-4 py-8">
                        {children}
                    </main>
                    <Toaster />
                </QueryProvider>
            </body>
        </html>
    );
}
