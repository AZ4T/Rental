"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useResetPassword } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useTranslations } from "next-intl";

function ResetPasswordForm() {
    const t = useTranslations("Auth");
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const { mutate, isPending } = useResetPassword();

    if (!token) {
        return (
            <div className="h-[calc(100vh-64px)] flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">{t("linkInvalid")}.</p>
                    <Link
                        href="/auth/forgot-password"
                        className="text-blue-600 hover:underline text-sm"
                    >
                        {t("requestNewLink")}
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) return;
        mutate({ token, password });
    };

    return (
        <div className="h-[calc(100vh-64px)] flex items-center justify-center p-8 bg-background">
            <div className="w-full max-w-md space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">
                        {t("newPasswordTitle")}
                    </h2>
                    <p className="text-muted-foreground mt-2">{t("passwordHint")}.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="password"
                        placeholder={t("password")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                        className="h-11"
                    />
                    <Input
                        type="password"
                        placeholder={t("passwordConfirm")}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        className="h-11"
                    />
                    {password && confirm && password !== confirm && (
                        <p className="text-sm text-red-500">
                            {t("passwordsDontMatch")}
                        </p>
                    )}
                    <Button
                        type="submit"
                        className="w-full h-11"
                        disabled={
                            isPending ||
                            password !== confirm ||
                            password.length < 8
                        }
                    >
                        {isPending ? t("setNewPending") : t("setNewPasswordButton")}
                    </Button>
                </form>

                <p className="text-sm text-center text-muted-foreground">
                    <Link
                        href="/auth/forgot-password"
                        className="text-blue-600 hover:underline"
                    >
                        {t("requestNewLink")}
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}
