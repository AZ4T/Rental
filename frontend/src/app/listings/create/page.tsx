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
import { X, Upload, Loader2, Info } from "lucide-react";
import { PLATFORM_FEE_RATE } from "@/lib/platform";
import { CityInput } from "@/components/city-input";
import { useTranslations } from "next-intl";

type CreateForm = {
    title: string;
    description: string;
    price: string;
    deposit: string;
    city: string;
    category_id: string;
};

export default function CreateListingPage() {
    const t = useTranslations("Listing");
    const schema = z.object({
        title: z.string().min(3, t("errMinTitle")),
        description: z.string().min(10, t("errMinDesc")),
        price: z.string().min(1, t("errPriceRequired")),
        deposit: z.string().min(1, t("errDepositRequired")),
        city: z.string().min(2, t("errCityRequired")),
        category_id: z.string().min(1, t("errCategoryRequired")),
    });
    const router = useRouter();
    const queryClient = useQueryClient();
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
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
            toast.success(t("createOk"));
            void queryClient.invalidateQueries({ queryKey: ["listings"] });
            router.push(`/listings/${data.id}`);
        },
        onError: (error: Error) => {
            toast.error(error.message ?? t("createError"));
        },
    });

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(e.target.files ?? []);

        // Проверка размера
        const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
        if (oversized.length > 0) {
            toast.error(t("errFileTooBig"));
            return;
        }

        // Проверка формата
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        const invalid = files.filter((f) => !allowed.includes(f.type));
        if (invalid.length > 0) {
            toast.error(t("errFileType"));
            return;
        }

        if (imageUrls.length + files.length > 5) {
            toast.error(t("errMaxPhotos"));
            return;
        }

        try {
            const urls = await Promise.all(files.map((f) => uploadImage(f)));
            setImageUrls((prev) => [...prev, ...urls]);
        } catch {
            // useUploadImage already toasts per-failure
        }
    };

    const removeImage = (url: string) => {
        setImageUrls((prev) => prev.filter((u) => u !== url));
    };

    const processFiles = async (fileList: FileList | null) => {
        if (!fileList) return;
        const files = Array.from(fileList);

        const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
        if (oversized.length > 0) {
            toast.error(t("errFileTooBig"));
            return;
        }

        const allowed = ["image/jpeg", "image/png", "image/webp"];
        const invalid = files.filter((f) => !allowed.includes(f.type));
        if (invalid.length > 0) {
            toast.error(t("errFileType"));
            return;
        }

        if (imageUrls.length + files.length > 5) {
            toast.error(t("errMaxPhotos"));
            return;
        }

        try {
            const urls = await Promise.all(files.map((f) => uploadImage(f)));
            setImageUrls((prev) => [...prev, ...urls]);
        } catch {
            // useUploadImage already toasts per-failure
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        void processFiles(e.dataTransfer.files);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{t("createNew")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit((data) => createListing(data))}
                        className="space-y-5"
                    >
                        {/* Фото */}
                        <div className="space-y-2">
                            <Label>{t("photos")}</Label>
                            {imageUrls.length > 0 && (
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
                                </div>
                            )}
                            {imageUrls.length < 5 && (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => {
                                        if (!isUploading) {
                                            document
                                                .getElementById(
                                                    "photo-upload-input",
                                                )
                                                ?.click();
                                        }
                                    }}
                                    className={`w-full min-h-[80px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors gap-1 py-4 ${
                                        isDragging
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-300 hover:border-blue-400"
                                    }`}
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                    ) : (
                                        <>
                                            <Upload
                                                className={`h-6 w-6 ${isDragging ? "text-blue-500" : "text-gray-400"}`}
                                            />
                                            <span
                                                className={`text-sm font-medium ${isDragging ? "text-blue-600" : "text-gray-500"}`}
                                            >
                                                {t("uploadDrag")}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {t("uploadClick")}
                                            </span>
                                        </>
                                    )}
                                    <input
                                        id="photo-upload-input"
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
                                </div>
                            )}
                            {/* Текст СНАРУЖИ label */}
                            <p className="text-xs text-gray-400">
                                {t("uploadHelp")}
                            </p>
                        </div>

                        {/* Название */}
                        <Controller
                            name="title"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>{t("title")}</FieldLabel>
                                    <Input
                                        {...field}
                                        placeholder={t("titlePlaceholder")}
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
                                    <FieldLabel>{t("description")}</FieldLabel>
                                    <textarea
                                        {...field}
                                        rows={4}
                                        placeholder={t("descPlaceholder")}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />

                        {/* Цена и залог */}
                        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium">
                                    {t("feeBannerTitle", { percent: (PLATFORM_FEE_RATE * 100).toFixed(0) })}
                                </p>
                                <p className="opacity-80 mt-0.5">
                                    {t("feeBannerBody", { net: Math.round(2500 * (1 - PLATFORM_FEE_RATE)).toLocaleString() })}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Controller
                                name="price"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>
                                            {t("price")}
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
                                        <FieldLabel>{t("deposit")}</FieldLabel>
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
                                    <FieldLabel>{t("city")}</FieldLabel>
                                    <CityInput
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
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
                                    <FieldLabel>{t("category")}</FieldLabel>
                                    <select
                                        {...field}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="">
                                            {t("selectCategory")}
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
                                {t("cancelBtn")}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={isPending}
                            >
                                {isPending ? t("publishing") : t("publishBtn")}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
