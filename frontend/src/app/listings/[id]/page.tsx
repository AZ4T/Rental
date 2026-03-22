"use client";

import { use, useState } from "react";
import { useListing } from "@/hooks/use-listings";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Calendar, Shield, Loader2, Heart } from "lucide-react";
import Link from "next/link";
import { RentalRequestDialog } from "@/components/rental-request-dialog";
import {
    useMyFavorites,
    useAddFavorite,
    useRemoveFavorite,
} from "@/hooks/use-favorites";
import { ImageGallery } from "@/components/image-gallery";
import { Share2, Check } from "lucide-react";
import { useSimilarListings } from "@/hooks/use-listings";
import { ListingCard } from "@/components/listing-card";

interface Props {
    params: Promise<{ id: string }>;
}

export default function ListingPage({ params }: Props) {
    const { id } = use(params);
    const { data: listing, isLoading, isError } = useListing(id);
    const { user, isAuthenticated } = useAuthStore();
    const [activeImage, setActiveImage] = useState(0);
    const [showRentalDialog, setShowRentalDialog] = useState(false);
    const { data: favorites } = useMyFavorites();
    const { mutate: addFavorite } = useAddFavorite();
    const { mutate: removeFavorite } = useRemoveFavorite();
    const [copied, setCopied] = useState(false);
    const { data: similar } = useSimilarListings(
        id,
        listing?.category_id ?? "",
    );

    const isFavorited = favorites?.some((f) => f.listing_id === id);
    const isOwner = user?.id === listing?.owner_id; // ← добавляем здесь
    const [heartAnimating, setHeartAnimating] = useState(false);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isError || !listing) {
        return (
            <div className="text-center py-20 text-red-500">
                Объявление не найдено
            </div>
        );
    }

    const handleShare = () => {
        void navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFavorite = () => {
        setHeartAnimating(true);
        setTimeout(() => setHeartAnimating(false), 300);
        if (isFavorited) {
            removeFavorite(listing.id);
        } else {
            addFavorite(listing.id);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Фото */}
                <ImageGallery images={listing.images} title={listing.title} />

                {/* Информация */}
                <div className="space-y-6">
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {listing.title}
                            </h1>
                            <Badge variant="secondary">
                                {listing.category.name}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 mt-2">
                            <MapPin className="h-4 w-4" />
                            <span>{listing.city}</span>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">
                                    Цена в день
                                </span>
                                <span className="text-2xl font-bold text-blue-600">
                                    {Number(listing.price).toLocaleString()} ₸
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Залог</span>
                                <span className="font-semibold">
                                    {Number(listing.deposit).toLocaleString()} ₸
                                </span>
                            </div>
                            {isOwner ? (
                                <Button
                                    asChild
                                    className="w-full"
                                    variant="outline"
                                >
                                    <Link href={`/listings/${listing.id}/edit`}>
                                        Редактировать
                                    </Link>
                                </Button>
                            ) : isAuthenticated ? (
                                <>
                                    <Button
                                        className="w-full"
                                        onClick={() =>
                                            setShowRentalDialog(true)
                                        }
                                    >
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Арендовать
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleFavorite}
                                    >
                                        <Heart
                                            className={`h-4 w-4 mr-2 transition-colors ${
                                                isFavorited
                                                    ? "fill-red-500 text-red-500"
                                                    : ""
                                            } ${heartAnimating ? "animate-heart" : ""}`}
                                        />
                                        {isFavorited
                                            ? "Убрать из избранного"
                                            : "В избранное"}
                                    </Button>
                                </>
                            ) : (
                                <Button asChild className="w-full">
                                    <Link href="/auth/login">
                                        Войдите чтобы арендовать
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Владелец + Поделиться */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage
                                    src={listing.owner.avatar_url ?? ""}
                                />
                                <AvatarFallback>
                                    {listing.owner.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <Link
                                    href={`/profile/${listing.owner.id}`}
                                    className="font-semibold hover:underline"
                                >
                                    {listing.owner.name}
                                </Link>
                                {listing.owner.rating_avg && (
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span>
                                            {Number(
                                                listing.owner.rating_avg,
                                            ).toFixed(1)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Кнопка поделиться */}
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span className="text-green-500">
                                        Скопировано
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="h-4 w-4" />
                                    <span>Поделиться</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-3">Описание</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {listing.description}
                </p>
            </div>

            <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-4 flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-blue-900">
                            Безопасная аренда
                        </p>
                        <p className="text-sm text-blue-700">
                            Все сделки защищены платформой. Залог возвращается
                            после завершения аренды.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {similar && similar.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        Похожие объявления
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {similar.map((item) => (
                            <ListingCard key={item.id} listing={item} />
                        ))}
                    </div>
                </div>
            )}

            {showRentalDialog && (
                <RentalRequestDialog
                    listing={listing}
                    onClose={() => setShowRentalDialog(false)}
                />
            )}
        </div>
    );
}
