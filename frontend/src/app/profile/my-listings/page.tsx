"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Listing, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Loader2, Plus, Pencil, Trash2, MapPin, Eye, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useListingAnalytics } from "@/hooks/use-listings";

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
                                        <Badge variant="secondary">
                                            {listing.category.name}
                                        </Badge>
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
                                        <div className="flex gap-2">
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
        </div>
    );
}
