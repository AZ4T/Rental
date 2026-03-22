"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
    images: string[];
    initialIndex: number;
    onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: Props) {
    const [current, setCurrent] = useState(initialIndex);

    const prev = useCallback(() => {
        setCurrent((i) => (i > 0 ? i - 1 : images.length - 1));
    }, [images.length]);

    const next = useCallback(() => {
        setCurrent((i) => (i < images.length - 1 ? i + 1 : 0));
    }, [images.length]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [prev, next, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Закрыть */}
            <button
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                onClick={onClose}
            >
                <X className="h-8 w-8" />
            </button>

            {/* Счётчик */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {current + 1} / {images.length}
            </div>

            {/* Кнопка назад */}
            {images.length > 1 && (
                <button
                    className="absolute left-4 text-white hover:text-gray-300 transition-colors p-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        prev();
                    }}
                >
                    <ChevronLeft className="h-10 w-10" />
                </button>
            )}

            {/* Изображение */}
            <img
                src={images[current]}
                alt=""
                className="max-h-[90vh] max-w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
            />

            {/* Кнопка вперёд */}
            {images.length > 1 && (
                <button
                    className="absolute right-4 text-white hover:text-gray-300 transition-colors p-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        next();
                    }}
                >
                    <ChevronRight className="h-10 w-10" />
                </button>
            )}

            {/* Миниатюры */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrent(i);
                            }}
                            className={`h-12 w-12 rounded overflow-hidden border-2 transition-colors ${
                                current === i
                                    ? "border-white"
                                    : "border-transparent opacity-60"
                            }`}
                        >
                            <img
                                src={img}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
