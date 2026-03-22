"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Listing } from "@/types";

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function CityInput({ value, onChange, placeholder = "Астана" }: Props) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const ref = useRef<HTMLDivElement>(null);

    const { data } = useQuery({
        queryKey: ["cities"],
        queryFn: () =>
            api.get<{ data: Listing[] }>("/listings?limit=100").then((r) => {
                const cities = r.data.data.map((l) => l.city);
                return [...new Set(cities)].sort();
            }),
    });

    const filtered =
        data?.filter((city) =>
            city.toLowerCase().includes(value.toLowerCase()),
        ) ?? [];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setActiveIndex(-1);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open || filtered.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            onChange(filtered[activeIndex]);
            setOpen(false);
            setActiveIndex(-1);
        } else if (e.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
        }
    };

    return (
        <div ref={ref} className="relative">
            <Input
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                    setActiveIndex(-1);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-10"
            />
            {open && filtered.length > 0 && value && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filtered.map((city, i) => (
                        <button
                            key={city}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                activeIndex === i
                                    ? "bg-blue-50 text-blue-700"
                                    : "hover:bg-gray-50"
                            }`}
                            onClick={() => {
                                onChange(city);
                                setOpen(false);
                                setActiveIndex(-1);
                            }}
                        >
                            {city}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
