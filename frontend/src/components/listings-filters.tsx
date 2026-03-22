"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListingFilters } from "@/types";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Category } from "@/types";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { CityInput } from "@/components/city-input";
import { Slider } from "@/components/ui/slider";

interface ListingsFiltersProps {
    filters: ListingFilters;
    onChange: (filters: ListingFilters) => void;
}

export function ListingsFilters({ filters, onChange }: ListingsFiltersProps) {
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

    useEffect(() => {
        if (priceRangeData) {
            setPriceRange([priceRangeData.min, priceRangeData.max]);
        }
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
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Поиск объявлений..."
                        className="pl-9 h-10" // ← добавь h-10
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="min-w-[160px]">
                    <CityInput
                        value={city}
                        onChange={(val) => {
                            setCity(val);
                            onChange({ ...filters, city: val, page: 1 });
                        }}
                        placeholder="Город"
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
                                "price" | "created_at" | "rating_avg",
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
                        <option value="created_at|desc">Сначала новые</option>
                        <option value="created_at|asc">Сначала старые</option>
                        <option value="price|asc">Цена: по возрастанию</option>
                        <option value="price|desc">Цена: по убыванию</option>
                        <option value="rating_avg|desc">По рейтингу</option>
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
                        Сбросить
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
                    Все
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
                        Цена за день
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
