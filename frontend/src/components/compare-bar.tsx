"use client";

import { useCompareStore } from "@/store/compare.store";
import { X, GitCompareArrows } from "lucide-react";
import Link from "next/link";

export function CompareBar() {
    const { items, remove, clear } = useCompareStore();
    if (items.length === 0) return null;

    return (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t shadow-2xl px-3 py-2 sm:py-3">
            <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4">
                {/* Items */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 overflow-x-auto min-w-0">
                    <span className="hidden sm:block text-sm font-medium text-muted-foreground flex-shrink-0">
                        Сравнение:
                    </span>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1 flex-shrink-0"
                        >
                            {item.images[0] && (
                                <img
                                    src={item.images[0].image_url}
                                    alt=""
                                    className="w-5 h-5 sm:w-6 sm:h-6 rounded object-cover"
                                />
                            )}
                            <span className="text-xs font-medium max-w-[70px] sm:max-w-[100px] truncate">
                                {item.title}
                            </span>
                            <button
                                onClick={() => remove(item.id)}
                                className="text-muted-foreground hover:text-red-500 ml-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {/* Empty slots — desktop only */}
                    {Array.from({ length: 3 - items.length }).map((_, i) => (
                        <div
                            key={i}
                            className="hidden sm:flex w-20 h-7 border border-dashed rounded-lg flex-shrink-0"
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <button
                        onClick={clear}
                        className="hidden sm:block text-sm text-muted-foreground hover:text-foreground"
                    >
                        Очистить
                    </button>
                    <button
                        onClick={clear}
                        className="sm:hidden p-1.5 text-muted-foreground hover:text-red-500"
                        title="Очистить"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <Link
                        href="/compare"
                        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
                            items.length >= 2
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                        }`}
                    >
                        <GitCompareArrows className="h-4 w-4" />
                        <span className="hidden sm:inline">Сравнить</span>
                        <span>({items.length})</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
