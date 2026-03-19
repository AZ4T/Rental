import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Favorite } from "@/types";
import { toast } from "sonner";

export function useMyFavorites() {
    return useQuery({
        queryKey: ["favorites"],
        queryFn: () => api.get<Favorite[]>("/favorites").then((r) => r.data),
    });
}

export function useAddFavorite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (listingId: string) =>
            api.post(`/favorites/${listingId}`).then((r) => r.data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["favorites"] });
            toast.success("Добавлено в избранное");
        },
        onError: () => toast.error("Ошибка"),
    });
}

export function useRemoveFavorite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (listingId: string) =>
            api.delete(`/favorites/${listingId}`).then((r) => r.data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["favorites"] });
            toast.success("Убрано из избранного");
        },
        onError: () => toast.error("Ошибка"),
    });
}
