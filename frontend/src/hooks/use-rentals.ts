import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { RentalRequest, RentalRequestStatus } from "@/types";
import { toast } from "sonner";

export function useMyRentals() {
    return useQuery({
        queryKey: ["rentals", "my"],
        queryFn: () =>
            api.get<RentalRequest[]>("/rental-requests/my").then((r) => r.data),
    });
}

export function useIncomingRentals() {
    return useQuery({
        queryKey: ["rentals", "incoming"],
        queryFn: () =>
            api
                .get<RentalRequest[]>("/rental-requests/incoming")
                .then((r) => r.data),
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
