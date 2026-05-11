"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useListings } from "@/hooks/use-listings";
import { ListingCard } from "@/components/listing-card";
import { ListingsFilters } from "@/components/listings-filters";
import { Button } from "@/components/ui/button";
import { ListingFilters } from "@/types";
import { ListingsGridSkeleton } from "@/components/listing-card-skeleton";
import { Bookmark, X } from "lucide-react";
import { toast } from "sonner";

const SAVED_SEARCHES_KEY = "saved_searches";

interface SavedSearch {
    id: string;
    label: string;
    filters: ListingFilters;
    savedAt: string;
}

function getSavedSearches(): SavedSearch[] {
    try {
        const raw = localStorage.getItem(SAVED_SEARCHES_KEY);
        return raw ? (JSON.parse(raw) as SavedSearch[]) : [];
    } catch {
        return [];
    }
}

function saveSearch(filters: ListingFilters): void {
    const searches = getSavedSearches();
    const label = [
        filters.search,
        filters.city,
        filters.price_min !== undefined ? `от ${filters.price_min} ₸` : null,
        filters.price_max !== undefined ? `до ${filters.price_max} ₸` : null,
    ]
        .filter(Boolean)
        .join(", ") || "Все объявления";

    const newSearch: SavedSearch = {
        id: Date.now().toString(),
        label,
        filters: { ...filters, page: 1 },
        savedAt: new Date().toISOString(),
    };
    const updated = [newSearch, ...searches].slice(0, 5);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
}

function removeSavedSearch(id: string): void {
    const searches = getSavedSearches().filter((s) => s.id !== id);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
}

function HomeContent() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get("search") ?? "";

    const [filters, setFilters] = useState<ListingFilters>({
        page: 1,
        limit: 12,
        search: initialSearch || undefined,
    });

    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

    useEffect(() => {
        setSavedSearches(getSavedSearches());
    }, []);

    useEffect(() => {
        const search = searchParams.get("search") ?? "";
        setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
    }, [searchParams]);

    const { data, isLoading, isError } = useListings(filters);

    const handleSaveSearch = () => {
        saveSearch(filters);
        setSavedSearches(getSavedSearches());
        toast.success("Поиск сохранён");
    };

    const handleRemoveSaved = (id: string) => {
        removeSavedSearch(id);
        setSavedSearches(getSavedSearches());
    };

    const handleApplySaved = (saved: SavedSearch) => {
        setFilters(saved.filters);
    };

    const hasActiveFilters =
        filters.search ||
        filters.city ||
        filters.price_min !== undefined ||
        filters.price_max !== undefined ||
        (filters.category_ids && filters.category_ids.length > 0);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Объявления</h1>

            <ListingsFilters filters={filters} onChange={setFilters} />

            {/* Сохранённые поиски */}
            {savedSearches.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Bookmark className="h-3.5 w-3.5" />
                        Сохранённые:
                    </span>
                    {savedSearches.map((s) => (
                        <div
                            key={s.id}
                            className="flex items-center gap-1 bg-muted rounded-full px-3 py-1 text-sm"
                        >
                            <button
                                onClick={() => handleApplySaved(s)}
                                className="hover:text-blue-600 transition-colors"
                            >
                                {s.label}
                            </button>
                            <button
                                onClick={() => handleRemoveSaved(s.id)}
                                className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Кнопка сохранения поиска */}
            {hasActiveFilters && (
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleSaveSearch}>
                        <Bookmark className="h-4 w-4 mr-2" />
                        Сохранить поиск
                    </Button>
                </div>
            )}

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
