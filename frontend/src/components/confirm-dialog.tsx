"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface Props {
    open: boolean;
    title?: string;
    description?: string;
    confirmLabel?: string;
    pendingLabel?: string;
    variant?: "destructive" | "default";
    onConfirm: () => void;
    onCancel: () => void;
    isPending?: boolean;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    pendingLabel,
    variant = "destructive",
    onConfirm,
    onCancel,
    isPending,
}: Props) {
    const t = useTranslations("Common");
    const tConfirm = useTranslations("Confirm");
    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title ?? tConfirm("defaultTitle")}</DialogTitle>
                    <DialogDescription>{description ?? tConfirm("defaultDescription")}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        {t("cancel")}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {isPending ? (pendingLabel ?? tConfirm("defaultPending")) : (confirmLabel ?? t("delete"))}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
