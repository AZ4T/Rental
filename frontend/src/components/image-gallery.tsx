"use client";

import { useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListingImage } from "@/types";
import { Lightbox } from "@/components/lightbox";

interface Props {
    images: ListingImage[];
    title: string;
}

export function ImageGallery({ images, title }: Props) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const scrollPrev = useCallback(() => {
        if (emblaApi) {
            emblaApi.scrollPrev();
            setActiveIndex(emblaApi.selectedScrollSnap());
        }
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) {
            emblaApi.scrollNext();
            setActiveIndex(emblaApi.selectedScrollSnap());
        }
    }, [emblaApi]);

    if (images.length === 0) {
        return (
            <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                Нет фото
            </div>
        );
    }

    if (images.length === 1) {
        return (
            <>
                <div
                    className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-zoom-in"
                    onClick={() => setLightboxIndex(0)}
                >
                    <img
                        src={images[0].image_url}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                </div>
                {lightboxIndex !== null && (
                    <Lightbox
                        images={images.map((img) => img.image_url)}
                        initialIndex={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <div className="space-y-3">
                <div className="relative h-96 rounded-xl overflow-hidden">
                    <div ref={emblaRef} className="overflow-hidden h-full">
                        <div className="flex h-full">
                            {images.map((img, i) => (
                                <div
                                    key={img.id}
                                    className="flex-none w-full h-full cursor-zoom-in"
                                    onClick={() => setLightboxIndex(i)}
                                >
                                    <img
                                        src={img.image_url}
                                        alt={title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            scrollPrev();
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            scrollNext();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all ${
                                    activeIndex === i
                                        ? "w-4 bg-white dark:bg-gray-900"
                                        : "w-1.5 bg-white/50"
                                }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                        <button
                            key={img.id}
                            onClick={() => {
                                emblaApi?.scrollTo(i);
                                setActiveIndex(i);
                            }}
                            onDoubleClick={() => setLightboxIndex(i)}
                            className={`relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                                activeIndex === i
                                    ? "border-blue-600"
                                    : "border-transparent"
                            }`}
                        >
                            <img
                                src={img.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            </div>

            {lightboxIndex !== null && (
                <Lightbox
                    images={images.map((img) => img.image_url)}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </>
    );
}
