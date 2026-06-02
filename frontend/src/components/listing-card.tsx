import { Heart, MapPin, Star, Eye, GitCompareArrows, Sparkles } from "lucide-react";
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
import { useCompareStore } from "@/store/compare.store";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ListingCardProps {
    listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
    const t = useTranslations("Listing");
    const { isAuthenticated } = useAuthStore();
    const { data: favorites } = useMyFavorites();
    const { mutate: addFavorite } = useAddFavorite();
    const { mutate: removeFavorite } = useRemoveFavorite();
    const [heartAnimating, setHeartAnimating] = useState(false);
    const { add, remove, has, validate } = useCompareStore();
    const inCompare = has(listing.id);

    const handleCompare = (e: React.MouseEvent) => {
        e.preventDefault();
        if (inCompare) { remove(listing.id); return; }
        const error = validate(listing);
        if (error) { toast.error(error); return; }
        add(listing);
    };

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
                <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                    {image ? (
                        <img
                            src={image}
                            alt={listing.title}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.removeAttribute("hidden");
                            }}
                        />
                    ) : null}
                    <div
                        hidden={!!image}
                        className="w-full h-full flex items-center justify-center text-gray-400"
                    >
                        {t("noPhoto")}
                    </div>
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        <Badge className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                            {listing.category.name}
                        </Badge>
                        {listing.promoted_until &&
                            new Date(listing.promoted_until).getTime() >
                                Date.now() && (
                                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-md gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Featured
                                </Badge>
                            )}
                    </div>

                    {/* Кнопки действий */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {isAuthenticated && (
                            <button
                                onClick={handleFavorite}
                                className="bg-white dark:bg-gray-900 rounded-full p-2.5 shadow hover:scale-110 transition-transform"
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
                        <button
                            onClick={handleCompare}
                            title={inCompare ? t("compareRemove") : t("compareAdd")}
                            className={`rounded-full p-2.5 shadow hover:scale-110 transition-all ${
                                inCompare
                                    ? "bg-blue-600 text-white"
                                    : "bg-white dark:bg-gray-900 text-gray-400"
                            }`}
                        >
                            <GitCompareArrows className="h-4 w-4" />
                        </button>
                    </div>
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
                                {t("perDay")}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {listing.rating_avg ? (
                                <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{Number(listing.rating_avg).toFixed(1)}</span>
                                </div>
                            ) : listing.reviews_count === 0 ? (
                                <span className="text-xs text-muted-foreground">{t("noRatings")}</span>
                            ) : null}
                            <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{listing.views_count ?? 0}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
