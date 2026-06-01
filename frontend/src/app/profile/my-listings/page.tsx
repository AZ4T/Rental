"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Listing, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Loader2, Plus, Pencil, Trash2, MapPin, Eye, EyeOff, BarChart2, ChevronDown, ChevronUp, Sparkles, Rocket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useListingAnalytics, useSetListingVisibility } from "@/hooks/use-listings";
import { usePromoteListing } from "@/hooks/use-wallet";

function AnalyticsPanel({ listingId }: { listingId: string }) {
    const { data, isLoading } = useListingAnalytics(listingId);

    if (isLoading) {
        return (
            <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 mt-3 border-t">
            <div className="text-center">
                <p className="text-xs text-muted-foreground">Просмотры</p>
                <p className="font-bold text-lg">{data.views_count}</p>
            </div>
            <div className="text-center">
                <p className="text-xs text-muted-foreground">Заявки</p>
                <p className="font-bold text-lg">{data.total_requests}</p>
            </div>
            <div className="text-center">
                <p className="text-xs text-muted-foreground">Завершено</p>
                <p className="font-bold text-lg text-green-600">{data.completed}</p>
            </div>
            <div className="text-center">
                <p className="text-xs text-muted-foreground">Доход</p>
                <p className="font-bold text-lg text-blue-600">{Number(data.revenue).toLocaleString()} ₸</p>
            </div>
        </div>
    );
}

export default function MyListingsPage() {
    const queryClient = useQueryClient();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["listings", "my"],
        queryFn: () =>
            api
                .get<PaginatedResponse<Listing>>("/listings/my")
                .then((r) => r.data),
    });

    const { mutate: deleteListing, isPending: isDeleting } = useMutation({
        mutationFn: (id: string) => api.delete(`/listings/${id}`),
        onSuccess: () => {
            toast.success("Объявление удалено");
            setDeleteId(null);
            void queryClient.invalidateQueries({ queryKey: ["listings"] });
        },
        onError: () => toast.error("Ошибка удаления"),
    });

    const { mutate: setVisibility, isPending: isToggling } =
        useSetListingVisibility();
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const { mutate: promoteListing, isPending: isPromoting } = usePromoteListing();
    const [promoteId, setPromoteId] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Мои объявления</h1>
                <Button asChild size="sm">
                    <Link href="/listings/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Разместить
                    </Link>
                </Button>
            </div>

            {data?.data.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <p>У вас нет объявлений</p>
                    <Button asChild className="mt-4">
                        <Link href="/listings/create">Создать первое</Link>
                    </Button>
                </div>
            )}

            <div className="space-y-4">
                {data?.data.map((listing) => (
                    <Card key={listing.id}>
                        <CardContent className="p-4">
                            <div className="flex gap-4">
                                {/* Фото */}
                                <Link
                                    href={`/listings/${listing.id}`}
                                    className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
                                >
                                    {listing.images[0] ? (
                                        <img
                                            src={listing.images[0].image_url}
                                            alt={listing.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                            Нет фото
                                        </div>
                                    )}
                                </Link>

                                {/* Инфо */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <Link
                                            href={`/listings/${listing.id}`}
                                            className="font-semibold hover:underline truncate"
                                        >
                                            {listing.title}
                                        </Link>
                                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                            {listing.is_hidden && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-400 text-amber-700 dark:text-amber-300"
                                                >
                                                    Скрыто
                                                </Badge>
                                            )}
                                            {listing.promoted_until &&
                                                new Date(listing.promoted_until).getTime() >
                                                    Date.now() && (
                                                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 gap-1">
                                                        <Sparkles className="h-3 w-3" />
                                                        Featured
                                                    </Badge>
                                                )}
                                            <Badge variant="secondary">
                                                {listing.category.name}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{listing.city}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            <span>{listing.views_count ?? 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="font-semibold text-blue-600">
                                            {Number(
                                                listing.price,
                                            ).toLocaleString()}{" "}
                                            ₸/день
                                        </span>
                                        <div className="flex gap-2 flex-wrap justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                                title="Продвинуть на 7 дней"
                                                onClick={() => setPromoteId(listing.id)}
                                            >
                                                <Rocket className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setExpandedId(
                                                        expandedId === listing.id
                                                            ? null
                                                            : listing.id,
                                                    )
                                                }
                                            >
                                                <BarChart2 className="h-4 w-4 mr-1" />
                                                {expandedId === listing.id ? (
                                                    <ChevronUp className="h-3 w-3" />
                                                ) : (
                                                    <ChevronDown className="h-3 w-3" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title={
                                                    listing.is_hidden
                                                        ? "Показать в каталоге"
                                                        : "Скрыть из каталога"
                                                }
                                                disabled={
                                                    isToggling &&
                                                    togglingId === listing.id
                                                }
                                                onClick={() => {
                                                    setTogglingId(listing.id);
                                                    setVisibility(
                                                        {
                                                            id: listing.id,
                                                            hidden: !listing.is_hidden,
                                                        },
                                                        {
                                                            onSuccess: () => {
                                                                toast.success(
                                                                    listing.is_hidden
                                                                        ? "Объявление снова в каталоге"
                                                                        : "Объявление скрыто",
                                                                );
                                                                setTogglingId(null);
                                                            },
                                                            onError: (e) => {
                                                                toast.error(
                                                                    (e as Error)
                                                                        .message ??
                                                                        "Ошибка",
                                                                );
                                                                setTogglingId(null);
                                                            },
                                                        },
                                                    );
                                                }}
                                            >
                                                {isToggling &&
                                                togglingId === listing.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : listing.is_hidden ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Link
                                                    href={`/listings/${listing.id}/edit`}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    setDeleteId(listing.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {expandedId === listing.id && (
                                <AnalyticsPanel listingId={listing.id} />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <ConfirmDialog
                open={!!deleteId}
                title="Удалить объявление?"
                description="Объявление и все его фото будут удалены навсегда."
                isPending={isDeleting}
                onConfirm={() => {
                    if (deleteId) deleteListing(deleteId);
                }}
                onCancel={() => setDeleteId(null)}
            />

            <ConfirmDialog
                open={!!promoteId}
                title="Продвинуть объявление?"
                description="С баланса спишется 500 ₸. Объявление будет показываться в топе каталога 7 дней."
                confirmLabel="Продвинуть за 500 ₸"
                pendingLabel="Продвижение..."
                variant="default"
                isPending={isPromoting}
                onConfirm={() => {
                    if (promoteId)
                        promoteListing(promoteId, {
                            onSuccess: () => setPromoteId(null),
                        });
                }}
                onCancel={() => setPromoteId(null)}
            />
        </div>
    );
}
