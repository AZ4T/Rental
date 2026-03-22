"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useListing } from "@/hooks/use-listings";
import { useUploadImage } from "@/hooks/use-upload";
import { useAuthStore } from "@/store/auth.store";
import api from "@/services/api";
import { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { X, Upload, Loader2 } from "lucide-react";

const schema = z.object({
    title: z.string().min(3, "Минимум 3 символа"),
    description: z.string().min(10, "Минимум 10 символов"),
    price: z.string().min(1, "Укажите цену"),
    deposit: z.string().min(1, "Укажите залог"),
    city: z.string().min(2, "Укажите город"),
    category_id: z.string().min(1, "Выберите категорию"),
});

type EditForm = z.infer<typeof schema>;

interface Props {
    params: Promise<{ id: string }>;
}

export default function EditListingPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { data: listing, isLoading } = useListing(id);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const { mutateAsync: uploadImage, isPending: isUploading } =
        useUploadImage();

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get<Category[]>("/categories").then((r) => r.data),
    });

    const { control, handleSubmit, reset } = useForm<EditForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: "",
            description: "",
            price: "",
            deposit: "",
            city: "",
            category_id: "",
        },
    });

    useEffect(() => {
        if (!listing) return;

        // Заполняем форму
        reset({
            title: listing.title,
            description: listing.description,
            price: String(listing.price),
            deposit: String(listing.deposit),
            city: listing.city,
            category_id: listing.category_id,
        });
        setImageUrls(listing.images.map((img) => img.image_url));

        // Редирект если не владелец
        if (user && listing.owner_id !== user.id) {
            router.push(`/listings/${id}`);
        }
    }, [listing, user, id, router, reset]);

    const { mutate: updateListing, isPending } = useMutation({
        mutationFn: (data: EditForm) =>
            api
                .patch(`/listings/${id}`, {
                    ...data,
                    price: Number(data.price),
                    deposit: Number(data.deposit),
                    image_urls: imageUrls,
                })
                .then((r) => r.data),
        onSuccess: () => {
            toast.success("Объявление обновлено!");
            void queryClient.invalidateQueries({ queryKey: ["listing", id] });
            void queryClient.invalidateQueries({ queryKey: ["listings"] });
            router.push(`/listings/${id}`);
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка обновления");
        },
    });

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(e.target.files ?? []);

        const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
        if (oversized.length > 0) {
            toast.error("Файл слишком большой. Максимум 10 МБ");
            return;
        }

        const allowed = ["image/jpeg", "image/png", "image/webp"];
        const invalid = files.filter((f) => !allowed.includes(f.type));
        if (invalid.length > 0) {
            toast.error("Неверный формат. Только JPEG, PNG, WEBP");
            return;
        }

        if (imageUrls.length + files.length > 5) {
            toast.error("Максимум 5 фотографий");
            return;
        }

        for (const file of files) {
            const url = await uploadImage(file);
            setImageUrls((prev) => [...prev, url]);
        }
    };

    const removeImage = (url: string) => {
        setImageUrls((prev) => prev.filter((u) => u !== url));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">
                        Редактировать объявление
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit((data) => updateListing(data))}
                        className="space-y-5"
                    >
                        {/* Фото */}
                        <div className="space-y-2">
                            <Label>Фотографии (до 5)</Label>
                            <div className="flex flex-wrap gap-2">
                                {imageUrls.map((url) => (
                                    <div
                                        key={url}
                                        className="relative h-24 w-24 rounded-lg overflow-hidden border"
                                    >
                                        <img
                                            src={url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(url)}
                                            className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-black/70"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {imageUrls.length < 5 && (
                                    <label className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                                        {isUploading ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                        ) : (
                                            <>
                                                <Upload className="h-5 w-5 text-gray-400" />
                                                <span className="text-xs text-gray-400 mt-1">
                                                    Добавить
                                                </span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                            onClick={(e) => {
                                                // Сбрасываем значение чтобы можно было загрузить тот же файл
                                                (
                                                    e.target as HTMLInputElement
                                                ).value = "";
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-gray-400">
                                Форматы: JPEG, PNG, WEBP · Максимум 10 МБ · До 5
                                фото
                            </p>
                        </div>

                        <Controller
                            name="title"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Название</FieldLabel>
                                    <Input
                                        {...field}
                                        placeholder="Велосипед горный Trek"
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />

                        <Controller
                            name="description"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Описание</FieldLabel>
                                    <textarea
                                        {...field}
                                        rows={4}
                                        placeholder="Опишите состояние и особенности вещи..."
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Controller
                                name="price"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>
                                            Цена за день (₸)
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            inputMode="numeric"
                                            placeholder="2500"
                                        />
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    </Field>
                                )}
                            />
                            <Controller
                                name="deposit"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Залог (₸)</FieldLabel>
                                        <Input
                                            {...field}
                                            inputMode="numeric"
                                            placeholder="10000"
                                        />
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    </Field>
                                )}
                            />
                        </div>

                        <Controller
                            name="city"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Город</FieldLabel>
                                    <Input {...field} placeholder="Астана" />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />

                        <Controller
                            name="category_id"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Категория</FieldLabel>
                                    <select
                                        {...field}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="">
                                            Выберите категорию
                                        </option>
                                        {categories?.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => router.back()}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={isPending}
                            >
                                {isPending ? "Сохраняем..." : "Сохранить"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
