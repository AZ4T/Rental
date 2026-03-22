"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useUploadImage } from "@/hooks/use-upload";
import { Category, Listing } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";

const schema = z.object({
    title: z.string().min(3, "Минимум 3 символа"),
    description: z.string().min(10, "Минимум 10 символов"),
    price: z.string().min(1, "Укажите цену"),
    deposit: z.string().min(1, "Укажите залог"),
    city: z.string().min(2, "Укажите город"),
    category_id: z.string().min(1, "Выберите категорию"),
});

type CreateForm = z.infer<typeof schema>;

export default function CreateListingPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const { mutateAsync: uploadImage, isPending: isUploading } =
        useUploadImage();

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get<Category[]>("/categories").then((r) => r.data),
    });

    const { control, handleSubmit } = useForm<CreateForm>({
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

    const { mutate: createListing, isPending } = useMutation({
        mutationFn: (data: CreateForm) =>
            api
                .post<Listing>("/listings", {
                    ...data,
                    image_urls: imageUrls,
                    price: Number(data.price),
                    deposit: Number(data.deposit),
                })
                .then((r) => r.data),
        onSuccess: (data) => {
            toast.success("Объявление создано!");
            void queryClient.invalidateQueries({ queryKey: ["listings"] });
            router.push(`/listings/${data.id}`);
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка создания");
        },
    });

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(e.target.files ?? []);

        // Проверка размера
        const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
        if (oversized.length > 0) {
            toast.error("Файл слишком большой. Максимум 10 МБ");
            return;
        }

        // Проверка формата
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

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Новое объявление</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit((data) => createListing(data))}
                        className="space-y-5"
                    >
                        {/* Фото */}
                        <div className="space-y-2">
                            <Label>Фотографии</Label>
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
                                                (
                                                    e.target as HTMLInputElement
                                                ).value = "";
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                            {/* Текст СНАРУЖИ label */}
                            <p className="text-xs text-gray-400">
                                Форматы: JPEG, PNG, WEBP · Максимум 10 МБ · До 5
                                фото
                            </p>
                        </div>

                        {/* Название */}
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

                        {/* Описание */}
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

                        {/* Цена и залог */}
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
                                            type="number"
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
                                            type="number"
                                            placeholder="10000"
                                        />
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    </Field>
                                )}
                            />
                        </div>

                        {/* Город */}
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

                        {/* Категория */}
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
                                {isPending ? "Создаём..." : "Опубликовать"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
