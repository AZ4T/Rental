"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListingFilters } from "@/types";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Category } from "@/types";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { CityInput } from "@/components/city-input";
import { Slider } from "@/components/ui/slider";
import { useTranslations } from "next-intl";

interface ListingsFiltersProps {
    filters: ListingFilters;
    onChange: (filters: ListingFilters) => void;
}

export function ListingsFilters({ filters, onChange }: ListingsFiltersProps) {
    const t = useTranslations("Home");
    const tCommon = useTranslations("Common");
    const [search, setSearch] = useState(filters.search ?? "");
    const [city, setCity] = useState(filters.city ?? "");
    const [priceRange, setPriceRange] = useState([0, 100000]);

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get<Category[]>("/categories").then((r) => r.data),
    });

    const { data: priceRangeData } = useQuery({
        queryKey: ["price-range"],
        queryFn: () =>
            api
                .get<{ min: number; max: number }>("/listings/price-range")
                .then((r) => r.data),
    });

    // Seed slider from server bounds ONCE so a later refetch doesn't snap the
    // user's adjusted slider back to default. Active filter values take
    // precedence over the bare server bounds.
    const seededRangeRef = useRef(false);
    useEffect(() => {
        if (priceRangeData && !seededRangeRef.current) {
            setPriceRange([
                filters.price_min ?? priceRangeData.min,
                filters.price_max ?? priceRangeData.max,
            ]);
            seededRangeRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceRangeData]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange({ ...filters, search, page: 1 });
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const reset = () => {
        setSearch("");
        setCity("");
        setPriceRange([
            priceRangeData?.min ?? 0,
            priceRangeData?.max ?? 100000,
        ]);
        onChange({ page: 1, limit: 12 });
    };

    const hasFilters =
        filters.search ||
        filters.category_ids?.length ||
        filters.city ||
        filters.price_min ||
        filters.price_max;

    return (
        <div className="space-y-4">
            {/* Строка поиска + сортировка + город */}
            <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[140px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("searchPlaceholder")}
                        className="pl-9 h-10" // ← добавь h-10
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="min-w-[120px]">
                    <CityInput
                        value={city}
                        onChange={(val) => {
                            setCity(val);
                            onChange({ ...filters, city: val, page: 1 });
                        }}
                        placeholder={t("filterCity")}
                    />
                </div>

                <div className="relative">
                    <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select
                        className="pl-9 pr-4 h-10 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none"
                        value={`${filters.sortBy ?? "created_at"}|${filters.sortOrder ?? "desc"}`}
                        onChange={(e) => {
                            const [sortBy, sortOrder] = e.target.value.split(
                                "|",
                            ) as [
                                "price" | "created_at" | "rating_avg" | "views_count",
                                "asc" | "desc",
                            ];
                            onChange({
                                ...filters,
                                sortBy,
                                sortOrder,
                                page: 1,
                            });
                        }}
                    >
                        <option value="created_at|desc">{t("sortNewest")}</option>
                        <option value="created_at|asc">{t("sortOldest")}</option>
                        <option value="price|asc">{t("sortPriceAsc")}</option>
                        <option value="price|desc">{t("sortPriceDesc")}</option>
                        <option value="rating_avg|desc">{t("sortRating")}</option>
                        <option value="views_count|desc">{t("sortViews")}</option>
                    </select>
                </div>

                {hasFilters && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={reset}
                        className="h-10"
                    >
                        <X className="h-4 w-4 mr-1" />
                        {tCommon("reset")}
                    </Button>
                )}
            </div>

            {/* Категории */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <Button
                    variant={
                        !filters.category_ids?.length ? "default" : "outline"
                    }
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() =>
                        onChange({ ...filters, category_ids: [], page: 1 })
                    }
                >
                    {tCommon("all")}
                </Button>
                {categories?.map((cat) => {
                    const isSelected = filters.category_ids?.includes(cat.id);
                    return (
                        <Button
                            key={cat.id}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="flex-shrink-0 gap-1.5"
                            onClick={() => {
                                const current = filters.category_ids ?? [];
                                const updated = isSelected
                                    ? current.filter((id) => id !== cat.id)
                                    : [...current, cat.id];
                                onChange({
                                    ...filters,
                                    category_ids: updated,
                                    page: 1,
                                });
                            }}
                        >
                            {cat.name}
                            {cat._count && (
                                <span
                                    className={`text-xs ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                                >
                                    {cat._count.listings}
                                </span>
                            )}
                        </Button>
                    );
                })}
            </div>

            {/* Слайдер цены */}
            <div className="w-full bg-muted rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                        {t("filterPrice")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {priceRange[0].toLocaleString()} ₸ —{" "}
                        {priceRange[1].toLocaleString()} ₸
                    </span>
                </div>
                <Slider
                    min={priceRangeData?.min ?? 0}
                    max={priceRangeData?.max ?? 100000}
                    step={500}
                    value={priceRange}
                    onValueChange={(val) => setPriceRange(val)}
                    onValueCommit={(val) => {
                        onChange({
                            ...filters,
                            price_min: val[0],
                            price_max: val[1],
                            page: 1,
                        });
                    }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{(priceRangeData?.min ?? 0).toLocaleString()} ₸</span>
                    <span>
                        {(priceRangeData?.max ?? 100000).toLocaleString()} ₸
                    </span>
                </div>
            </div>
        </div>
    );
}
