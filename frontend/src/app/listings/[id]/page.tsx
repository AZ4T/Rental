"use client";

import { use, useState, useEffect, useRef } from "react";
import { useListing, useListingAvailability } from "@/hooks/use-listings";
import { saveRecentlyViewed } from "@/lib/recently-viewed";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Star, Calendar, Shield, Loader2, Heart, Eye, QrCode, X, GitCompareArrows, Flag, Crown } from "lucide-react";
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
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import QRCode from "qrcode";
import { useCompareStore } from "@/store/compare.store";
import { toast } from "sonner";
import { ReportModal } from "@/components/report-modal";

interface Props {
    params: Promise<{ id: string }>;
}

function QRModal({ url, onClose }: { url: string; onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            void QRCode.toCanvas(canvasRef.current, url, { width: 200 });
        }
    }, [url]);

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 flex flex-col items-center gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between w-full">
                    <h2 className="font-semibold">QR-код объявления</h2>
                    <button onClick={onClose}>
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>
                <canvas ref={canvasRef} />
                <p className="text-xs text-muted-foreground text-center max-w-[200px] break-all">
                    {url}
                </p>
            </div>
        </div>
    );
}

export default function ListingPage({ params }: Props) {
    const { id } = use(params);
    const { data: listing, isLoading, isError } = useListing(id);
    const { data: availability } = useListingAvailability(id);
    const { user, isAuthenticated } = useAuthStore();
    const [activeImage, setActiveImage] = useState(0);
    const [showRentalDialog, setShowRentalDialog] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const { data: favorites } = useMyFavorites();
    const { mutate: addFavorite } = useAddFavorite();
    const { mutate: removeFavorite } = useRemoveFavorite();
    const [copied, setCopied] = useState(false);
    const { data: similar } = useSimilarListings(
        id,
        listing?.category_id ?? "",
    );

    const { add: addCompare, remove: removeCompare, has: inCompareStore, validate: validateCompare } = useCompareStore();
    const isFavorited = favorites?.some((f) => f.listing_id === id);
    const isOwner = user?.id === listing?.owner_id;
    const [heartAnimating, setHeartAnimating] = useState(false);
    const inCompare = listing ? inCompareStore(listing.id) : false;
    const [showReport, setShowReport] = useState(false);

    // Выбор дат аренды
    const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);

    const handleRangeSelect = (range: DateRange | undefined, selectedDay: Date) => {
        if (!range && selectedRange?.from && !selectedRange.to) {
            // Повторный клик на ту же дату — однодневная аренда
            setSelectedRange({ from: selectedDay, to: selectedDay });
        } else {
            setSelectedRange(range);
        }
    };

    const calcDays =
        selectedRange?.from && selectedRange?.to
            ? Math.max(
                  1,
                  Math.ceil(
                      (selectedRange.to.getTime() - selectedRange.from.getTime()) /
                          (1000 * 60 * 60 * 24),
                  ),
              )
            : 0;
    const calcTotal =
        calcDays > 0 && listing
            ? calcDays * Number(listing.price) + Number(listing.deposit)
            : 0;
    const calcFromStr = selectedRange?.from
        ? selectedRange.from.toISOString().split("T")[0]
        : "";
    const calcToStr = selectedRange?.to
        ? selectedRange.to.toISOString().split("T")[0]
        : "";

    useEffect(() => {
        if (listing) saveRecentlyViewed(listing);
    }, [listing]);

    const bookedRanges =
        availability?.map((r) => ({
            from: new Date(r.start_date),
            to: new Date(r.end_date),
        })) ?? [];

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
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {listing.title}
                            </h1>
                            <Badge variant="secondary">
                                {listing.category.name}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <div className="flex items-center gap-1 text-gray-500">
                                <MapPin className="h-4 w-4" />
                                <span>{listing.city}</span>
                            </div>
                            {listing.rating_avg ? (
                                <div className="flex items-center gap-1 text-amber-500">
                                    <Star className="h-4 w-4 fill-amber-400" />
                                    <span className="font-semibold text-sm">{Number(listing.rating_avg).toFixed(1)}</span>
                                    <span className="text-gray-400 text-xs">({listing.reviews_count})</span>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400">нет оценок товара</span>
                            )}
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                                <Eye className="h-3.5 w-3.5" />
                                <span>{listing.views_count ?? 0} просмотров</span>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Цена в день
                                </span>
                                <span className="text-2xl font-bold text-blue-600">
                                    {Number(listing.price).toLocaleString()} ₸
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Залог
                                </span>
                                <span className="font-semibold">
                                    {Number(listing.deposit).toLocaleString()} ₸
                                </span>
                            </div>

                            {/* Расчёт стоимости */}
                            {!isOwner && (
                                <div className="border-t pt-3 space-y-2">
                                    {calcDays > 0 ? (
                                        <>
                                            <p className="text-xs font-medium text-muted-foreground">Расчёт стоимости</p>
                                            <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>{calcDays} дн. × {Number(listing.price).toLocaleString()} ₸</span>
                                                    <span>{(calcDays * Number(listing.price)).toLocaleString()} ₸</span>
                                                </div>
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>Залог</span>
                                                    <span>{Number(listing.deposit).toLocaleString()} ₸</span>
                                                </div>
                                                <div className="flex justify-between font-bold border-t pt-1">
                                                    <span>Итого</span>
                                                    <span className="text-blue-600">{calcTotal.toLocaleString()} ₸</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            Выберите даты на календаре ниже
                                        </p>
                                    )}
                                </div>
                            )}

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

                    {/* Владелец + Поделиться + QR */}
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <Link
                                        href={`/profile/${listing.owner.id}`}
                                        className="font-semibold hover:underline"
                                    >
                                        {listing.owner.name}
                                    </Link>
                                    {listing.owner.premium_until &&
                                        new Date(
                                            listing.owner.premium_until,
                                        ).getTime() > Date.now() && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 rounded-full">
                                                <Crown className="h-3 w-3" />
                                                Premium
                                            </span>
                                        )}
                                </div>
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

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    if (!listing) return;
                                    if (inCompare) {
                                        removeCompare(listing.id);
                                        toast.success("Убрано из сравнения");
                                        return;
                                    }
                                    const error = validateCompare(listing);
                                    if (error) { toast.error(error); return; }
                                    addCompare(listing);
                                    toast.success("Добавлено к сравнению");
                                }}
                                title={inCompare ? "Убрать из сравнения" : "Сравнить"}
                                className={`flex items-center gap-1.5 text-sm transition-colors ${inCompare ? "text-blue-600" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <GitCompareArrows className="h-4 w-4" />
                                <span>Сравнить</span>
                            </button>
                            {!isOwner && (
                                <button
                                    onClick={() => setShowReport(true)}
                                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                                    title="Пожаловаться"
                                >
                                    <Flag className="h-4 w-4" />
                                    <span>Пожаловаться</span>
                                </button>
                            )}
                            <button
                                onClick={() => setShowQR(true)}
                                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <QrCode className="h-4 w-4" />
                                <span>QR</span>
                            </button>
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
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-3">Описание</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                    {listing.description}
                </p>
            </div>

            {/* Календарь дат */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {isOwner ? "Занятые даты" : "Выберите даты аренды"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isOwner ? (
                        bookedRanges.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Нет забронированных дат
                            </p>
                        ) : (
                            <DayPicker
                                mode="multiple"
                                selected={bookedRanges.flatMap((r) => {
                                    const days: Date[] = [];
                                    const cur = new Date(r.from);
                                    while (cur <= r.to) {
                                        days.push(new Date(cur));
                                        cur.setDate(cur.getDate() + 1);
                                    }
                                    return days;
                                })}
                                disabled
                                showOutsideDays={false}
                            />
                        )
                    ) : (
                        <>
                            {bookedRanges.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-red-200 border border-red-400" />
                                    Занято
                                    <span className="inline-block w-3 h-3 rounded-sm bg-blue-200 border border-blue-400 ml-2" />
                                    Выбранный период
                                </div>
                            )}
                            <DayPicker
                                mode="range"
                                selected={selectedRange}
                                onSelect={handleRangeSelect}
                                disabled={[{ before: new Date() }, ...bookedRanges]}
                                modifiers={{ booked: bookedRanges }}
                                modifiersStyles={{
                                    booked: {
                                        backgroundColor: "#fef2f2",
                                        color: "#dc2626",
                                        textDecoration: "line-through",
                                        opacity: 0.8,
                                    },
                                }}
                                showOutsideDays={false}
                                numberOfMonths={2}
                            />
                            {calcDays > 0 && (
                                <div className="bg-muted rounded-lg p-3 space-y-1 text-sm border-t pt-4">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{calcDays} дн. × {Number(listing.price).toLocaleString()} ₸</span>
                                        <span>{(calcDays * Number(listing.price)).toLocaleString()} ₸</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Залог (возвратный)</span>
                                        <span>{Number(listing.deposit).toLocaleString()} ₸</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t pt-1">
                                        <span>Итого</span>
                                        <span className="text-blue-600">{calcTotal.toLocaleString()} ₸</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

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
                    initialStartDate={calcFromStr}
                    initialEndDate={calcToStr}
                    onClose={() => setShowRentalDialog(false)}
                />
            )}

            {showQR && (
                <QRModal
                    url={
                        typeof window !== "undefined"
                            ? window.location.href
                            : `https://rental.app/listings/${id}`
                    }
                    onClose={() => setShowQR(false)}
                />
            )}

            {showReport && listing && (
                <ReportModal
                    open={showReport}
                    onClose={() => setShowReport(false)}
                    type="LISTING"
                    targetId={listing.id}
                />
            )}
        </div>
    );
}
