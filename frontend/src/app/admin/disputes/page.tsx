"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import {
    useAdminDisputes,
    useResolveDispute,
} from "@/hooks/use-disputes";
import { Dispute, DisputeStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    Loader2,
    ShieldAlert,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

function StatusBadge({ status }: { status: DisputeStatus }) {
    const t = useTranslations("Dispute");
    const STATUS_LABEL: Record<DisputeStatus, string> = {
        OPEN: t("adminStatusOpen"),
        RESOLVED_FOR_RENTER: t("adminStatusForRenter"),
        RESOLVED_FOR_OWNER: t("adminStatusForOwner"),
        RESOLVED_SPLIT: t("adminStatusSplit"),
        REJECTED: t("adminStatusRejected"),
    };
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

function ResolveForm({ dispute }: { dispute: Dispute }) {
    const t = useTranslations("Dispute");
    const deposit = Number(dispute.rentalRequest?.listing?.deposit ?? 0);
    const [outcome, setOutcome] = useState<DisputeStatus>("RESOLVED_FOR_RENTER");
    const [split, setSplit] = useState(Math.round(deposit / 2));
    const [note, setNote] = useState("");
    const { mutate: resolve, isPending } = useResolveDispute();

    const handle = () => {
        if (outcome === "RESOLVED_SPLIT") {
            if (split < 0 || split > deposit) {
                toast.error(t("adminAmountError", { max: deposit }));
                return;
            }
        }
        resolve({
            id: dispute.id,
            status: outcome,
            deposit_to_renter:
                outcome === "RESOLVED_SPLIT" ? split : undefined,
            admin_note: note.trim() || undefined,
        });
    };

    return (
        <div className="border-t pt-3 space-y-3">
            <div>
                <Label className="mb-2 block">{t("adminDecisionLabel")}</Label>
                <div className="grid grid-cols-2 gap-2">
                    {(
                        [
                            ["RESOLVED_FOR_RENTER", t("adminDecisionForRenter")],
                            ["RESOLVED_FOR_OWNER", t("adminDecisionForOwner")],
                            ["RESOLVED_SPLIT", t("adminDecisionSplit")],
                            ["REJECTED", t("adminDecisionReject")],
                        ] as [DisputeStatus, string][]
                    ).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setOutcome(value)}
                            className={`text-sm px-3 py-2 rounded border transition-colors text-left ${
                                outcome === value
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {outcome === "RESOLVED_SPLIT" && (
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded p-3 space-y-2">
                    <Label className="block">
                        {t("adminRefundRenterMax", { amount: deposit.toLocaleString() })}
                    </Label>
                    <Input
                        type="number"
                        min={0}
                        max={deposit}
                        value={split}
                        onChange={(e) => setSplit(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t("adminToOwner", { amount: (deposit - split).toLocaleString() })}
                    </p>
                </div>
            )}

            <div>
                <Label htmlFor={`note-${dispute.id}`} className="mb-2 block">
                    {t("adminNoteLabel")}
                </Label>
                <textarea
                    id={`note-${dispute.id}`}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={1000}
                    rows={2}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    placeholder={t("adminNotePlaceholder")}
                />
            </div>

            <Button
                className="w-full"
                disabled={isPending}
                onClick={handle}
            >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("adminApply")}
            </Button>
        </div>
    );
}

function Gallery({ urls, onPick }: { urls: string[]; onPick: (u: string) => void }) {
    const t = useTranslations("Dispute");
    if (!urls.length) {
        return <p className="text-xs text-muted-foreground italic">{t("noPhotos")}</p>;
    }
    return (
        <div className="flex flex-wrap gap-1.5">
            {urls.map((url, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => onPick(url)}
                    className="block"
                >
                    <img
                        src={url}
                        alt=""
                        className="h-16 w-16 rounded object-cover border hover:opacity-80 transition-opacity"
                    />
                </button>
            ))}
        </div>
    );
}

export default function AdminDisputesPage() {
    const t = useTranslations("Dispute");
    const { user } = useAuthStore();
    const router = useRouter();
    const [tab, setTab] = useState<"open" | "all">("open");
    const [lightbox, setLightbox] = useState<string | null>(null);

    useEffect(() => {
        if (user && user.role !== "ADMIN") {
            router.push("/");
        }
    }, [user, router]);

    const { data, isLoading } = useAdminDisputes(
        tab === "open" ? "OPEN" : "ALL",
    );

    if (!user || user.role !== "ADMIN") {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/admin">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <ShieldAlert className="h-6 w-6 text-amber-500" />
                <h1 className="text-2xl font-bold">{t("adminTitle")}</h1>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "open" | "all")}>
                <TabsList>
                    <TabsTrigger value="open">{t("adminTabOpen")}</TabsTrigger>
                    <TabsTrigger value="all">{t("adminTabAll")}</TabsTrigger>
                </TabsList>
                <TabsContent value={tab} className="mt-4">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : !data || data.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            {t("adminEmpty")}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.map((d) => {
                                const r = d.rentalRequest!;
                                return (
                                    <Card key={d.id}>
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={`/listings/${r.listing.id}`}
                                                        className="font-semibold hover:underline"
                                                    >
                                                        {r.listing.title}
                                                    </Link>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t("adminOpenedBy")}:{" "}
                                                        <Link
                                                            className="hover:underline"
                                                            href={`/profile/${d.openedBy?.id}`}
                                                        >
                                                            {d.openedBy?.name}
                                                        </Link>
                                                        {" • "}
                                                        {t("adminDepositLabel")}:{" "}
                                                        {Number(
                                                            r.listing.deposit,
                                                        ).toLocaleString()}{" "}
                                                        ₸
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t("adminRenter")}:{" "}
                                                        <Link
                                                            className="hover:underline"
                                                            href={`/profile/${r.renter?.id}`}
                                                        >
                                                            {r.renter?.name}
                                                        </Link>
                                                        {" • "}
                                                        {new Date(d.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <StatusBadge status={d.status} />
                                            </div>

                                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded p-2 text-sm">
                                                <p className="font-medium">{d.reason}</p>
                                                {d.description && (
                                                    <p className="text-xs mt-1 text-muted-foreground">
                                                        {d.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                                        {t("adminRenterEvidenceCount", { count: d.renter_evidence.length })}
                                                    </p>
                                                    <Gallery
                                                        urls={d.renter_evidence}
                                                        onPick={setLightbox}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                                        {t("adminOwnerEvidenceCount", { count: d.owner_evidence.length })}
                                                    </p>
                                                    <Gallery
                                                        urls={d.owner_evidence}
                                                        onPick={setLightbox}
                                                    />
                                                </div>
                                            </div>

                                            {r.return_images?.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                                        {t("adminReturnPhotos", { count: r.return_images.length })}
                                                    </p>
                                                    <Gallery
                                                        urls={r.return_images}
                                                        onPick={setLightbox}
                                                    />
                                                </div>
                                            )}

                                            {d.status === "OPEN" ? (
                                                <ResolveForm dispute={d} />
                                            ) : (
                                                <div className="border-t pt-3 text-sm space-y-1">
                                                    {d.deposit_to_renter !== null && (
                                                        <p>
                                                            {t("adminToRenterLabel")}:{" "}
                                                            <span className="font-medium">
                                                                {Number(d.deposit_to_renter).toLocaleString()} ₸
                                                            </span>
                                                            {", "}{t("adminToOwnerLabel")}:{" "}
                                                            <span className="font-medium">
                                                                {(Number(r.listing.deposit) -
                                                                    Number(d.deposit_to_renter)
                                                                ).toLocaleString()}{" "}
                                                                ₸
                                                            </span>
                                                        </p>
                                                    )}
                                                    {d.admin_note && (
                                                        <p className="text-muted-foreground">
                                                            {d.admin_note}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

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
