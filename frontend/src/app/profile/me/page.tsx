"use client";

import { useState } from "react";
import { useMe, useUpdateProfile } from "@/hooks/use-profile";
import { useUploadImage } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Camera, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import api from "@/services/api";
import { Review } from "@/types";
import Link from "next/link";

export default function MyProfilePage() {
    const { data: user, isLoading } = useMe();
    const { mutate: updateProfile, isPending } = useUpdateProfile();
    const { mutateAsync: uploadImage, isPending: isUploading } =
        useUploadImage();
    const [name, setName] = useState("");
    const { user: authUser } = useAuthStore();
    const { data: reviews } = useQuery({
        queryKey: ["reviews", authUser?.id],
        queryFn: () =>
            api
                .get<Review[]>(`/reviews/user/${authUser?.id}`)
                .then((r) => r.data),
        enabled: !!authUser?.id,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) return null;

    const handleAvatarUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = await uploadImage(file);
        updateProfile({ avatar_url: url });
    };

    const handleSave = () => {
        if (name.trim()) {
            updateProfile({ name: name.trim() });
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Мой профиль</h1>

            <Card>
                <CardContent className="p-6">
                    {/* Аватар */}
                    <div className="flex items-center gap-6 mb-6">
                        <div className="relative">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user.avatar_url ?? ""} />
                                <AvatarFallback className="text-2xl">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 cursor-pointer hover:bg-blue-700">
                                {isUploading ? (
                                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-3 w-3 text-white" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {user.name}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {user.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">{user.role}</Badge>
                                {user.rating_avg && (
                                    <div className="flex items-center gap-1 text-sm">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span>
                                            {Number(user.rating_avg).toFixed(1)}
                                        </span>
                                        <span className="text-gray-500">
                                            ({user.reviews_count})
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Редактирование */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label>Имя</Label>
                            <Input
                                defaultValue={user.name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={user.name}
                            />
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={isPending || !name.trim()}
                        >
                            {isPending ? "Сохраняем..." : "Сохранить"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

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
                                        className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors"
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
                                        <p className="text-sm text-gray-600 truncate">
                                            {review.rentalRequest.listing.title}
                                        </p>
                                    </Link>
                                )}

                                {/* Комментарий */}
                                {review.comment && (
                                    <p className="text-sm text-gray-600">
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
