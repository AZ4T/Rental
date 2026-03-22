"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import api from "@/services/api";
import { Category } from "@/types";
import {
    Shield,
    Search,
    HandshakeIcon,
    Star,
    Users,
    Package,
    Clock,
    CheckCircle,
    Car,
    Bike,
    Camera,
    Tent,
    Wrench,
    Gamepad2,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
    Cars: <Car className="h-6 w-6" />,
    Bicycles: <Bike className="h-6 w-6" />,
    Cameras: <Camera className="h-6 w-6" />,
    "Camping Gear": <Tent className="h-6 w-6" />,
    "Power Tools": <Wrench className="h-6 w-6" />,
    "Gaming Consoles": <Gamepad2 className="h-6 w-6" />,
};

export default function AboutPage() {
    const { isAuthenticated } = useAuthStore();

    const { data: stats } = useQuery({
        queryKey: ["stats"],
        queryFn: async () => {
            const [listings, users] = await Promise.all([
                api
                    .get<{ meta: { total: number } }>("/listings?limit=1")
                    .then((r) => r.data.meta.total),
                api.get<{ length: number }>("/admin/users").then((r) => r.data),
            ]);
            return { listings, users: Array.isArray(users) ? users.length : 0 };
        },
    });

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get<Category[]>("/categories").then((r) => r.data),
    });

    const popularCategories = categories?.slice(0, 6) ?? [];

    return (
        <div className="-mt-8 -mx-4">
            {/* Hero */}
            <section className="relative h-[600px] flex items-center">
                <img
                    src="/sunrise-bg.jpg"
                    alt="hero"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 max-w-7xl mx-auto px-8 text-white">
                    <h1 className="text-5xl font-bold mb-4 leading-tight">
                        Арендуй что угодно,
                        <br />
                        когда угодно
                    </h1>
                    <p className="text-xl text-white/80 mb-8 max-w-xl">
                        Платформа для аренды вещей между людьми. Найди нужное
                        рядом или сдай своё и зарабатывай.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            asChild
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Link href="/">Смотреть объявления</Link>
                        </Button>
                        {!isAuthenticated && (
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="text-white border-white hover:bg-white/10"
                            >
                                <Link href="/auth/register">
                                    Зарегистрироваться
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-8">
                {/* Статистика */}
                <section className="py-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        {
                            icon: <Package className="h-8 w-8 text-blue-600" />,
                            value: stats?.listings ?? "...",
                            label: "Объявлений",
                        },
                        {
                            icon: <Users className="h-8 w-8 text-blue-600" />,
                            value: stats?.users ?? "...",
                            label: "Пользователей",
                        },
                        {
                            icon: <Star className="h-8 w-8 text-blue-600" />,
                            value: "4.8",
                            label: "Средний рейтинг",
                        },
                        {
                            icon: <Clock className="h-8 w-8 text-blue-600" />,
                            value: "24/7",
                            label: "Поддержка",
                        },
                    ].map((stat, i) => (
                        <Card key={i}>
                            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                                {stat.icon}
                                <span className="text-3xl font-bold">
                                    {stat.value}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                    {stat.label}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                {/* Как это работает */}
                <section className="py-16">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Как это работает
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: (
                                    <Search className="h-10 w-10 text-blue-600" />
                                ),
                                step: "01",
                                title: "Найди нужное",
                                desc: "Ищи по категориям, городу и цене. Сотни объявлений от реальных людей рядом с тобой.",
                            },
                            {
                                icon: (
                                    <HandshakeIcon className="h-10 w-10 text-blue-600" />
                                ),
                                step: "02",
                                title: "Договорись",
                                desc: "Отправь заявку на аренду. Владелец одобрит и вы договоритесь об условиях.",
                            },
                            {
                                icon: (
                                    <CheckCircle className="h-10 w-10 text-blue-600" />
                                ),
                                step: "03",
                                title: "Пользуйся",
                                desc: "Забери вещь, используй и верни. Оставь отзыв и помоги другим пользователям.",
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="relative flex flex-col items-center text-center p-6"
                            >
                                <span className="text-6xl font-bold text-muted-foreground/20 absolute top-0 right-6">
                                    {item.step}
                                </span>
                                <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-4 mb-4">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-muted-foreground">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Преимущества */}
                <section className="py-16">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Почему Rental?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: (
                                    <Shield className="h-6 w-6 text-blue-600" />
                                ),
                                title: "Безопасность",
                                desc: "Все сделки защищены платформой. Залог гарантирует возврат вещи в целости.",
                            },
                            {
                                icon: (
                                    <Star className="h-6 w-6 text-blue-600" />
                                ),
                                title: "Рейтинги",
                                desc: "Система отзывов помогает выбрать надёжного арендодателя или арендатора.",
                            },
                            {
                                icon: (
                                    <Search className="h-6 w-6 text-blue-600" />
                                ),
                                title: "Удобный поиск",
                                desc: "Фильтры по городу, категории, цене и рейтингу. Найди нужное за секунды.",
                            },
                            {
                                icon: (
                                    <Clock className="h-6 w-6 text-blue-600" />
                                ),
                                title: "Быстро",
                                desc: "Создай объявление за 2 минуты и начни зарабатывать на вещах которые не используешь.",
                            },
                            {
                                icon: (
                                    <Users className="h-6 w-6 text-blue-600" />
                                ),
                                title: "Сообщество",
                                desc: "Тысячи пользователей по всему Казахстану доверяют нашей платформе.",
                            },
                            {
                                icon: (
                                    <CheckCircle className="h-6 w-6 text-blue-600" />
                                ),
                                title: "Просто",
                                desc: "Интуитивный интерфейс. Зарегистрируйся и сразу начни пользоваться.",
                            },
                        ].map((item, i) => (
                            <Card key={i}>
                                <CardContent className="p-6 space-y-3">
                                    <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-3 w-fit">
                                        {item.icon}
                                    </div>
                                    <h3 className="font-semibold text-lg">
                                        {item.title}
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        {item.desc}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Популярные категории */}
                <section className="py-16">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Популярные категории
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {popularCategories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/?category_ids=${cat.id}`}
                            >
                                <Card className="hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer">
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                        <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-3">
                                            {categoryIcons[cat.name] ?? (
                                                <Package className="h-6 w-6 text-blue-600" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium">
                                            {cat.name}
                                        </span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                    <div className="text-center mt-6">
                        <Button asChild variant="outline">
                            <Link href="/">Все категории →</Link>
                        </Button>
                    </div>
                </section>

                {/* CTA */}
                {!isAuthenticated && (
                    <section className="py-16 mb-8">
                        <div className="bg-blue-600 rounded-3xl p-12 text-center text-white">
                            <h2 className="text-3xl font-bold mb-4">
                                Готов начать?
                            </h2>
                            <p className="text-white/80 mb-8 text-lg">
                                Зарегистрируйся бесплатно и начни арендовать или
                                сдавать вещи уже сегодня
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-white text-blue-600 hover:bg-white/90"
                                >
                                    <Link href="/auth/register">
                                        Зарегистрироваться
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="text-white border-white hover:bg-white/10"
                                >
                                    <Link href="/">Смотреть объявления</Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
