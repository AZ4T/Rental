import { Heart, MapPin, Star } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import {
    useMyFavorites,
    useAddFavorite,
    useRemoveFavorite,
} from "@/hooks/use-favorites";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Listing } from "@/types";

interface ListingCardProps {
    listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
    const { isAuthenticated } = useAuthStore();
    const { data: favorites } = useMyFavorites();
    const { mutate: addFavorite } = useAddFavorite();
    const { mutate: removeFavorite } = useRemoveFavorite();
    const [heartAnimating, setHeartAnimating] = useState(false);

    const isFavorited = favorites?.some((f) => f.listing_id === listing.id);

    const handleFavorite = (e: React.MouseEvent) => {
        e.preventDefault(); // не переходить по ссылке
        setHeartAnimating(true);
        setTimeout(() => setHeartAnimating(false), 300);
        if (isFavorited) {
            removeFavorite(listing.id);
        } else {
            addFavorite(listing.id);
        }
    };

    const image = listing.images[0]?.image_url;

    return (
        <Link href={`/listings/${listing.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="relative h-48 bg-gray-100">
                    {image ? (
                        <img
                            src={image}
                            alt={listing.title}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Нет фото
                        </div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-white text-gray-700">
                        {listing.category.name}
                    </Badge>

                    {/* Кнопка лайка */}
                    {isAuthenticated && (
                        <button
                            onClick={handleFavorite}
                            className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow hover:scale-110 transition-transform"
                        >
                            <Heart
                                className={`h-4 w-4 transition-colors ${
                                    isFavorited
                                        ? "fill-red-500 text-red-500"
                                        : "text-gray-400"
                                } ${heartAnimating ? "animate-heart" : ""}`}
                            />
                        </button>
                    )}
                </div>

                <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground truncate">
                        {listing.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{listing.city}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <div>
                            <span className="text-lg font-bold text-blue-600">
                                {Number(listing.price).toLocaleString()} ₸
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {" "}
                                / день
                            </span>
                        </div>
                        {listing.owner.rating_avg && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>
                                    {Number(listing.owner.rating_avg).toFixed(
                                        1,
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
