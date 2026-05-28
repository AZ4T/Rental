"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useListings } from "@/hooks/use-listings";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { RecentlyViewed } from "@/components/recently-viewed";
import { Search, Package, ArrowRight, Shield, Star, Zap, Users, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Category } from "@/types";
import {
    Car, Bike, Camera, Tent, Wrench, Gamepad2,
} from "lucide-react";

// ─── Category icons ──────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    Cars: <Car className="h-6 w-6" />,
    Bicycles: <Bike className="h-6 w-6" />,
    Cameras: <Camera className="h-6 w-6" />,
    "Camping Gear": <Tent className="h-6 w-6" />,
    "Power Tools": <Wrench className="h-6 w-6" />,
    "Gaming Consoles": <Gamepad2 className="h-6 w-6" />,
};

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const duration = 1500;
                    const steps = 60;
                    const increment = target / steps;
                    let current = 0;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            setCount(target);
                            clearInterval(timer);
                        } else {
                            setCount(Math.floor(current));
                        }
                    }, duration / steps);
                }
            },
            { threshold: 0.5 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [target]);

    return (
        <span ref={ref}>
            {count.toLocaleString()}
            {suffix}
        </span>
    );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
    const router = useRouter();
    const [q, setQ] = useState("");
    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get<Category[]>("/categories").then((r) => r.data),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const query = q.trim();
        router.push(query ? `/listings?search=${encodeURIComponent(query)}` : "/listings");
    };

    return (
        <section className="-mt-8 -mx-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-24 text-center text-white">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/20">
                    <Zap className="h-3.5 w-3.5 text-yellow-300" />
                    Платформа аренды в Казахстане
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight tracking-tight">
                    Арендуй что угодно,
                    <br />
                    <span className="text-blue-200">когда угодно</span>
                </h1>
                <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
                    Тысячи объявлений от людей рядом с тобой. Безопасно, быстро и удобно.
                </p>

                <form onSubmit={submit} className="flex gap-2 max-w-xl mx-auto mb-10">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            id="hero-search"
                            type="text"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Что хочешь арендовать?"
                            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white text-gray-900 text-base outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-3.5 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap"
                    >
                        Найти
                    </button>
                </form>

                {categories && categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {categories.slice(0, 8).map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/listings?category_ids=${cat.id}`}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur rounded-full text-sm font-medium transition-colors border border-white/20"
                            >
                                {CATEGORY_ICONS[cat.name] ?? <Package className="h-4 w-4" />}
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsSection() {
    const { data } = useListings({ page: 1, limit: 1 });
    const total = data?.meta.total ?? 0;

    const stats = [
        { label: "Объявлений", value: Math.max(total, 120), suffix: "+" },
        { label: "Городов", value: 12, suffix: "" },
        { label: "Довольных клиентов", value: 3400, suffix: "+" },
        { label: "Категорий", value: 8, suffix: "" },
    ];

    return (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10">
            {stats.map((s) => (
                <div key={s.label} className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                </div>
            ))}
        </section>
    );
}

// ─── Featured listings ────────────────────────────────────────────────────────

function FeaturedListings() {
    const { data } = useListings({ page: 1, limit: 8 });
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    };

    if (!data || data.data.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Свежие объявления</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scroll("left")}
                        className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <Link
                        href="/listings"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                        Все объявления
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-3 scroll-smooth"
                style={{ scrollbarWidth: "none" }}
            >
                {data.data.map((listing) => (
                    <div key={listing.id} className="flex-shrink-0 w-56 sm:w-64">
                        <ListingCard listing={listing} />
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Categories grid ──────────────────────────────────────────────────────────

function CategoriesSection() {
    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get<Category[]>("/categories").then((r) => r.data),
    });

    if (!categories || categories.length === 0) return null;

    const colors = [
        "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
        "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
        "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
        "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
        "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
        "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
        "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    ];

    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-bold">Популярные категории</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categories.map((cat, i) => (
                    <Link
                        key={cat.id}
                        href={`/listings?category_ids=${cat.id}`}
                        className={`flex flex-col items-center gap-3 p-5 rounded-2xl font-medium text-sm transition-all hover:scale-105 hover:shadow-md ${colors[i % colors.length]}`}
                    >
                        <div className="h-10 w-10 flex items-center justify-center">
                            {CATEGORY_ICONS[cat.name] ?? <Package className="h-6 w-6" />}
                        </div>
                        <span>{cat.name}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
    const steps = [
        {
            step: "01",
            title: "Найди нужное",
            desc: "Ищи по категориям, городу и цене. Сотни объявлений от реальных людей рядом с тобой.",
            emoji: "🔍",
        },
        {
            step: "02",
            title: "Отправь заявку",
            desc: "Выбери удобные даты и отправь запрос. Владелец рассмотрит и ответит в ближайшее время.",
            emoji: "📋",
        },
        {
            step: "03",
            title: "Договорись",
            desc: "Общайся в чате, уточни детали. Оплата через безопасный кошелёк платформы.",
            emoji: "🤝",
        },
        {
            step: "04",
            title: "Пользуйся",
            desc: "Получи вещь, используй и верни. Оставь отзыв и помоги другим арендаторам.",
            emoji: "✅",
        },
    ];

    return (
        <section className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Как это работает</h2>
                <p className="text-muted-foreground">Аренда вещей за 4 простых шага</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {steps.map((item, i) => (
                    <div key={item.step} className="relative p-6 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                        <span className="text-6xl font-bold text-muted-foreground/15 absolute top-2 right-3 leading-none">
                            {item.step}
                        </span>
                        {i < steps.length - 1 && (
                            <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                                <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                        )}
                        <div className="text-4xl mb-3">{item.emoji}</div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Trust section ────────────────────────────────────────────────────────────

function TrustSection() {
    const points = [
        {
            icon: <Shield className="h-6 w-6" />,
            title: "Безопасные сделки",
            desc: "Оплата через встроенный кошелёк. Деньги переходят владельцу только после подтверждения.",
        },
        {
            icon: <Star className="h-6 w-6" />,
            title: "Рейтинг и отзывы",
            desc: "Честные оценки от реальных арендаторов. Выбирай проверенных владельцев с высоким рейтингом.",
        },
        {
            icon: <Users className="h-6 w-6" />,
            title: "Реальные люди",
            desc: "Каждый аккаунт верифицирован. Общайся напрямую через встроенный мессенджер.",
        },
        {
            icon: <TrendingUp className="h-6 w-6" />,
            title: "Залог защищает",
            desc: "Залог возвращается после успешного завершения аренды. Вещи в безопасности.",
        },
    ];

    return (
        <section className="bg-muted/30 rounded-3xl p-8 md:p-12 space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Почему выбирают нас</h2>
                <p className="text-muted-foreground">Мы заботимся о безопасности каждой сделки</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {points.map((p) => (
                    <div key={p.title} className="flex gap-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            {p.icon}
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">{p.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTASection() {
    return (
        <section className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)",
                    backgroundSize: "50px 50px",
                }}
            />
            <div className="relative z-10 p-10 md:p-16 text-center text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Сдай своё — зарабатывай
                </h2>
                <p className="text-white/80 mb-8 text-lg max-w-lg mx-auto">
                    Размести объявление бесплатно и начни получать доход от вещей, которые не используешь
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/listings/create"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-blue-700 hover:bg-blue-50 font-semibold text-base transition-colors"
                    >
                        Создать объявление
                    </Link>
                    <Link
                        href="/listings"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-white/50 text-white hover:bg-white/10 font-semibold text-base transition-colors"
                    >
                        Смотреть объявления
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
    return (
        <div className="space-y-16 pb-16">
            <HeroSection />
            <StatsSection />
            <FeaturedListings />
            <CategoriesSection />
            <HowItWorksSection />
            <TrustSection />
            <RecentlyViewed />
            <CTASection />
        </div>
    );
}
