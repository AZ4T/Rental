"use client";

import { useRef, useState } from "react";
import { useMyDisputes, useAddDisputeEvidence } from "@/hooks/use-disputes";
import { useUploadImage } from "@/hooks/use-upload";
import { useAuthStore } from "@/store/auth.store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Loader2,
    ShieldAlert,
    Upload,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { Dispute, DisputeStatus } from "@/types";
import { toast } from "sonner";

const STATUS_LABEL: Record<DisputeStatus, string> = {
    OPEN: "На рассмотрении",
    RESOLVED_FOR_RENTER: "Решено в пользу арендатора",
    RESOLVED_FOR_OWNER: "Решено в пользу владельца",
    RESOLVED_SPLIT: "Решено частично",
    REJECTED: "Спор отклонён",
};

function StatusBadge({ status }: { status: DisputeStatus }) {
    if (status === "OPEN") {
        return (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
                <Clock className="h-3 w-3" /> {STATUS_LABEL.OPEN}
            </Badge>
        );
    }
    if (status === "REJECTED") {
        return (
            <Badge variant="outline" className="gap-1">
                <XCircle className="h-3 w-3" /> {STATUS_LABEL.REJECTED}
            </Badge>
        );
    }
    return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 gap-1">
            <CheckCircle className="h-3 w-3" /> {STATUS_LABEL[status]}
        </Badge>
    );
}

function EvidenceUploader({ dispute, role }: { dispute: Dispute; role: "renter" | "owner" }) {
    const ref = useRef<HTMLInputElement>(null);
    const { mutateAsync: uploadImage, isPending: isUploading } = useUploadImage();
    const { mutate: addEvidence, isPending: isAdding } = useAddDisputeEvidence();
    const current = role === "renter" ? dispute.renter_evidence : dispute.owner_evidence;

    const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        if (current.length + files.length > 10) {
            toast.error("Максимум 10 фото");
            if (ref.current) ref.current.value = "";
            return;
        }
        try {
            const urls = await Promise.all(files.map((f) => uploadImage(f)));
            addEvidence({ id: dispute.id, images: urls });
        } catch {
            // toast already shown
        }
        if (ref.current) ref.current.value = "";
    };

    if (dispute.status !== "OPEN") return null;

    return (
        <div className="mt-2">
            <input
                ref={ref}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPick}
                disabled={isUploading || isAdding}
            />
            <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isUploading || isAdding}
                onClick={() => ref.current?.click()}
            >
                {(isUploading || isAdding) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Upload className="h-4 w-4 mr-2" />
                )}
                Добавить доказательства
            </Button>
        </div>
    );
}

export default function MyDisputesPage() {
    const { data, isLoading } = useMyDisputes();
    const { user } = useAuthStore();
    const [lightbox, setLightbox] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-amber-500" />
                <h1 className="text-2xl font-bold">Мои споры</h1>
            </div>

            {(!data || data.length === 0) && (
                <div className="text-center py-20 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Споров пока нет</p>
                </div>
            )}

            <div className="space-y-4">
                {data?.map((dispute) => {
                    const rental = dispute.rentalRequest!;
                    const iAmRenter = rental.renter_id === user?.id;
                    const role: "renter" | "owner" = iAmRenter ? "renter" : "owner";
                    const myEvidence = role === "renter"
                        ? dispute.renter_evidence
                        : dispute.owner_evidence;
                    const theirEvidence = role === "renter"
                        ? dispute.owner_evidence
                        : dispute.renter_evidence;

                    return (
                        <Card key={dispute.id}>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                                            {rental.listing.images?.[0] ? (
                                                <img
                                                    src={rental.listing.images[0].image_url}
                                                    alt={rental.listing.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : null}
                                        </div>
                                        <div className="min-w-0">
                                            <Link
                                                href={`/listings/${rental.listing.id}`}
                                                className="font-semibold hover:underline truncate block"
                                            >
                                                {rental.listing.title}
                                            </Link>
                                            <p className="text-sm text-muted-foreground">
                                                {dispute.reason}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Открыт{" "}
                                                {new Date(dispute.created_at).toLocaleDateString("ru-RU")}
                                                {" • "}
                                                Залог: {Number(rental.listing.deposit).toLocaleString()} ₸
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={dispute.status} />
                                </div>

                                {dispute.description && (
                                    <p className="text-sm bg-gray-50 dark:bg-gray-900/40 rounded p-2">
                                        {dispute.description}
                                    </p>
                                )}

                                <div className="grid sm:grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Ваши доказательства ({myEvidence.length})
                                        </p>
                                        {myEvidence.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {myEvidence.map((url, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setLightbox(url)}
                                                        className="block"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt=""
                                                            className="h-14 w-14 rounded object-cover border hover:opacity-80 transition-opacity"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">
                                                Нет фото
                                            </p>
                                        )}
                                        <EvidenceUploader dispute={dispute} role={role} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Доказательства {iAmRenter ? "владельца" : "арендатора"} ({theirEvidence.length})
                                        </p>
                                        {theirEvidence.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {theirEvidence.map((url, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setLightbox(url)}
                                                        className="block"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt=""
                                                            className="h-14 w-14 rounded object-cover border hover:opacity-80 transition-opacity"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">
                                                Нет фото
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {dispute.status !== "OPEN" && (
                                    <div className="text-sm bg-blue-50 dark:bg-blue-950/30 rounded p-2 border border-blue-100 dark:border-blue-900">
                                        <p className="font-medium text-blue-900 dark:text-blue-200">
                                            Решение администрации
                                        </p>
                                        {dispute.deposit_to_renter !== null && (
                                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                                                Арендатору возвращено: {Number(dispute.deposit_to_renter).toLocaleString()} ₸
                                            </p>
                                        )}
                                        {dispute.admin_note && (
                                            <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                                                {dispute.admin_note}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {lightbox && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setLightbox(null)}
                >
                    <img
                        src={lightbox}
                        alt=""
                        className="max-h-full max-w-full rounded shadow-lg"
                    />
                </div>
            )}
        </div>
    );
}
