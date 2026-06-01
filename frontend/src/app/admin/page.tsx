"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import { User, Listing, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Plus, Loader2, Users, LayoutList, Tag, BarChart2, TrendingUp, Flag, CheckCircle, Clock, MessageSquare, ShieldAlert, Coins } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useOrCreateChat } from "@/hooks/use-chats";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";

const LIMIT = 10;

interface AdminStats {
    totalUsers: number;
    totalListings: number;
    totalRequests: number;
    totalRevenue: number;
    topListings: {
        id: string;
        title: string;
        views_count: number;
        _count: { rentalRequests: number };
    }[];
    requestsByDay: { date: string; count: number }[];
    usersByDay: { date: string; count: number }[];
}

export default function AdminPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [newCategory, setNewCategory] = useState("");
    const [listingsPage, setListingsPage] = useState(1);
    const [deleteUserDialog, setDeleteUserDialog] = useState<string | null>(null);
    const [deleteListingDialog, setDeleteListingDialog] = useState<string | null>(null);
    const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<string | null>(null);
    const [reportsFilter, setReportsFilter] = useState<"all" | "PENDING" | "CLOSED">("all");
    const { mutate: openChat, isPending: isOpeningChat } = useOrCreateChat();

    useEffect(() => {
        if (user && user.role !== "ADMIN") router.push("/");
    }, [user, router]);

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ["admin", "users"],
        queryFn: () => api.get<(User & { _count: { listings: number } })[]>("/admin/users").then((r) => r.data),
        enabled: user?.role === "ADMIN",
    });

    const { data: listingsData, isLoading: listingsLoading } = useQuery({
        queryKey: ["admin", "listings", listingsPage],
        queryFn: () =>
            api
                .get<{ data: Listing[]; meta: { total_pages: number } }>(
                    `/listings?limit=${LIMIT}&page=${listingsPage}`,
                )
                .then((r) => r.data),
        enabled: user?.role === "ADMIN",
    });

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get<Category[]>("/categories").then((r) => r.data),
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["admin", "stats"],
        queryFn: () => api.get<AdminStats>("/admin/stats").then((r) => r.data),
        enabled: user?.role === "ADMIN",
    });

    interface Report {
        id: string;
        type: string;
        target_id: string;
        reason: string;
        description?: string;
        status: string;
        created_at: string;
        reporter: { id: string; name: string; email: string; avatar_url?: string };
    }

    const { data: reports, isLoading: reportsLoading } = useQuery({
        queryKey: ["admin", "reports"],
        queryFn: () => api.get<Report[]>("/reports").then((r) => r.data),
        enabled: user?.role === "ADMIN",
    });

    const { mutate: updateReportStatus } = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            api.patch(`/reports/${id}/status`, { status }).then((r) => r.data),
        onSuccess: () => {
            toast.success("Статус обновлён");
            void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
        },
        onError: () => toast.error("Ошибка"),
    });

    const { mutate: deleteUser, isPending: isDeletingUser } = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
        onSuccess: () => {
            toast.success("Пользователь удалён");
            setDeleteUserDialog(null);
            void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        },
        onError: () => toast.error("Ошибка удаления"),
    });

    const { mutate: deleteListing, isPending: isDeletingListing } = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/listings/${id}`),
        onSuccess: () => {
            toast.success("Объявление удалено");
            setDeleteListingDialog(null);
            void queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
            void queryClient.invalidateQueries({ queryKey: ["listings"] });
        },
        onError: () => toast.error("Ошибка удаления"),
    });

    const { mutate: createCategory, isPending: isCreating } = useMutation({
        mutationFn: (name: string) =>
            api.post("/admin/categories", { name }).then((r) => r.data),
        onSuccess: () => {
            toast.success("Категория создана");
            setNewCategory("");
            void queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: () => toast.error("Ошибка создания"),
    });

    const { mutate: deleteCategory, isPending: isDeletingCategory } = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/categories/${id}`),
        onSuccess: () => {
            toast.success("Категория удалена");
            setDeleteCategoryDialog(null);
            void queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: () => toast.error("Ошибка удаления"),
    });

    if (!user || user.role !== "ADMIN") {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h1 className="text-2xl font-bold">Админ панель</h1>
                <div className="flex gap-2 flex-wrap">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/finance">
                            <Coins className="h-4 w-4 mr-2 text-blue-600" />
                            Финансы
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/disputes">
                            <ShieldAlert className="h-4 w-4 mr-2 text-amber-500" />
                            Споры
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="stats">
                <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="stats" className="flex items-center gap-1.5">
                        <BarChart2 className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Статистика</span>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Пользователи</span>
                    </TabsTrigger>
                    <TabsTrigger value="listings" className="flex items-center gap-1.5">
                        <LayoutList className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Объявления</span>
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="flex items-center gap-1.5">
                        <Tag className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Категории</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-1.5 relative">
                        <Flag className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Жалобы</span>
                        {reports && reports.filter(r => r.status === "PENDING").length > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {reports.filter(r => r.status === "PENDING").length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Статистика */}
                <TabsContent value="stats" className="space-y-6 mt-4">
                    {statsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : stats ? (
                        <>
                            {/* KPI карточки */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground">Пользователи</p>
                                        <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground">Объявления</p>
                                        <p className="text-3xl font-bold mt-1">{stats.totalListings}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground">Заявки</p>
                                        <p className="text-3xl font-bold mt-1">{stats.totalRequests}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground">Доход</p>
                                        <p className="text-3xl font-bold mt-1 text-blue-600">
                                            {Number(stats.totalRevenue).toLocaleString()} ₸
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Заявки за 7 дней */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Заявки за 7 дней
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={stats.requestsByDay}>
                                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Заявки" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Новые пользователи за 7 дней */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Новые пользователи за 7 дней
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={stats.usersByDay}>
                                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Пользователи" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Топ объявления */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Топ объявлений по заявкам</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {stats.topListings.map((l, i) => (
                                        <div key={l.id} className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-muted-foreground w-6">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{l.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {l._count.rentalRequests} заявок · {l.views_count} просмотров
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.topListings.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            Нет данных
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    ) : null}
                </TabsContent>

                {/* Пользователи */}
                <TabsContent value="users" className="space-y-3 mt-4">
                    {usersLoading && <Loader2 className="animate-spin mx-auto" />}
                    {users?.map((u) => (
                        <Card key={u.id}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <Link href={`/profile/${u.id}`} className="shrink-0">
                                    <Avatar className="hover:ring-2 hover:ring-blue-500 transition-all">
                                        <AvatarImage src={u.avatar_url ?? ""} />
                                        <AvatarFallback>
                                            {u.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <Link href={`/profile/${u.id}`} className="font-medium truncate hover:text-blue-600 hover:underline transition-colors block">
                                        {u.name}
                                    </Link>
                                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                                        {u.role}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {u._count.listings} объявл.
                                    </span>
                                </div>
                                {u.id !== user.id && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setDeleteUserDialog(u.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* Объявления */}
                <TabsContent value="listings" className="space-y-3 mt-4">
                    {listingsLoading && <Loader2 className="animate-spin mx-auto" />}
                    {listingsData?.data.map((listing) => (
                        <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-0 flex items-stretch gap-0">
                                {/* Thumbnail */}
                                <div className="w-24 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                    {listing.images[0] ? (
                                        <img
                                            src={listing.images[0].image_url}
                                            alt={listing.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs text-center px-1">
                                            Нет фото
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 flex-1 min-w-0 px-4 py-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{listing.title}</p>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {listing.city} · {listing.category.name} ·{" "}
                                            <span className="text-blue-600 font-medium">{Number(listing.price).toLocaleString()} ₸/день</span>
                                        </p>
                                        <Link
                                            href={`/profile/${listing.owner.id}`}
                                            className="flex items-center gap-1.5 mt-1 w-fit hover:text-blue-600 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Avatar className="h-4 w-4">
                                                <AvatarImage src={listing.owner.avatar_url ?? ""} />
                                                <AvatarFallback className="text-[8px]">
                                                    {listing.owner.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-gray-400 hover:underline">{listing.owner.name}</span>
                                        </Link>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setDeleteListingDialog(listing.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {listingsData && listingsData.meta.total_pages > 1 && (
                        <div className="flex justify-center gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={listingsPage === 1}
                                onClick={() => setListingsPage((p) => p - 1)}
                            >
                                Назад
                            </Button>
                            <span className="flex items-center px-3 text-sm text-gray-600 dark:text-gray-400">
                                {listingsPage} / {listingsData.meta.total_pages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={listingsPage === listingsData.meta.total_pages}
                                onClick={() => setListingsPage((p) => p + 1)}
                            >
                                Вперёд
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* Жалобы */}
                <TabsContent value="reports" className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        {(["all", "PENDING", "CLOSED"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setReportsFilter(f)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${reportsFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                            >
                                {f === "all" ? "Все" : f === "PENDING" ? "Открытые" : "Закрытые"}
                                {f !== "all" && reports && (
                                    <span className="ml-1.5 opacity-70">
                                        {reports.filter(r => r.status === f).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    {reportsLoading && <Loader2 className="animate-spin mx-auto" />}
                    {(reports ?? [])
                        .filter(r => reportsFilter === "all" || r.status === reportsFilter)
                        .map((report) => (
                        <Card key={report.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <Link href={`/profile/${report.reporter.id}`} className="shrink-0">
                                        <Avatar className="h-8 w-8 hover:ring-2 hover:ring-primary transition-all">
                                            <AvatarImage src={report.reporter.avatar_url ?? ""} />
                                            <AvatarFallback className="text-xs">
                                                {report.reporter.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link href={`/profile/${report.reporter.id}`} className="text-sm font-medium hover:text-primary hover:underline">
                                                {report.reporter.name}
                                            </Link>
                                            <Badge variant="outline" className="text-xs">
                                                {report.type === "USER" ? "Пользователь" : report.type === "LISTING" ? "Объявление" : "Аренда"}
                                            </Badge>
                                            <Badge variant={report.status === "PENDING" ? "destructive" : "secondary"} className="text-xs">
                                                {report.status === "PENDING" ? (
                                                    <><Clock className="h-3 w-3 mr-1" />Открыта</>
                                                ) : (
                                                    <><CheckCircle className="h-3 w-3 mr-1" />Закрыта</>
                                                )}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-semibold mt-1">
                                            {report.reason === "SPAM" ? "Спам" : report.reason === "FRAUD" ? "Мошенничество" : report.reason === "INAPPROPRIATE" ? "Неприемлемый контент" : report.reason === "DAMAGE" ? "Повреждение" : "Другое"}
                                        </p>
                                        {report.description && (
                                            <p className="text-sm text-muted-foreground mt-0.5">{report.description}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(report.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        {report.status === "PENDING" ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-400"
                                                onClick={() => updateReportStatus({ id: report.id, status: "CLOSED" })}
                                            >
                                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                Закрыть
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => updateReportStatus({ id: report.id, status: "PENDING" })}
                                            >
                                                <Clock className="h-3.5 w-3.5 mr-1" />
                                                Открыть
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="w-full"
                                            disabled={isOpeningChat}
                                            onClick={() =>
                                                openChat(report.reporter.id, {
                                                    onSuccess: (chat) => router.push(`/chats/${chat.id}`),
                                                    onError: () => toast.error("Не удалось открыть чат"),
                                                })
                                            }
                                        >
                                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                            Ответить
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {reports && reports.filter(r => reportsFilter === "all" || r.status === reportsFilter).length === 0 && (
                        <p className="text-center text-muted-foreground py-10 text-sm">
                            {reportsFilter === "CLOSED" ? "Нет закрытых жалоб" : "Нет жалоб"}
                        </p>
                    )}
                </TabsContent>

                {/* Категории */}
                <TabsContent value="categories" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Добавить категорию</CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-2">
                            <Input
                                placeholder="Название категории"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && newCategory.trim()) {
                                        createCategory(newCategory.trim());
                                    }
                                }}
                            />
                            <Button
                                onClick={() => createCategory(newCategory.trim())}
                                disabled={isCreating || !newCategory.trim()}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Добавить
                            </Button>
                        </CardContent>
                    </Card>
                    <div className="space-y-2">
                        {categories?.map((cat) => (
                            <Card key={cat.id}>
                                <CardContent className="p-3 flex items-center justify-between">
                                    <span className="font-medium">{cat.name}</span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setDeleteCategoryDialog(cat.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <ConfirmDialog
                open={!!deleteUserDialog}
                title="Удалить пользователя?"
                description="Пользователь будет удалён навсегда вместе со всеми его объявлениями, заявками, отзывами и сообщениями. Это действие необратимо."
                isPending={isDeletingUser}
                onConfirm={() => {
                    if (deleteUserDialog) deleteUser(deleteUserDialog);
                }}
                onCancel={() => setDeleteUserDialog(null)}
            />
            <ConfirmDialog
                open={!!deleteListingDialog}
                title="Удалить объявление?"
                description="Объявление и все его фото будут удалены навсегда."
                isPending={isDeletingListing}
                onConfirm={() => {
                    if (deleteListingDialog) deleteListing(deleteListingDialog);
                }}
                onCancel={() => setDeleteListingDialog(null)}
            />
            <ConfirmDialog
                open={!!deleteCategoryDialog}
                title="Удалить категорию?"
                description="Категория будет удалена навсегда."
                isPending={isDeletingCategory}
                onConfirm={() => {
                    if (deleteCategoryDialog) deleteCategory(deleteCategoryDialog);
                }}
                onCancel={() => setDeleteCategoryDialog(null)}
            />
        </div>
    );
}
