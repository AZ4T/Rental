"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import {
    LOCALE_LABELS,
    LOCALE_SHORT,
    SUPPORTED_LOCALES,
    type Locale,
} from "@/i18n/config";
import { setLocaleAction } from "@/i18n/actions";

export function LocaleSwitcher() {
    const currentLocale = useLocale() as Locale;
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const switchTo = (locale: Locale) => {
        if (locale === currentLocale) return;
        startTransition(async () => {
            await setLocaleAction(locale);
            router.refresh();
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    className="gap-1.5 font-semibold"
                    aria-label="Change language"
                >
                    <Globe className="h-4 w-4" />
                    {LOCALE_SHORT[currentLocale]}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
                {SUPPORTED_LOCALES.map((locale) => (
                    <DropdownMenuItem
                        key={locale}
                        onSelect={() => switchTo(locale)}
                        className="cursor-pointer flex items-center justify-between"
                    >
                        <span>{LOCALE_LABELS[locale]}</span>
                        {locale === currentLocale && (
                            <Check className="h-4 w-4 text-blue-600" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
