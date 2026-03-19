"use client";

import { Button } from "@/components/ui/button";

interface Props {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
    return (
        <html lang="ru">
            <body className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-2xl font-bold mb-2">Критическая ошибка</h1>
                <p className="text-gray-500 mb-6">{error.message}</p>
                <Button onClick={reset}>Перезагрузить</Button>
            </body>
        </html>
    );
}
