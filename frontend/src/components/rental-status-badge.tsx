"use client";

import { Badge } from "@/components/ui/badge";
import { RentalRequestStatus } from "@/types";
import { useTranslations } from "next-intl";

const variantByStatus: Record<RentalRequestStatus, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "secondary",
    APPROVED: "default",
    REJECTED: "destructive",
    CANCELLED: "outline",
    COMPLETED: "default",
};

export function RentalStatusBadge({ status }: { status: RentalRequestStatus }) {
    const t = useTranslations("Rental");
    const labels: Record<RentalRequestStatus, string> = {
        PENDING: t("statusPending"),
        APPROVED: t("statusApproved"),
        REJECTED: t("statusRejected"),
        CANCELLED: t("statusCancelled"),
        COMPLETED: t("statusCompleted"),
    };
    return <Badge variant={variantByStatus[status]}>{labels[status]}</Badge>;
}
