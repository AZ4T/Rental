"use client";

import { useGetQrToken } from "@/hooks/use-rentals";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { Loader2 } from "lucide-react";

interface QrModalProps {
    rentalId: string;
    open: boolean;
    onClose: () => void;
}

export function QrModal({ rentalId, open, onClose }: QrModalProps) {
    const { data: token, isLoading, isError } = useGetQrToken(open ? rentalId : "");

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const url = token ? `${baseUrl}/rentals/scan/${token}` : "";

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>QR-код для оплаты</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    {isLoading && (
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    )}
                    {isError && (
                        <p className="text-sm text-red-500">Не удалось загрузить QR-код</p>
                    )}
                    {token && (
                        <>
                            <div className="p-3 bg-white rounded-xl border">
                                <QRCode value={url} size={220} />
                            </div>
                            <p className="text-sm text-center text-muted-foreground">
                                Покажите этот QR-код арендатору. Он отсканирует и оплатит аренду.
                            </p>
                            <p className="text-xs text-center text-muted-foreground break-all font-mono bg-muted rounded px-2 py-1">
                                {token}
                            </p>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
