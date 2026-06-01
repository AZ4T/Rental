import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { BlockedUser } from "@/types";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";

export function useBlockedUsers() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ["users", "blocked"],
        queryFn: () =>
            api.get<BlockedUser[]>("/users/me/blocked").then((r) => r.data),
        enabled: isAuthenticated,
    });
}

export function useBlockUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            api.post(`/users/${id}/block`).then((r) => r.data),
        onSuccess: () => {
            toast.success("Пользователь заблокирован");
            void qc.invalidateQueries({ queryKey: ["users", "blocked"] });
        },
        onError: (e: Error) => toast.error(e.message ?? "Ошибка"),
    });
}

export function useUnblockUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            api.delete(`/users/${id}/block`).then((r) => r.data),
        onSuccess: () => {
            toast.success("Разблокировано");
            void qc.invalidateQueries({ queryKey: ["users", "blocked"] });
        },
        onError: (e: Error) => toast.error(e.message ?? "Ошибка"),
    });
}
