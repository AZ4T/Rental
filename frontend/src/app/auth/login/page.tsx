"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import Link from "next/link";

const loginSchema = z.object({
    email: z.string().email("Введите корректный email"),
    password: z.string().min(6, "Минимум 6 символов"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { mutate: login, isPending } = useLogin();

    const { control, handleSubmit } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Вход</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit((data) => login(data))}
                        className="space-y-4"
                    >
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
                            {isPending ? "Входим..." : "Войти"}
                        </Button>
                    </form>
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Нет аккаунта?{" "}
                        <Link
                            href="/auth/register"
                            className="text-blue-600 hover:underline"
                        >
                            Зарегистрироваться
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
