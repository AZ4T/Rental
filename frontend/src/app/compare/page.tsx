"use client";

import Link from "next/link";
import { useCompareStore } from "@/store/compare.store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Eye, X, GitCompareArrows, ArrowLeft } from "lucide-react";
import { Listing } from "@/types";

// ─── Row helpers ─────────────────────────────────────────────────────────────

function RowLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="py-3 px-4 text-sm font-medium text-muted-foreground bg-muted/40 flex items-center">
            {children}
        </div>
    );
}

function RowCell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
    return (
        <div
            className={`py-3 px-4 text-sm flex items-center justify-center text-center border-l ${
                highlight ? "bg-blue-50 dark:bg-blue-950/20" : ""
            }`}
        >
            {children}
        </div>
    );
}

// ─── Compare grid ─────────────────────────────────────────────────────────────

function CompareGrid({ items }: { items: Listing[] }) {
    const { remove } = useCompareStore();

    const lowestPrice = Math.min(...items.map((i) => Number(i.price)));

    return (
        <div className="overflow-x-auto">
            <div
                className="grid min-w-[640px]"
                style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}
            >
                {/* ── Header row ── */}
                <div className="bg-muted/40 border-b" />
                {items.map((item) => (
                    <Card
                        key={item.id}
                        className="rounded-none border-0 border-l border-b shadow-none"
                    >
                        <CardHeader className="p-4 pb-3">
                            <div className="relative">
                                {/* Remove button */}
                                <button
                                    onClick={() => remove(item.id)}
                                    className="absolute -top-1 -right-1 z-10 rounded-full bg-white dark:bg-gray-800 border shadow-sm p-1 text-muted-foreground hover:text-red-500 transition-colors"
                                    aria-label="Убрать из сравнения"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>

                                {/* Image */}
                                <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted mb-3">
                                    {item.images[0] ? (
                                        <img
                                            src={item.images[0].image_url}
                                            alt={item.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                                            Нет фото
                                        </div>
                                    )}
                                </div>

                                {/* Title */}
                                <p className="font-semibold text-sm leading-tight line-clamp-2">
                                    {item.title}
                                </p>
                            </div>

                            {/* Action link */}
                            <Link
                                href={`/listings/${item.id}`}
                                className="mt-2 inline-flex items-center justify-center w-full px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                                Перейти к объявлению
                            </Link>
                        </CardHeader>
                    </Card>
                ))}

                {/* ── Category ── */}
                <RowLabel>Категория</RowLabel>
                {items.map((item) => (
                    <RowCell key={item.id}>
                        <Badge variant="secondary">{item.category.name}</Badge>
                    </RowCell>
                ))}

                {/* ── City ── */}
                <RowLabel>
                    <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    Город
                </RowLabel>
                {items.map((item) => (
                    <RowCell key={item.id}>{item.city}</RowCell>
                ))}

                {/* ── Price ── */}
                <RowLabel>Цена / сутки</RowLabel>
                {items.map((item) => {
                    const itemPrice = Number(item.price);
                    const isBest = itemPrice === lowestPrice;
                    return (
                        <RowCell key={item.id} highlight={isBest}>
                            <span
                                className={`font-semibold ${
                                    isBest ? "text-green-600 dark:text-green-400" : ""
                                }`}
                            >
                                {itemPrice.toLocaleString("ru-RU")} ₸
                            </span>
                            {isBest && items.length > 1 && (
                                <Badge
                                    variant="secondary"
                                    className="ml-1.5 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                >
                                    Лучшая цена
                                </Badge>
                            )}
                        </RowCell>
                    );
                })}

                {/* ── Deposit ── */}
                <RowLabel>Залог</RowLabel>
                {items.map((item) => (
                    <RowCell key={item.id}>
                        {item.deposit > 0
                            ? `${item.deposit.toLocaleString("ru-RU")} ₸`
                            : <span className="text-muted-foreground">—</span>}
                    </RowCell>
                ))}

                {/* ── Owner rating ── */}
                <RowLabel>
                    <Star className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    Рейтинг владельца
                </RowLabel>
                {items.map((item) => (
                    <RowCell key={item.id}>
                        {item.owner.rating_avg ? (
                            <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                {parseFloat(item.owner.rating_avg).toFixed(1)}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">Нет оценок</span>
                        )}
                    </RowCell>
                ))}

                {/* ── Owner name ── */}
                <RowLabel>Владелец</RowLabel>
                {items.map((item) => (
                    <RowCell key={item.id}>
                        <div className="flex flex-col items-center gap-1">
                            {item.owner.avatar_url ? (
                                <img
                                    src={item.owner.avatar_url}
                                    alt={item.owner.name}
                                    className="w-7 h-7 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                                    {item.owner.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-xs">{item.owner.name}</span>
                        </div>
                    </RowCell>
                ))}

                {/* ── Views ── */}
                <RowLabel>
                    <Eye className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    Просмотры
                </RowLabel>
                {items.map((item) => (
                    <RowCell key={item.id}>
                        <span className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            {item.views_count.toLocaleString("ru-RU")}
                        </span>
                    </RowCell>
                ))}

                {/* ── Description ── */}
                <RowLabel>Описание</RowLabel>
                {items.map((item) => (
                    <RowCell key={item.id}>
                        <p className="text-xs text-muted-foreground line-clamp-4 text-left">
                            {item.description || "—"}
                        </p>
                    </RowCell>
                ))}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComparePage() {
    const { items, clear } = useCompareStore();

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Page header */}
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Назад
                        </Link>
                        <div className="h-5 border-l" />
                        <h1 className="flex items-center gap-2 text-xl font-bold">
                            <GitCompareArrows className="h-5 w-5 text-blue-600" />
                            Сравнение объявлений
                        </h1>
                    </div>

                    {items.length > 0 && (
                        <button
                            onClick={clear}
                            className="text-sm text-muted-foreground hover:text-red-500 transition-colors"
                        >
                            Очистить всё
                        </button>
                    )}
                </div>

                {/* Content */}
                {items.length < 2 ? (
                    <Card className="max-w-md mx-auto mt-20">
                        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <GitCompareArrows className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">Недостаточно объявлений</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Добавьте минимум 2 объявления для сравнения. Вы можете выбрать до 3 объявлений.
                                </p>
                            </div>
                            <Link
                                href="/"
                                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Перейти к объявлениям
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <CompareGrid items={items} />
                    </Card>
                )}
            </div>
        </div>
    );
}
