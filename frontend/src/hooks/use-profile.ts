import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { User } from "@/types";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";

export function useMe() {
    return useQuery({
        queryKey: ["me"],
        queryFn: () => api.get<User>("/users/me").then((r) => r.data),
    });
}

export function useUser(id: string) {
    return useQuery({
        queryKey: ["user", id],
        queryFn: () => api.get<User>(`/users/${id}`).then((r) => r.data),
        enabled: !!id,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const { setUser } = useAuthStore();

    return useMutation({
        mutationFn: (data: { name?: string; avatar_url?: string }) =>
            api.patch<User>("/users/me", data).then((r) => r.data),
        onSuccess: (data) => {
            setUser(data);
            void queryClient.invalidateQueries({ queryKey: ["me"] });
            toast.success("Профиль обновлён");
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка обновления");
        },
    });
}
