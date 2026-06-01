"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMyRentals, useCancelRental } from "@/hooks/use-rentals";
import { useUploadImage } from "@/hooks/use-upload";
import { useOrCreateChat } from "@/hooks/use-chats";
import { usePayRental } from "@/hooks/use-wallet";
import { RentalStatusBadge } from "@/components/rental-status-badge";
import { ReviewDialog } from "@/components/review-dialog";
import { DisputeDialog } from "@/components/dispute-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Loader2,
    Calendar,
    MessageSquare,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    Upload,
    ImageIcon,
    QrCode,
    CreditCard,
    AlertTriangle,
    ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RentalRequest } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import api from "@/services/api";

// ─── helpers ────────────────────────────────────────────────────────────────

function calcProgress(startDate: string, endDate: string): number {
    const now = Date.now();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end <= start) return 100;
    const raw = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, raw));
}

function daysBetween(a: string, b: string): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round(
        (new Date(b).getTime() - new Date(a).getTime()) / msPerDay,
    );
}

function daysElapsed(startDate: string): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.max(
        0,
        Math.round((Date.now() - new Date(startDate).getTime()) / msPerDay),
    );
}

function fmt(iso: string): string {
    return new Date(iso).toLocaleDateString("ru-RU");
}

// ─── sub-components ─────────────────────────────────────────────────────────

interface ProgressBarProps {
    startDate: string;
    endDate: string;
}

