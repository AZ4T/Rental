import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface ChatTemplate {
    id: string;
    text: string;
    position: number;
    created_at: string;
}

const KEY = ["chat-templates"];

export function useChatTemplates(enabled: boolean = true) {
    return useQuery({
        queryKey: KEY,
        queryFn: () => api.get<ChatTemplate[]>("/chat-templates").then((r) => r.data),
        enabled,
        staleTime: 60_000,
    });
}

export function useCreateChatTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (text: string) =>
            api.post<ChatTemplate>("/chat-templates", { text }).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    });
}

export function useUpdateChatTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, text }: { id: string; text: string }) =>
            api.patch<ChatTemplate>(`/chat-templates/${id}`, { text }).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    });
}

export function useDeleteChatTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            api.delete(`/chat-templates/${id}`).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    });
}
