"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useListings } from "@/hooks/use-listings";
import { ListingCard } from "@/components/listing-card";
import { ListingsFilters } from "@/components/listings-filters";
import { Button } from "@/components/ui/button";
import { ListingFilters } from "@/types";
import { ListingsGridSkeleton } from "@/components/listing-card-skeleton";
import { MapView } from "@/components/map-view";
import { Bookmark, X, LayoutGrid, Map } from "lucide-react";
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

function searchKey(filters: ListingFilters): string {
    return JSON.stringify({
        s: filters.search ?? "",
        c: filters.city ?? "",
        pm: filters.price_min ?? null,
        px: filters.price_max ?? null,
        cat: filters.category_ids?.slice().sort() ?? [],
        sb: filters.sortBy ?? "",
        so: filters.sortOrder ?? "",
    });
}

function saveSearch(filters: ListingFilters): boolean {
    const searches = getSavedSearches();
    const key = searchKey(filters);
    if (searches.some((s) => searchKey(s.filters) === key)) {
        return false; // Already saved
    }
    const label =
        [
            filters.search,
            filters.city,
            filters.price_min !== undefined ? `от ${filters.price_min} ₸` : null,
            filters.price_max !== undefined ? `до ${filters.price_max} ₸` : null,
        ]
            .filter(Boolean)
            .join(", ") || "Все объявления";
    const updated = [
        {
            id: Date.now().toString(),
            label,
            filters: { ...filters, page: 1 },
            savedAt: new Date().toISOString(),
        },
        ...searches,
    ].slice(0, 5);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
    return true;
}

function removeSavedSearch(id: string): void {
    const searches = getSavedSearches().filter((s) => s.id !== id);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
}

function filtersFromParams(params: URLSearchParams): ListingFilters {
    const catIds = params.get("category_ids");
    return {
        page: Number(params.get("page")) || 1,
        limit: Number(params.get("limit")) || 12,
        search: params.get("search") || undefined,
        city: params.get("city") || undefined,
        price_min: params.get("price_min") ? Number(params.get("price_min")) : undefined,
        price_max: params.get("price_max") ? Number(params.get("price_max")) : undefined,
        category_ids: catIds ? catIds.split(",") : undefined,
        sortBy: (params.get("sortBy") as ListingFilters["sortBy"]) || undefined,
        sortOrder: (params.get("sortOrder") as ListingFilters["sortOrder"]) || undefined,
    };
}

function paramsFromFilters(filters: ListingFilters): string {
    const p = new URLSearchParams();
    if (filters.search) p.set("search", filters.search);
    if (filters.city) p.set("city", filters.city);
    if (filters.price_min !== undefined) p.set("price_min", String(filters.price_min));
    if (filters.price_max !== undefined) p.set("price_max", String(filters.price_max));
    if (filters.category_ids?.length) p.set("category_ids", filters.category_ids.join(","));
    if (filters.sortBy) p.set("sortBy", filters.sortBy);
    if (filters.sortOrder) p.set("sortOrder", filters.sortOrder);
    if (filters.page && filters.page !== 1) p.set("page", String(filters.page));
    return p.toString();
}

function ListingsCatalog() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [filters, setFilters] = useState<ListingFilters>(() =>
        filtersFromParams(new URLSearchParams(searchParams.toString())),
    );

    const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

    useEffect(() => {
        setSavedSearches(getSavedSearches());
    }, []);

    // Sync filters → URL so the state is bookmarkable / shareable and the back
    // button works. Use replace to avoid one history entry per keystroke.
    useEffect(() => {
        const next = paramsFromFilters(filters);
        const current = searchParams.toString();
        if (next !== current) {
            router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
        }
    }, [filters, pathname, router, searchParams]);

    const { data, isLoading, isError } = useListings(
        viewMode === "map" ? { ...filters, limit: 100 } : filters,
    );

    const hasActiveFilters =
        filters.search ||
        filters.city ||
        filters.price_min !== undefined ||
        filters.price_max !== undefined ||
        (filters.category_ids && filters.category_ids.length > 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Объявления</h1>
                    {data && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {data.meta.total.toLocaleString()} объявлений
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === "grid"
                                ? "bg-background shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Сетка
                    </button>
                    <button
                        onClick={() => setViewMode("map")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === "map"
                                ? "bg-background shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Map className="h-4 w-4" />
                        Карта
                    </button>
                </div>
            </div>

            <ListingsFilters filters={filters} onChange={setFilters} />

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
                                onClick={() => setFilters(s.filters)}
                                className="hover:text-blue-600 transition-colors"
                            >
                                {s.label}
                            </button>
                            <button
                                onClick={() => {
                                    removeSavedSearch(s.id);
                                    setSavedSearches(getSavedSearches());
                                }}
                                className="text-muted-foreground hover:text-red-500 ml-1"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {hasActiveFilters && (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const saved = saveSearch(filters);
                            setSavedSearches(getSavedSearches());
                            if (saved) {
                                toast.success("Поиск сохранён");
                            } else {
                                toast.info("Такой поиск уже сохранён");
                            }
                        }}
                    >
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
                    ) : viewMode === "map" ? (
                        <MapView listings={data.data} />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {data.data.map((listing) => (
                                    <ListingCard
                                        key={listing.id}
                                        listing={listing}
                                    />
                                ))}
                            </div>

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
                                            filters.page ===
                                            data.meta.total_pages
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
                </>
            )}
        </div>
    );
}

export default function ListingsPage() {
    return (
        <Suspense>
            <ListingsCatalog />
        </Suspense>
    );
}
