"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListingFilters } from "@/types";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Category } from "@/types";
import { Search, X } from "lucide-react";
import { CityInput } from "@/components/city-input";
import { Slider } from "@/components/ui/slider";

interface ListingsFiltersProps {
    filters: ListingFilters;
    onChange: (filters: ListingFilters) => void;
}

export function ListingsFilters({ filters, onChange }: ListingsFiltersProps) {
    const [search, setSearch] = useState(filters.search ?? "");

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get<Category[]>("/categories").then((r) => r.data),
    });

    const [city, setCity] = useState(filters.city ?? "");
    const [priceRange, setPriceRange] = useState([0, 100000]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange({ ...filters, search, page: 1 });
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const reset = () => {
        setSearch("");
        setCity("");
        setPriceRange([0, 100000]);
        onChange({ page: 1, limit: 12 });
    };

    const hasFilters =
        filters.search ||
        filters.category_ids ||
        filters.city ||
        filters.price_min ||
        filters.price_max;

    return (
        <div className="flex flex-wrap gap-3 items-center">
            {/* Поиск */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Поиск объявлений..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <CityInput
                value={city}
                onChange={(val) => {
                    setCity(val);
                    onChange({ ...filters, city: val, page: 1 });
                }}
                placeholder="Город"
            />

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
                            className="flex-shrink-0"
                            onClick={() => {
                                const current = filters.category_ids ?? [];
                                const updated = isSelected
                                    ? current.filter((id) => id !== cat.id) // убрать
                                    : [...current, cat.id]; // добавить
                                onChange({
                                    ...filters,
                                    category_ids: updated,
                                    page: 1,
                                });
                            }}
                        >
                            {cat.name}
                        </Button>
                    );
                })}
            </div>

            {/* Слайдер цены */}
            <div className="w-full bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                        Цена за день
                    </span>
                    <span className="text-sm text-gray-500">
                        {priceRange[0].toLocaleString()} ₸ —{" "}
                        {priceRange[1].toLocaleString()} ₸
                    </span>
                </div>
                <Slider
                    min={0}
                    max={100000}
                    step={500}
                    value={priceRange}
                    onValueChange={(val) => {
                        setPriceRange(val);
                        onChange({
                            ...filters,
                            price_min: val[0],
                            price_max: val[1],
                            page: 1,
                        });
                    }}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>0 ₸</span>
                    <span>100,000 ₸</span>
                </div>
            </div>

            {/* Сброс */}
            {hasFilters && (
                <Button variant="ghost" size="sm" onClick={reset}>
                    <X className="h-4 w-4 mr-1" />
                    Сбросить
                </Button>
            )}
        </div>
    );
}
