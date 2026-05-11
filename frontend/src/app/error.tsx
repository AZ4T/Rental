"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: Props) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-20 w-20 text-red-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Что-то пошло не так
            </h1>
            <p className="text-gray-500 mb-6 max-w-md">
                {error.message ??
                    "Произошла непредвиденная ошибка. Попробуйте ещё раз."}
            </p>
            <div className="flex gap-3">
                <Button onClick={reset}>Попробовать снова</Button>
                <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/")}
                >
                    На главную
                </Button>
            </div>
        </div>
    );
}
