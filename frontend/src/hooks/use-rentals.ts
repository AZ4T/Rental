import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { RentalRequest, RentalRequestStatus } from "@/types";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";

export function useMyRentals() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ["rentals", "my"],
        queryFn: () =>
            api.get<RentalRequest[]>("/rental-requests/my").then((r) => r.data),
        enabled: isAuthenticated,
    });
}

export function useIncomingRentals() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ["rentals", "incoming"],
        queryFn: () =>
            api
                .get<RentalRequest[]>("/rental-requests/incoming")
                .then((r) => r.data),
        enabled: isAuthenticated,
    });
}

export function useIncomingRentalsCount() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ["rentals", "incoming", "count"],
        queryFn: () =>
            api
                .get<{ count: number }>("/rental-requests/incoming/new-count")
                .then((r) => r.data.count),
        enabled: isAuthenticated,
        refetchOnWindowFocus: false,
    });
}

// Marks all current incoming requests as "seen" — called when the user opens
// the incoming-requests page so the badge disappears.
export function useMarkIncomingSeen() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post("/rental-requests/incoming/seen").then((r) => r.data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["rentals", "incoming", "count"] });
        },
    });
}

export function useUpdateRentalStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: string;
            status: RentalRequestStatus;
        }) =>
            api
                .patch(`/rental-requests/${id}/status`, { status })
                .then((r) => r.data),
        onSuccess: () => {
            toast.success("Статус обновлён");
            void queryClient.invalidateQueries({ queryKey: ["rentals"] });
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка");
        },
    });
}

export function useGetQrToken(rentalId: string) {
    return useQuery({
        queryKey: ["rentals", rentalId, "qr"],
        queryFn: () =>
            api
                .get<{ token: string }>(`/rental-requests/${rentalId}/qr`)
                .then((r) => r.data.token),
        enabled: !!rentalId,
    });
}

export function useCancelRental() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            api.patch(`/rental-requests/${id}/cancel`).then((r) => r.data),
        onSuccess: () => {
            toast.success("Заявка отменена");
            void queryClient.invalidateQueries({ queryKey: ["rentals"] });
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка");
        },
    });
}
