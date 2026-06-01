"use client";

import { Suspense, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useTranslations } from "next-intl";

const loginSchema = z.object({
    email: z.string().email("Введите корректный email"),
    password: z.string().min(6, "Минимум 6 символов"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
    const t = useTranslations("Auth");
    const tHome = useTranslations("Home");
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect");
    const { mutate: login, isPending } = useLogin(redirectTo);
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/");
        }
    }, [isAuthenticated, redirectTo, router]);

    const { control, handleSubmit } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden flex">
            {/* Левая часть — картинка */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src="/sunrise-bg.jpg"
                    alt="background"
                    className="w-full h-full object-cover object-right"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
                    <h1 className="text-4xl font-bold mb-3">Rental</h1>
                    <p className="text-lg text-white/80">{tHome("title")}</p>
                </div>
            </div>

            {/* Правая часть — форма */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background overflow-y-auto">
                <div className="w-full max-w-md space-y-8">
                    {/* Лого для мобильных */}
                    <div className="lg:hidden text-center">
                        <h1 className="text-2xl font-bold text-blue-600">
                            Rental
                        </h1>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-foreground">
                            {t("login")}
                        </h2>
                        <p className="text-muted-foreground mt-2">
                            {t("noAccount")}{" "}
                            <Link
                                href="/auth/register"
                                className="text-blue-600 hover:underline font-medium"
                            >
                                {t("registerLong")}
                            </Link>
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit((data) => login(data))}
                        className="space-y-5"
                    >
                        <Controller
                            name="email"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Email</FieldLabel>
                                    <Input
                                        {...field}
                                        type="email"
                                        placeholder="you@example.com"
                                        className="h-11"
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />
                        <Controller
                            name="password"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>{t("password")}</FieldLabel>
                                    <Input
                                        {...field}
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-11"
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />
                        <div className="flex justify-end">
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm text-blue-600 hover:underline"
                            >
                                {t("forgotPassword")}
                            </Link>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11"
                            disabled={isPending}
                        >
                            {isPending ? t("loginPending") : t("loginAction")}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
