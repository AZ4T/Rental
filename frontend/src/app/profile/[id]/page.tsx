"use client";

import { use, useState } from "react";
import { useUser } from "@/hooks/use-profile";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Review } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Loader2, Flag } from "lucide-react";
import Link from "next/link";
import { useUserListings } from "@/hooks/use-listings";
import { ListingCard } from "@/components/listing-card";
import { useAuthStore } from "@/store/auth.store";
import { ReportModal } from "@/components/report-modal";

interface Props {
    params: Promise<{ id: string }>;
}

export default function UserProfilePage({ params }: Props) {
    const { id } = use(params);
    const { data: user, isLoading } = useUser(id);
    const { data: userListings } = useUserListings(id);
    const { user: me } = useAuthStore();
    const [reportOpen, setReportOpen] = useState(false);

    const { data: reviews } = useQuery({
        queryKey: ["reviews", id],
        queryFn: () =>
            api.get<Review[]>(`/reviews/user/${id}`).then((r) => r.data),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user)
        return <div className="text-center py-20">Пользователь не найден</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Профиль */}
            <Card>
                <CardContent className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user.avatar_url ?? ""} />
                        <AvatarFallback className="text-2xl">
                            {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">{user.name}</h1>
                        {user.rating_avg && (
                            <div className="flex items-center gap-1 mt-2 text-sm">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">
                                    {Number(user.rating_avg).toFixed(1)}
                                </span>
                                <span className="text-gray-500">
                                    — {user.reviews_count} отзывов
                                </span>
                            </div>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                            На платформе с{" "}
                            {new Date(user.created_at).toLocaleDateString("ru-RU")}
                        </p>
                    </div>
                    {me && me.id !== id && (
                        <button
                            onClick={() => setReportOpen(true)}
                            className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                            <Flag className="h-3.5 w-3.5" />
                            Пожаловаться
                        </button>
                    )}
                </CardContent>
            </Card>

            <ReportModal
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                type="USER"
                targetId={id}
            />

            {/* Объявления пользователя */}
            {userListings && userListings.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        Объявления ({userListings.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userListings.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                </div>
            )}

            {/* Отзывы */}
            <div>
                <h2 className="text-xl font-semibold mb-4">
                    Отзывы ({reviews?.length ?? 0})
                </h2>
                {reviews?.length === 0 && (
                    <p className="text-gray-500">Отзывов пока нет</p>
                )}
                <div className="space-y-3">
                    {reviews?.map((review) => (
                        <Card key={review.id}>
                            <CardContent className="p-4 space-y-3">
                                {/* Автор + рейтинг */}
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={review.author.avatar_url ?? ""}
                                        />
                                        <AvatarFallback>
                                            {review.author.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">
                                            {review.author.name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex">
                                                {Array.from({ length: 5 }).map(
                                                    (_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-3 w-3 ${
                                                                i <
                                                                review.rating
                                                                    ? "fill-yellow-400 text-yellow-400"
                                                                    : "text-gray-300"
                                                            }`}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {new Date(
                                                    review.created_at,
                                                ).toLocaleDateString("ru-RU")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Объявление */}
                                {review.rentalRequest?.listing && (
                                    <Link
                                        href={`/listings/${review.rentalRequest.listing.id}`}
                                        className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                                            {review.rentalRequest.listing
                                                .images[0] ? (
                                                <img
                                                    src={
                                                        review.rentalRequest
                                                            .listing.images[0]
                                                            .image_url
                                                    }
                                                    alt={
                                                        review.rentalRequest
                                                            .listing.title
                                                    }
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {review.rentalRequest.listing.title}
                                        </p>
                                    </Link>
                                )}

                                {/* Комментарий */}
                                {review.comment && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {review.comment}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
