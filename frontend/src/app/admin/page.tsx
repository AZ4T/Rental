"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { User, Listing, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Plus, Loader2, Users, LayoutList, Tag } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

const LIMIT = 10;

export default function AdminPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [newCategory, setNewCategory] = useState("");
    const [listingsPage, setListingsPage] = useState(1);
    const [deleteUserDialog, setDeleteUserDialog] = useState<string | null>(
        null,
    );
    const [deleteListingDialog, setDeleteListingDialog] = useState<
        string | null
    >(null);
    const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<
        string | null
    >(null);

    useEffect(() => {
        if (user && user.role !== "ADMIN") router.push("/");
    }, [user, router]);

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ["admin", "users"],
        queryFn: () => api.get<User[]>("/admin/users").then((r) => r.data),
        enabled: user?.role === "ADMIN",
    });

    const { data: listingsData, isLoading: listingsLoading } = useQuery({
        queryKey: ["admin", "listings", listingsPage],
        queryFn: () =>
            api
                .get<{
                    data: Listing[];
                    meta: { total_pages: number };
                }>(`/listings?limit=${LIMIT}&page=${listingsPage}`)
                .then((r) => r.data),
        enabled: user?.role === "ADMIN",
    });

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get<Category[]>("/categories").then((r) => r.data),
    });

    const { mutate: deleteUser, isPending: isDeletingUser } = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
        onSuccess: () => {
            toast.success("Пользователь удалён");
            setDeleteUserDialog(null);
            void queryClient.invalidateQueries({
                queryKey: ["admin", "users"],
            });
        },
        onError: () => toast.error("Ошибка удаления"),
    });

    const { mutate: deleteListing, isPending: isDeletingListing } = useMutation(
        {
            mutationFn: (id: string) => api.delete(`/admin/listings/${id}`),
            onSuccess: () => {
                toast.success("Объявление удалено");
                setDeleteListingDialog(null);
                void queryClient.invalidateQueries({
                    queryKey: ["admin", "listings"],
                });
                void queryClient.invalidateQueries({ queryKey: ["listings"] });
            },
            onError: () => toast.error("Ошибка удаления"),
        },
    );

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

    const { mutate: deleteCategory, isPending: isDeletingCategory } =
        useMutation({
            mutationFn: (id: string) => api.delete(`/admin/categories/${id}`),
            onSuccess: () => {
                toast.success("Категория удалена");
                setDeleteCategoryDialog(null);
                void queryClient.invalidateQueries({
                    queryKey: ["categories"],
                });
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
            <h1 className="text-2xl font-bold">Админ панель</h1>

            <Tabs defaultValue="users">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                    <TabsTrigger
                        value="users"
                        className="flex items-center gap-2"
                    >
                        <Users className="h-4 w-4" />
                        Пользователи
                    </TabsTrigger>
                    <TabsTrigger
                        value="listings"
                        className="flex items-center gap-2"
                    >
                        <LayoutList className="h-4 w-4" />
                        Объявления
                    </TabsTrigger>
                    <TabsTrigger
                        value="categories"
                        className="flex items-center gap-2"
                    >
                        <Tag className="h-4 w-4" />
                        Категории
                    </TabsTrigger>
                </TabsList>

                {/* Пользователи */}
                <TabsContent value="users" className="space-y-3 mt-4">
                    {usersLoading && (
                        <Loader2 className="animate-spin mx-auto" />
                    )}
                    {users?.map((u) => (
                        <Card key={u.id}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={u.avatar_url ?? ""} />
                                    <AvatarFallback>
                                        {u.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {u.name}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                        {u.email}
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        u.role === "ADMIN"
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {u.role}
                                </Badge>
                                {u.id !== user.id && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            setDeleteUserDialog(u.id)
                                        }
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
                    {listingsLoading && (
                        <Loader2 className="animate-spin mx-auto" />
                    )}
                    {listingsData?.data.map((listing) => (
                        <Card key={listing.id}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {listing.title}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {listing.city} · {listing.category.name}{" "}
                                        ·{" "}
                                        {Number(listing.price).toLocaleString()}{" "}
                                        ₸/день
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {listing.owner.name}
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                        setDeleteListingDialog(listing.id)
                                    }
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Пагинация */}
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
                                disabled={
                                    listingsPage ===
                                    listingsData.meta.total_pages
                                }
                                onClick={() => setListingsPage((p) => p + 1)}
                            >
                                Вперёд
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* Категории */}
                <TabsContent value="categories" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Добавить категорию
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-2">
                            <Input
                                placeholder="Название категории"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter" &&
                                        newCategory.trim()
                                    ) {
                                        createCategory(newCategory.trim());
                                    }
                                }}
                            />
                            <Button
                                onClick={() =>
                                    createCategory(newCategory.trim())
                                }
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
                                    <span className="font-medium">
                                        {cat.name}
                                    </span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            setDeleteCategoryDialog(cat.id)
                                        }
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
                description="Пользователь и все его данные будут удалены навсегда."
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
                    if (deleteCategoryDialog)
                        deleteCategory(deleteCategoryDialog);
                }}
                onCancel={() => setDeleteCategoryDialog(null)}
            />
        </div>
    );
}
