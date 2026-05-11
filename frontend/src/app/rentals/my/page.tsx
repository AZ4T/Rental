"use client";

import { useState } from "react";
import { useMyRentals, useCancelRental } from "@/hooks/use-rentals";
import { usePayRental } from "@/hooks/use-wallet";
import { RentalStatusBadge } from "@/components/rental-status-badge";
import { ReviewDialog } from "@/components/review-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Calendar, MessageSquare, CheckCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { RentalRequest } from "@/types";

export default function MyRentalsPage() {
    const { data: rentals, isLoading } = useMyRentals();
    const { mutate: cancel, isPending: isCancelling } = useCancelRental();
    const { mutate: pay, isPending: isPaying } = usePayRental();
    const [reviewRental, setReviewRental] = useState<RentalRequest | null>(
        null,
    );

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Мои заявки на аренду</h1>

            {rentals?.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>У вас нет заявок на аренду</p>
                    <Button asChild className="mt-4">
                        <Link href="/">Найти объявления</Link>
                    </Button>
                </div>
            )}

            <div className="space-y-4">
                {rentals?.map((rental) => (
                    <Card key={rental.id}>
                        <CardContent className="p-4">
                            <div className="flex gap-4">
                                {/* Фото */}
                                <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    {rental.listing.images[0] ? (
                                        <img
                                            src={
                                                rental.listing.images[0]
                                                    .image_url
                                            }
                                            alt={rental.listing.title}
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
                                            href={`/listings/${rental.listing.id}`}
                                            className="font-semibold hover:underline truncate"
                                        >
                                            {rental.listing.title}
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
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="font-semibold text-blue-600">
                                            {Number(
                                                rental.total_price,
                                            ).toLocaleString()}{" "}
                                            ₸
                                        </span>
                                        <div className="flex gap-2">
                                            {rental.status === "APPROVED" && rental.payment_status === "UNPAID" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        pay(rental.id, {
                                                            onSuccess: () => toast.success("Оплата прошла успешно!"),
                                                            onError: (e: Error) => toast.error(e.message ?? "Ошибка оплаты"),
                                                        })
                                                    }
                                                    disabled={isPaying}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CreditCard className="h-4 w-4 mr-2" />
                                                    Оплатить
                                                </Button>
                                            )}
                                            {rental.status === "PENDING" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        cancel(rental.id)
                                                    }
                                                    disabled={isCancelling}
                                                >
                                                    Отменить
                                                </Button>
                                            )}
                                            {rental.status === "COMPLETED" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!!rental.review}
                                                    onClick={() => {
                                                        if (!rental.review) {
                                                            setReviewRental(
                                                                rental,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {rental.review ? (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                                            Отзыв оставлен
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MessageSquare className="h-4 w-4 mr-2" />
                                                            Оставить отзыв
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {reviewRental && (
                <ReviewDialog
                    rental={reviewRental}
                    onClose={() => setReviewRental(null)}
                />
            )}
        </div>
    );
}
