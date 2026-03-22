"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import Link from "next/link";

const registerSchema = z.object({
    name: z.string().min(2, "Минимум 2 символа"),
    email: z.string().email("Введите корректный email"),
    password: z.string().min(6, "Минимум 6 символов"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { mutate: register, isPending } = useRegister();

    const { control, handleSubmit } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: "", email: "", password: "" },
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
                    <p className="text-lg text-white/80">
                        Арендуй что угодно, когда угодно
                    </p>
                </div>
            </div>

            {/* Правая часть — форма */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden text-center">
                        <h1 className="text-2xl font-bold text-blue-600">
                            Rental
                        </h1>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-foreground">
                            Регистрация
                        </h2>
                        <p className="text-muted-foreground mt-2">
                            Уже есть аккаунт?{" "}
                            <Link
                                href="/auth/login"
                                className="text-blue-600 hover:underline font-medium"
                            >
                                Войти
                            </Link>
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit((data) => register(data))}
                        className="space-y-5"
                    >
                        <Controller
                            name="name"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Имя</FieldLabel>
                                    <Input
                                        {...field}
                                        placeholder="Азат"
                                        className="h-11"
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />
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
                                    <FieldLabel>Пароль</FieldLabel>
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
                        <Button
                            type="submit"
                            className="w-full h-11"
                            disabled={isPending}
                        >
                            {isPending
                                ? "Создаём аккаунт..."
                                : "Зарегистрироваться"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
