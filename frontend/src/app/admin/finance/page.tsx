"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { PlatformFinance, PlatformIncomeSource } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Coins,
    Crown,
    Loader2,
    Rocket,
    TrendingUp,
} from "lucide-react";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const SOURCE_LABEL: Record<PlatformIncomeSource, string> = {
    COMMISSION: "Комиссия",
    PROMOTION: "Продвижение",
    PREMIUM: "Premium",
};

const SOURCE_COLOR: Record<PlatformIncomeSource, string> = {
    COMMISSION: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    PROMOTION: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    PREMIUM: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function AdminFinancePage() {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user && user.role !== "ADMIN") router.replace("/");
    }, [user, router]);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "finance"],
        queryFn: () =>
            api.get<PlatformFinance>("/admin/finance").then((r) => r.data),
        enabled: user?.role === "ADMIN",
    });

    if (!user || user.role !== "ADMIN") {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isLoading || !data) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/admin">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <Coins className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold">Финансы платформы</h1>
            </div>

            {/* Total */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-80">Всего за всё время</p>
                        <p className="text-4xl font-bold tracking-tight mt-1">
                            {Number(data.total).toLocaleString()} ₸
                        </p>
                    </div>
                    <TrendingUp className="h-10 w-10 opacity-80" />
                </CardContent>
            </Card>

            {/* By source */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.keys(SOURCE_LABEL) as PlatformIncomeSource[]).map(
                    (s) => (
                        <Card key={s}>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <Badge className={SOURCE_COLOR[s]}>
                                        {SOURCE_LABEL[s]}
                                    </Badge>
                                    {s === "PROMOTION" && (
                                        <Rocket className="h-4 w-4 text-amber-500" />
                                    )}
                                    {s === "PREMIUM" && (
                                        <Crown className="h-4 w-4 text-purple-500" />
                                    )}
                                    {s === "COMMISSION" && (
                                        <Coins className="h-4 w-4 text-blue-500" />
                                    )}
                                </div>
                                <p className="text-2xl font-bold mt-3">
                                    {Number(data.totals[s] ?? 0).toLocaleString()} ₸
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {data.counts[s] ?? 0} операций
                                </p>
                            </CardContent>
                        </Card>
                    ),
                )}
            </div>

            {/* Active counts */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-5 flex items-center gap-3">
                        <Crown className="h-8 w-8 text-purple-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Активных Premium
                            </p>
                            <p className="text-2xl font-bold">
                                {data.activePremium}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 flex items-center gap-3">
                        <Rocket className="h-8 w-8 text-amber-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Продвинутых объявлений
                            </p>
                            <p className="text-2xl font-bold">
                                {data.activePromoted}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart by day */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Доход за последние 30 дней
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.byDay}>
                                <XAxis
                                    dataKey="date"
                                    fontSize={10}
                                    tickFormatter={(d: string) =>
                                        new Date(d).toLocaleDateString("ru-RU", {
                                            day: "2-digit",
                                            month: "2-digit",
                                        })
                                    }
                                />
                                <YAxis
                                    fontSize={10}
                                    tickFormatter={(v: number) =>
                                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                                    }
                                />
                                <Tooltip
                                    formatter={(v) =>
                                        `${Number(v ?? 0).toLocaleString()} ₸`
                                    }
                                />
                                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Recent transactions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Последние операции</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {data.recent.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6 text-sm">
                            Пока пусто
                        </p>
                    ) : (
                        <div className="divide-y">
                            {data.recent.map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-center justify-between py-3 px-5"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Badge className={SOURCE_COLOR[r.source]}>
                                                {SOURCE_LABEL[r.source]}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(
                                                    r.created_at,
                                                ).toLocaleString("ru-RU")}
                                            </span>
                                        </div>
                                        <p className="text-sm mt-1 truncate">
                                            {r.description}
                                        </p>
                                    </div>
                                    <span className="font-semibold text-green-600 shrink-0 ml-3">
                                        +{Number(r.amount).toLocaleString()} ₸
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
