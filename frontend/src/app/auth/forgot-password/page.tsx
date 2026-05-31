"use client";

import { useState } from "react";
import { useForgotPassword } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const { mutate, isPending, isSuccess } = useForgotPassword();

    return (
        <div className="h-[calc(100vh-64px)] flex items-center justify-center p-8 bg-background">
            <div className="w-full max-w-md space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">
                        Забыли пароль?
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Введите email — пришлём ссылку для сброса пароля.
                    </p>
                </div>

                {isSuccess ? (
                    <div className="space-y-3">
                        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-4 text-sm text-green-800 dark:text-green-300">
                            Если аккаунт с таким email существует, письмо уже отправлено.
                            Проверьте папку «Входящие» и «Спам».
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Письмо не пришло? Проверьте, что email написан без опечаток, и подождите 1–2 минуты.
                            Ссылка действует 1 час. Можно{" "}
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="text-blue-600 hover:underline"
                            >
                                попробовать ещё раз
                            </button>
                            .
                        </p>
                    </div>
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            mutate({ email });
                        }}
                        className="space-y-4"
                    >
                        <Input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11"
                        />
                        <Button
                            type="submit"
                            className="w-full h-11"
                            disabled={isPending}
                        >
                            {isPending ? "Отправляем..." : "Отправить ссылку"}
                        </Button>
                    </form>
                )}

                <p className="text-sm text-center text-muted-foreground">
                    <Link href="/auth/login" className="text-blue-600 hover:underline">
                        Вернуться ко входу
                    </Link>
                </p>
            </div>
        </div>
    );
}
