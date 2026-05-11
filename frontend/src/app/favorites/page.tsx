"use client";

import { useMyFavorites, useRemoveFavorite } from "@/hooks/use-favorites";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, MapPin, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function FavoritesPage() {
    const { data: favorites, isLoading } = useMyFavorites();
    const { mutate: remove, isPending } = useRemoveFavorite();

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Избранное</h1>

            {favorites?.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Нет избранных объявлений</p>
                    <Button asChild className="mt-4">
                        <Link href="/">Найти объявления</Link>
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites?.map((favorite) => (
                    <Link
                        href={`/listings/${favorite.listing.id}`}
                        key={favorite.id}
                    >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                            {/* Фото */}
                            <div className="relative h-44 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                <img
                                    src={favorite.listing.images[0]?.image_url}
                                    alt={favorite.listing.title}
                                    className="w-full h-full object-cover"
                                />
                                <Badge className="absolute top-2 left-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                                    {favorite.listing.category.name}
                                </Badge>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        remove(favorite.listing_id);
                                    }}
                                    disabled={isPending}
                                    className="absolute top-2 right-2 bg-white dark:bg-gray-900 rounded-full p-1.5 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                            </div>

                            <CardContent className="p-4">
                                <h3 className="font-semibold truncate">
                                    {favorite.listing.title}
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{favorite.listing.city}</span>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <div>
                                        <span className="text-lg font-bold text-blue-600">
                                            {Number(
                                                favorite.listing.price,
                                            ).toLocaleString()}{" "}
                                            ₸
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {" "}
                                            / день
                                        </span>
                                    </div>
                                    {favorite.listing.owner.rating_avg && (
                                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            <span>
                                                {Number(
                                                    favorite.listing.owner
                                                        .rating_avg,
                                                ).toFixed(1)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
