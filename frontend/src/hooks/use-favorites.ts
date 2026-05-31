import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Favorite } from "@/types";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";

export function useMyFavorites() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ["favorites"],
        queryFn: () => api.get<Favorite[]>("/favorites").then((r) => r.data),
        enabled: isAuthenticated,
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
