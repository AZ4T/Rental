"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getRecentlyViewed, type RecentItem } from "@/lib/recently-viewed";

export function RecentlyViewed() {
    const [items, setItems] = useState<RecentItem[]>([]);

    useEffect(() => {
        setItems(getRecentlyViewed().slice(0, 6));
    }, []);

    if (items.length === 0) return null;

    return (
        <section className="w-full">
            <h2 className="mb-3 text-lg font-semibold">Недавно смотрели</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={`/listings/${item.id}`}
                        className="flex-none w-44"
                    >
                        <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                            <div className="relative h-28 w-full bg-muted">
                                {item.image_url ? (
                                    <Image
                                        src={item.image_url}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                        sizes="176px"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                                        No image
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-2 space-y-0.5">
                                <p className="text-xs text-muted-foreground truncate">
                                    {item.category_name}
                                </p>
                                <p className="text-sm font-medium leading-snug line-clamp-2">
                                    {item.title}
                                </p>
                                <p className="text-sm font-semibold">
                                    {item.price.toLocaleString()} ₸
                                </p>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <MapPin className="h-3 w-3 flex-none" />
                                    <span className="text-xs truncate">{item.city}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
