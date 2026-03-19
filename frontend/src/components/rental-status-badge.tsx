import { Badge } from "@/components/ui/badge";
import { RentalRequestStatus } from "@/types";

const statusConfig: Record<
    RentalRequestStatus,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
    }
> = {
    PENDING: { label: "Ожидает", variant: "secondary" },
    APPROVED: { label: "Одобрена", variant: "default" },
    REJECTED: { label: "Отклонена", variant: "destructive" },
    CANCELLED: { label: "Отменена", variant: "outline" },
    COMPLETED: { label: "Завершена", variant: "default" },
};

export function RentalStatusBadge({ status }: { status: RentalRequestStatus }) {
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
}
