"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        Регистрация
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit((data) => register(data))}
                        className="space-y-4"
                    >
                        <Controller
                            name="name"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="name">Имя</FieldLabel>
                                    <Input
                                        {...field}
                                        id="name"
                                        placeholder="Азат"
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
                                    <FieldLabel htmlFor="email">
                                        Email
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
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
                                    <FieldLabel htmlFor="password">
                                        Пароль
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="password"
                                        type="password"
                                        placeholder="••••••"
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isPending}
                        >
                            {isPending
                                ? "Создаём аккаунт..."
                                : "Зарегистрироваться"}
                        </Button>
                    </form>
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Уже есть аккаунт?{" "}
                        <Link
                            href="/auth/login"
                            className="text-blue-600 hover:underline"
                        >
                            Войти
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
