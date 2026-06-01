"use client";

import { useEffect, useState } from "react";
import { useIncomingRentals, useUpdateRentalStatus, useMarkIncomingSeen } from "@/hooks/use-rentals";
import { useOrCreateChat } from "@/hooks/use-chats";
import { RentalStatusBadge } from "@/components/rental-status-badge";
import { ReviewDialog } from "@/components/review-dialog";
import { DisputeDialog } from "@/components/dispute-dialog";
import { QrModal } from "@/components/qr-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Calendar, MessageCircle, CheckCircle, Clock, Star, QrCode, AlertTriangle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RentalRequest } from "@/types";
import { PLATFORM_FEE_RATE } from "@/lib/platform";

export default function IncomingRentalsPage() {
    const { data: rentals, isLoading } = useIncomingRentals();
    const { mutate: updateStatus, isPending } = useUpdateRentalStatus();
    const { mutate: openChat, isPending: isChatPending } = useOrCreateChat();
    const { mutate: markSeen } = useMarkIncomingSeen();
    const [reviewRental, setReviewRental] = useState<RentalRequest | null>(null);
    const [disputeRental, setDisputeRental] = useState<RentalRequest | null>(null);
    const [qrRentalId, setQrRentalId] = useState<string | null>(null);
    const router = useRouter();

    // Clear the "new requests" badge on page open
    useEffect(() => {
        markSeen();
    }, [markSeen]);

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
                                <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
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
                                    <div className="text-sm">
                                        <span className="font-semibold text-blue-600">
                                            {Number(rental.total_price).toLocaleString()} ₸
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            (вам после комиссии:{" "}
                                            {Math.round(
                                                Number(rental.total_price) * (1 - PLATFORM_FEE_RATE),
                                            ).toLocaleString()}{" "}
                                            ₸)
                                        </span>
                                    </div>
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
                                <div className="pt-2 border-t space-y-2">
                                    <div className="flex items-center gap-2">
                                        {rental.payment_status === "PAID" ? (
                                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
                                                <CheckCircle className="h-3 w-3" /> Оплачено
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-orange-500 border-orange-300 gap-1">
                                                <Clock className="h-3 w-3" /> Ожидает оплаты
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {rental.renter && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                disabled={isChatPending}
                                                onClick={() =>
                                                    openChat(rental.renter!.id, {
                                                        onSuccess: (chat) => router.push(`/chats/${chat.id}`),
                                                        onError: () => toast.error("Не удалось открыть чат"),
                                                    })
                                                }
                                            >
                                                <MessageCircle className="h-4 w-4 mr-2" />
                                                Написать арендатору
                                            </Button>
                                        )}
                                        {rental.payment_status === "UNPAID" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setQrRentalId(rental.id)}
                                            >
                                                <QrCode className="h-4 w-4 mr-1" />
                                                QR
                                            </Button>
                                        )}
                                        <div className="flex-1 flex flex-col gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full"
                                                onClick={() =>
                                                    updateStatus({
                                                        id: rental.id,
                                                        status: "COMPLETED",
                                                    })
                                                }
                                                disabled={
                                                    isPending ||
                                                    rental.payment_status !== "PAID" ||
                                                    !rental.return_images?.length ||
                                                    !!rental.dispute
                                                }
                                            >
                                                Завершить аренду
                                            </Button>
                                            {rental.payment_status === "PAID" && !rental.return_images?.length && (
                                                <p className="text-xs text-muted-foreground text-center">
                                                    Ожидается фото возврата от арендатора
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {rental.payment_status === "PAID" &&
                                        !rental.dispute && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                                onClick={() => setDisputeRental(rental)}
                                            >
                                                <AlertTriangle className="h-4 w-4 mr-1" />
                                                Открыть спор
                                            </Button>
                                        )}
                                    {rental.dispute && (
                                        <Link
                                            href="/disputes"
                                            className="inline-flex items-center justify-center gap-1 text-sm text-amber-700 hover:underline"
                                        >
                                            <ShieldAlert className="h-4 w-4" />
                                            {rental.dispute.status === "OPEN"
                                                ? "Спор открыт — ожидает решения админа"
                                                : "Спор закрыт"}
                                        </Link>
                                    )}
                                </div>
                            )}
                            {rental.status === "COMPLETED" && rental.renter && (() => {
                                const myReview = rental.reviews?.find(r => r.target_user_id === rental.renter!.id);
                                return (
                                    <div className="pt-2 border-t">
                                        {myReview ? (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                                Вы оставили отзыв об арендаторе
                                            </p>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setReviewRental(rental)}
                                            >
                                                <Star className="h-4 w-4 mr-2" />
                                                Оценить арендатора
                                            </Button>
                                        )}
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {reviewRental && reviewRental.renter && (
                <ReviewDialog
                    rental={reviewRental}
                    dialogTitle="Оценить арендатора"
                    onClose={() => setReviewRental(null)}
                />
            )}

            {qrRentalId && (
                <QrModal
                    rentalId={qrRentalId}
                    open={!!qrRentalId}
                    onClose={() => setQrRentalId(null)}
                />
            )}

            {disputeRental && (
                <DisputeDialog
                    rental={disputeRental}
                    open={!!disputeRental}
                    onClose={() => setDisputeRental(null)}
                />
            )}
        </div>
    );
}
