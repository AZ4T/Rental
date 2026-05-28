"use client";

import { useEffect, useState } from "react";
import { Keyboard } from "lucide-react";

export function KeyboardShortcuts() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            const isInput =
                tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
                (e.target as HTMLElement)?.isContentEditable;

            if (e.key === "/" && !isInput) {
                e.preventDefault();
                document
                    .querySelector<HTMLInputElement>('input[placeholder="Что хочешь арендовать?"]')
                    ?.focus();
            }

            if (e.key === "Escape") {
                (document.activeElement as HTMLElement)?.blur();
                setOpen(false);
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
        <div className="hidden sm:block fixed bottom-6 right-6 z-40">
            {open && (
                <div className="absolute bottom-12 right-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg p-4 w-52">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        Горячие клавиши
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-center justify-between">
                            <span>Поиск</span>
                            <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-xs font-mono border border-gray-300 dark:border-zinc-600">
                                /
                            </kbd>
                        </li>
                        <li className="flex items-center justify-between">
                            <span>Закрыть</span>
                            <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-xs font-mono border border-gray-300 dark:border-zinc-600">
                                Esc
                            </kbd>
                        </li>
                    </ul>
                </div>
            )}
            <button
                onClick={() => setOpen((v) => !v)}
                title="Горячие клавиши"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
                <Keyboard className="h-4 w-4" />
            </button>
        </div>
    );
}
