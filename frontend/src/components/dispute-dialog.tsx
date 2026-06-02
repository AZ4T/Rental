"use client";

import { useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOpenDispute } from "@/hooks/use-disputes";
import { useUploadImage } from "@/hooks/use-upload";
import { RentalRequest } from "@/types";
import { Upload, X, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Props {
    rental: RentalRequest;
    open: boolean;
    onClose: () => void;
}

export function DisputeDialog({ rental, open, onClose }: Props) {
    const t = useTranslations("Dispute");
    const tCommon = useTranslations("Common");
    const PRESETS = [
        t("preset1"),
        t("preset2"),
        t("preset3"),
        t("preset4"),
        t("preset5"),
    ];
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [evidence, setEvidence] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    const { mutate: openDispute, isPending } = useOpenDispute();
    const { mutateAsync: uploadImage, isPending: isUploading } = useUploadImage();

    const reset = () => {
        setReason("");
        setDescription("");
        setEvidence([]);
    };

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        if (evidence.length + files.length > 6) {
            toast.error(t("errMaxPhotos"));
            if (fileRef.current) fileRef.current.value = "";
            return;
        }
        const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
        if (oversized) {
            toast.error(t("errFileTooBig"));
            if (fileRef.current) fileRef.current.value = "";
            return;
        }
        try {
            const urls = await Promise.all(files.map((f) => uploadImage(f)));
            setEvidence((prev) => [...prev, ...urls]);
        } catch {
            // toast already shown
        }
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleSubmit = () => {
        if (reason.trim().length < 3) {
            toast.error(t("errReason"));
            return;
        }
        openDispute(
            {
                rental_request_id: rental.id,
                reason: reason.trim(),
                description: description.trim() || undefined,
                evidence: evidence.length ? evidence : undefined,
            },
            {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            },
        );
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) onClose();
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        {t("openTitle")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("openHint", { listing: rental.listing.title })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label className="mb-2 block">{t("reason")}</Label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {PRESETS.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setReason(p)}
                                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                        reason === p
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <Input
                            value={reason}
                            maxLength={255}
                            placeholder={t("reasonPlaceholder")}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="dispute-desc" className="mb-2 block">
                            {t("description")}
                        </Label>
                        <textarea
                            id="dispute-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={2000}
                            rows={4}
                            placeholder={t("descriptionPlaceholder")}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        />
                    </div>

                    <div>
                        <Label className="mb-2 block">
                            {t("evidence")}
                        </Label>
                        {evidence.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {evidence.map((url, i) => (
                                    <div key={i} className="relative">
                                        <img
                                            src={url}
                                            alt=""
                                            className="h-20 w-20 rounded object-cover border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEvidence((prev) =>
                                                    prev.filter((_, idx) => idx !== i),
                                                )
                                            }
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                            aria-label={t("deletePhoto")}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFiles}
                            disabled={isUploading || evidence.length >= 6}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploading || evidence.length >= 6}
                            onClick={() => fileRef.current?.click()}
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4 mr-2" />
                            )}
                            {t("uploadButton")}
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose} disabled={isPending}>
                        {tCommon("cancel")}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending || isUploading}>
                        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {t("submit")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
