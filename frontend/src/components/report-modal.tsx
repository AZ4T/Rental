"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/services/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type ReportType = "USER" | "LISTING" | "RENTAL";
type ReportReason = "SPAM" | "FRAUD" | "INAPPROPRIATE" | "DAMAGE" | "OTHER";

const REASON_LABELS: Record<ReportReason, string> = {
    SPAM: "Спам",
    FRAUD: "Мошенничество",
    INAPPROPRIATE: "Неприемлемый контент",
    DAMAGE: "Повреждение имущества",
    OTHER: "Другое",
};

interface ReportModalProps {
    open: boolean;
    onClose: () => void;
    type: ReportType;
    targetId: string;
}

export function ReportModal({ open, onClose, type, targetId }: ReportModalProps) {
    const [reason, setReason] = useState<ReportReason | "">("");
    const [description, setDescription] = useState("");

    const { mutate: submitReport, isPending } = useMutation({
        mutationFn: () =>
            api
                .post("/reports", {
                    type,
                    target_id: targetId,
                    reason,
                    description: description.trim() || undefined,
                })
                .then((r) => r.data),
        onSuccess: () => {
            toast.success("Жалоба отправлена");
            setReason("");
            setDescription("");
            onClose();
        },
        onError: (e: Error) => {
            toast.error(e.message ?? "Ошибка при отправке жалобы");
        },
    });

    const handleSubmit = () => {
        if (!reason) {
            toast.error("Выберите причину жалобы");
            return;
        }
        submitReport();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Пожаловаться</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Причина</Label>
                        <Select
                            value={reason}
                            onValueChange={(v) => setReason(v as ReportReason)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите причину" />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(REASON_LABELS) as ReportReason[]).map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {REASON_LABELS[r]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Описание (необязательно)</Label>
                        <textarea
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            placeholder="Опишите проблему подробнее..."
                            rows={3}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isPending}>
                        Отмена
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={isPending || !reason}
                    >
                        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Отправить жалобу
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
