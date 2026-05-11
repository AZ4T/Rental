"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useListings } from "@/hooks/use-listings";
import { ListingCard } from "@/components/listing-card";
import { ListingsFilters } from "@/components/listings-filters";
import { Button } from "@/components/ui/button";
import { ListingFilters } from "@/types";
import { ListingsGridSkeleton } from "@/components/listing-card-skeleton";

function HomeContent() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get("search") ?? "";

    const [filters, setFilters] = useState<ListingFilters>({
        page: 1,
        limit: 12,
        search: initialSearch || undefined,
    });

    useEffect(() => {
        const search = searchParams.get("search") ?? "";
        setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
    }, [searchParams]);

    const { data, isLoading, isError } = useListings(filters);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Объявления</h1>

            <ListingsFilters filters={filters} onChange={setFilters} />

            {isLoading && <ListingsGridSkeleton />}

            {isError && (
                <div className="text-center py-20 text-red-500">
                    Ошибка загрузки объявлений
                </div>
            )}

            {data && (
                <>
                    {data.data.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            Объявлений не найдено
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {data.data.map((listing) => (
                                <ListingCard
                                    key={listing.id}
                                    listing={listing}
                                />
                            ))}
                        </div>
                    )}

                    {data.meta.total_pages > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                variant="outline"
                                disabled={filters.page === 1}
                                onClick={() =>
                                    setFilters((f) => ({
                                        ...f,
                                        page: (f.page ?? 1) - 1,
                                    }))
                                }
                            >
                                Назад
                            </Button>
                            <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                                {filters.page} / {data.meta.total_pages}
                            </span>
                            <Button
                                variant="outline"
                                disabled={
                                    filters.page === data.meta.total_pages
                                }
                                onClick={() =>
                                    setFilters((f) => ({
                                        ...f,
                                        page: (f.page ?? 1) + 1,
                                    }))
                                }
                            >
                                Вперёд
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function HomePage() {
    return (
        <Suspense>
            <HomeContent />
        </Suspense>
    );
}
