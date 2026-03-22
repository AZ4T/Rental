"use client";

import { useIncomingRentals, useUpdateRentalStatus } from "@/hooks/use-rentals";
import { RentalStatusBadge } from "@/components/rental-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function IncomingRentalsPage() {
    const { data: rentals, isLoading } = useIncomingRentals();
    const { mutate: updateStatus, isPending } = useUpdateRentalStatus();

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Входящие заявки</h1>

            {rentals?.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Заявок пока нет</p>
                </div>
            )}

            <div className="space-y-4">
                {rentals?.map((rental) => (
                    <Card key={rental.id}>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex gap-4">
                                {/* Фото */}
                                <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                    {rental.listing?.images?.[0] ? (
                                        <img
                                            src={
                                                rental.listing?.images?.[0]
                                                    ?.image_url
                                            }
                                            alt={rental.listing?.title ?? ""}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                            Нет фото
                                        </div>
                                    )}
                                </div>

                                {/* Инфо */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <Link
                                            href={`/listings/${rental.listing?.id}`}
                                            className="font-semibold hover:underline truncate"
                                        >
                                            {rental.listing?.title}
                                        </Link>
                                        <RentalStatusBadge
                                            status={rental.status}
                                        />
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(
                                            rental.start_date,
                                        ).toLocaleDateString("ru-RU")}{" "}
                                        —{" "}
                                        {new Date(
                                            rental.end_date,
                                        ).toLocaleDateString("ru-RU")}
                                    </div>
                                    <span className="font-semibold text-blue-600 text-sm">
                                        {Number(
                                            rental.total_price,
                                        ).toLocaleString()}{" "}
                                        ₸
                                    </span>
                                </div>
                            </div>

                            {/* Арендатор */}
                            {rental.renter && (
                                <div className="flex items-center gap-2 pt-2 border-t">
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage
                                            src={rental.renter.avatar_url ?? ""}
                                        />
                                        <AvatarFallback>
                                            {rental.renter.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Link
                                        href={`/profile/${rental.renter.id}`}
                                        className="text-sm font-medium hover:underline"
                                    >
                                        {rental.renter.name}
                                    </Link>
                                </div>
                            )}

                            {/* Кнопки действий */}
                            {rental.status === "PENDING" && (
                                <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                        className="flex-1"
                                        size="sm"
                                        onClick={() =>
                                            updateStatus({
                                                id: rental.id,
                                                status: "APPROVED",
                                            })
                                        }
                                        disabled={isPending}
                                    >
                                        Одобрить
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        size="sm"
                                        onClick={() =>
                                            updateStatus({
                                                id: rental.id,
                                                status: "REJECTED",
                                            })
                                        }
                                        disabled={isPending}
                                    >
                                        Отклонить
                                    </Button>
                                </div>
                            )}
                            {rental.status === "APPROVED" && (
                                <div className="pt-2 border-t">
                                    <Button
                                        className="w-full"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            updateStatus({
                                                id: rental.id,
                                                status: "COMPLETED",
                                            })
                                        }
                                        disabled={isPending}
                                    >
                                        Завершить аренду
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