function RentalProgressBar({ startDate, endDate }: ProgressBarProps) {
    const progress = calcProgress(startDate, endDate);
    const elapsed = Math.min(daysElapsed(startDate), daysBetween(startDate, endDate));
    const total = daysBetween(startDate, endDate);

    return (
        <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Прогресс аренды</span>
                <span>
                    {elapsed} дней из {total}
                </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

type TimelineStatus = "done" | "pending" | "failed";

interface TimelineStep {
    label: string;
    status: TimelineStatus;
    date?: string;
}

function buildTimeline(rental: RentalRequest): TimelineStep[] {
    const approvedDone =
        rental.status === "APPROVED" || rental.status === "COMPLETED";
    const approvedFailed =
        rental.status === "REJECTED" || rental.status === "CANCELLED";

    return [
        {
            label: "Заявка создана",
            status: "done",
            date: rental.created_at,
        },
        {
            label: "Одобрено",
            status: approvedDone
                ? "done"
                : approvedFailed
                  ? "failed"
                  : "pending",
        },
        {
            label: "Оплата",
            status: rental.payment_status === "PAID" ? "done" : "pending",
        },
        {
            label: "Завершено",
            status: rental.status === "COMPLETED" ? "done" : "pending",
        },
    ];
}

function Timeline({ rental }: { rental: RentalRequest }) {
    const steps = buildTimeline(rental);

    const circleClass: Record<TimelineStatus, string> = {
        done: "bg-green-500 border-green-500",
        pending: "bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600",
        failed: "bg-red-500 border-red-500",
    };

    const iconClass: Record<TimelineStatus, string> = {
        done: "text-white",
        pending: "text-gray-400",
        failed: "text-white",
    };

    const labelClass: Record<TimelineStatus, string> = {
        done: "text-gray-800 dark:text-gray-100 font-medium",
        pending: "text-gray-400",
        failed: "line-through text-red-500",
    };

    return (
        <div className="mt-4 pl-1">
            <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-4">
                {steps.map((step, i) => (
                    <li key={i} className="ml-4">
                        <span
                            className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border-2 ${circleClass[step.status]}`}
                        >
                            {step.status === "done" && (
                                <CheckCircle
                                    className={`h-3 w-3 ${iconClass[step.status]}`}
                                />
                            )}
                            {step.status === "pending" && (
                                <Clock
                                    className={`h-3 w-3 ${iconClass[step.status]}`}
                                />
                            )}
                            {step.status === "failed" && (
                                <span className="text-white text-xs font-bold leading-none">
                                    ✕
                                </span>
                            )}
                        </span>
                        <p className={`text-sm ${labelClass[step.status]}`}>
                            {step.label}
                        </p>
                        {step.date && (
                            <time className="text-xs text-gray-400">
                                {fmt(step.date)}
                            </time>
                        )}
                    </li>
                ))}
            </ol>
        </div>
    );
}

// ─── Return photos uploader ──────────────────────────────────────────────────

function ReturnPhotosUploader({ rental }: { rental: RentalRequest }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { mutateAsync: uploadImage, isPending: isUploading } = useUploadImage();
    const qc = useQueryClient();

    const { mutate: submitReturnImages, isPending: isSubmitting } = useMutation({
        mutationFn: (images: string[]) =>
            api.post(`/rental-requests/${rental.id}/return-images`, { images }).then((r) => r.data),
        onSuccess: () => {
            toast.success("Фото возврата загружены");
            void qc.invalidateQueries({ queryKey: ["rentals"] });
        },
        onError: (e: Error) => {
            toast.error(e.message ?? "Ошибка загрузки");
        },
    });

    const hasReturnImages = rental.return_images && rental.return_images.length > 0;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;

        const existing = rental.return_images?.length ?? 0;
        if (existing + files.length > 10) {
            toast.error("Максимум 10 фото возврата");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
        if (oversized.length > 0) {
            toast.error("Файл слишком большой. Максимум 10 МБ");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        try {
            const urls = await Promise.all(files.map((f) => uploadImage(f)));
            const merged = [...(rental.return_images ?? []), ...urls];
            submitReturnImages(merged);
        } catch {
            // error already toasted by useUploadImage
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="mt-3 border-t pt-3 space-y-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                Фото возврата
            </p>
            {hasReturnImages && (
                <div className="flex flex-wrap gap-2">
                    {rental.return_images.map((url, i) => (
                        <img
                            key={i}
                            src={url}
                            alt={`Фото возврата ${i + 1}`}
                            className="h-16 w-16 rounded object-cover border"
                        />
                    ))}
                </div>
            )}
            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading || isSubmitting}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isSubmitting}
                >
                    {(isUploading || isSubmitting) ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4 mr-2" />
                    )}
                    Загрузить фото возврата
                </Button>
            </div>
        </div>
    );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function MyRentalsPage() {
    const { data: rentals, isLoading } = useMyRentals();
    const { mutate: cancel, isPending: isCancelling } = useCancelRental();
    const { mutate: openChat } = useOrCreateChat();
    const { mutate: payRental, isPending: isPaying } = usePayRental();
    const { user } = useAuthStore();
    const router = useRouter();
    const [reviewRental, setReviewRental] = useState<RentalRequest | null>(null);
    const [disputeRental, setDisputeRental] = useState<RentalRequest | null>(null);
    const [expandedTimeline, setExpandedTimeline] = useState<Set<string>>(new Set());
    const [payingId, setPayingId] = useState<string | null>(null);

    function toggleTimeline(id: string) {
        setExpandedTimeline((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

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
                {rentals?.map((rental) => {
                    const isTimelineOpen = expandedTimeline.has(rental.id);

                    return (
                        <Card key={rental.id}>
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    {/* Фото */}
                                    <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        {rental.listing.images[0] ? (
                                            <img
                                                src={rental.listing.images[0].image_url}
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
                                            <RentalStatusBadge status={rental.status} />
                                        </div>

                                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {fmt(rental.start_date)} — {fmt(rental.end_date)}
                                        </div>

                                        {/* Progress bar — only for APPROVED rentals */}
                                        {rental.status === "APPROVED" && (
                                            <RentalProgressBar
                                                startDate={rental.start_date}
                                                endDate={rental.end_date}
                                            />
                                        )}

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="font-semibold text-blue-600">
                                                {Number(rental.total_price).toLocaleString()} ₸
                                            </span>
                                            <div className="flex gap-2 flex-wrap justify-end">
                                                {rental.status === "APPROVED" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openChat(rental.listing.owner_id, {
                                                                onSuccess: (chat) =>
                                                                    router.push(`/chats/${chat.id}`),
                                                            })
                                                        }
                                                    >
                                                        <MessageSquare className="h-4 w-4 mr-1" />
                                                        Написать владельцу
                                                    </Button>
                                                )}
                                                {rental.status === "APPROVED" &&
                                                    rental.payment_status === "PAID" &&
                                                    !rental.dispute && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                                            onClick={() => setDisputeRental(rental)}
                                                        >
                                                            <AlertTriangle className="h-4 w-4 mr-1" />
                                                            Открыть спор
                                                        </Button>
                                                    )}
                                                {rental.dispute && (
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-amber-300 text-amber-700"
                                                    >
                                                        <Link href="/disputes">
                                                            <ShieldAlert className="h-4 w-4 mr-1" />
                                                            {rental.dispute.status === "OPEN"
                                                                ? "Спор открыт"
                                                                : "Спор закрыт"}
                                                        </Link>
                                                    </Button>
                                                )}
                                                {rental.status === "PENDING" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => cancel(rental.id)}
                                                        disabled={isCancelling}
                                                    >
                                                        Отменить
                                                    </Button>
                                                )}

                                                {rental.status === "COMPLETED" &&
                                                    (() => {
                                                        const myReview = rental.reviews?.find(
                                                            (r) => r.author_id === user?.id,
                                                        );
                                                        return (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={!!myReview}
                                                                onClick={() => {
                                                                    if (!myReview) {
                                                                        setReviewRental(rental);
                                                                    }
                                                                }}
                                                            >
                                                                {myReview ? (
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
                                                        );
                                                    })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Оплата — для одобренных но неоплаченных */}
                                {rental.status === "APPROVED" && rental.payment_status === "UNPAID" && (
                                    <div className="mt-3 border-t pt-3 space-y-3">
                                        <div className="flex items-start gap-2 text-sm rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 px-3 py-2">
                                            <QrCode className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                                            <div className="flex-1">
                                                <p className="font-medium text-blue-900 dark:text-blue-200">
                                                    Оплата при встрече
                                                </p>
                                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                                                    Владелец покажет QR-код при передаче — отсканируйте телефоном, чтобы оплатить.
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            disabled={isPaying && payingId === rental.id}
                                            onClick={() => {
                                                setPayingId(rental.id);
                                                payRental(rental.id, {
                                                    onSuccess: () => {
                                                        toast.success("Оплата прошла успешно");
                                                        setPayingId(null);
                                                    },
                                                    onError: (e: Error) => {
                                                        toast.error(e.message ?? "Ошибка оплаты");
                                                        setPayingId(null);
                                                    },
                                                });
                                            }}
                                        >
                                            {isPaying && payingId === rental.id ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <CreditCard className="h-4 w-4 mr-2" />
                                            )}
                                            Оплатить сейчас
                                        </Button>
                                    </div>
                                )}

                                {/* Фото возврата — только для оплаченных аренд */}
                                {rental.status === "APPROVED" && rental.payment_status === "PAID" && (
                                    <ReturnPhotosUploader rental={rental} />
                                )}

                                {/* История toggle */}
                                <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleTimeline(rental.id)}
                                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {isTimelineOpen ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                        История
                                    </button>

                                    {isTimelineOpen && <Timeline rental={rental} />}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {reviewRental && (
                <ReviewDialog
                    rental={reviewRental}
                    showListingRating
                    onClose={() => setReviewRental(null)}
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
