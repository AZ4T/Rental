"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, X } from "lucide-react";
import { useTranslations } from "next-intl";

export const KZ_CITIES = [
    "Алматы",
    "Астана",
    "Шымкент",
    "Актобе",
    "Тараз",
    "Павлодар",
    "Усть-Каменогорск",
    "Семей",
    "Атырау",
    "Костанай",
    "Кызылорда",
    "Уральск",
    "Петропавловск",
    "Актау",
    "Темиртау",
    "Туркестан",
    "Кокшетау",
    "Талдыкорган",
    "Экибастуз",
    "Рудный",
    "Жезказган",
    "Балхаш",
    "Сатпаев",
    "Кентау",
    "Жанаозен",
    "Риддер",
    "Байконур",
    "Степногорск",
    "Шахтинск",
    "Каражал",
    "Аксу",
    "Лисаковск",
    "Арысь",
    "Капшагай",
    "Талгар",
    "Конаев",
];

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function CityInput({ value, onChange, placeholder }: Props) {
    const t = useTranslations("Home");
    const effectivePlaceholder = placeholder ?? t("cityPickPlaceholder");
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const filtered = KZ_CITIES.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase()),
    );

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => searchRef.current?.focus(), 50);
        } else {
            setSearch("");
        }
    }, [open]);

    const handleSelect = (city: string) => {
        onChange(city);
        setOpen(false);
        setSearch("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
    };

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`w-full flex items-center gap-2 h-10 px-3 rounded-md border text-sm text-left transition-colors
                    ${open ? "border-ring ring-1 ring-ring" : "border-input"}
                    bg-background hover:border-ring/50`}
            >
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className={`flex-1 truncate ${value ? "text-foreground" : "text-muted-foreground"}`}>
                    {value || effectivePlaceholder}
                </span>
                {value ? (
                    <X
                        className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground flex-shrink-0"
                        onClick={handleClear}
                    />
                ) : (
                    <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-input rounded-lg shadow-lg overflow-hidden">
                    {/* Search inside dropdown */}
                    <div className="p-2 border-b border-input">
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("citySearch")}
                            className="w-full text-sm px-2 py-1.5 rounded-md bg-muted outline-none placeholder-muted-foreground"
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                {t("cityNotFound")}
                            </p>
                        ) : (
                            filtered.map((city) => (
                                <button
                                    key={city}
                                    type="button"
                                    onClick={() => handleSelect(city)}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2
                                        ${value === city
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium"
                                            : "hover:bg-muted"
                                        }`}
                                >
                                    {value === city && <MapPin className="h-3.5 w-3.5 flex-shrink-0" />}
                                    {city}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
