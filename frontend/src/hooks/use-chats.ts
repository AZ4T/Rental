import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import api from "@/services/api";
import { getSocket } from "@/services/socket";
import { useAuthStore } from "@/store/auth.store";

export interface ChatParticipant {
    id: string;
    name: string;
    avatar_url: string | null;
}

export interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    type: string;
    is_read: boolean;
    created_at: string;
    sender: ChatParticipant;
}

export interface Chat {
    id: string;
    participant1_id: string;
    participant2_id: string;
    participant1: ChatParticipant;
    participant2: ChatParticipant;
    messages: Message[];
    created_at: string;
    _count: { messages: number };
}

export function useMyChats(enabled = true) {
    const { isAuthenticated } = useAuthStore();
    return useQuery<Chat[]>({
        queryKey: ["chats"],
        queryFn: () => api.get("/chats").then((r) => r.data),
        enabled: enabled && isAuthenticated,
        refetchInterval: 10000,
    });
}

export function useUnreadCount(enabled = true) {
    const { isAuthenticated } = useAuthStore();
    return useQuery<number>({
        queryKey: ["chats", "unread"],
        queryFn: () => api.get("/chats/unread-count").then((r) => r.data),
        enabled: enabled && isAuthenticated,
        refetchInterval: 10000,
    });
}

export function useOrCreateChat() {
    return useMutation({
        mutationFn: (userId: string) =>
            api.post<Chat>(`/chats/with/${userId}`).then((r) => r.data),
    });
}

export function useChatMessages(chatId: string) {
    const queryClient = useQueryClient();
    const { user, access_token } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const joinedRef = useRef(false);
    // Tracks the socket that has new_message listener so sendMessage uses the same one
    const activeSocketRef = useRef<ReturnType<typeof getSocket> | null>(null);

    const { data, isLoading } = useQuery<Message[]>({
        queryKey: ["chats", chatId, "messages"],
        queryFn: () =>
            api.get(`/chats/${chatId}/messages`).then((r) => r.data),
        enabled: !!chatId,
    });

    useEffect(() => {
        if (data) setMessages(data);
    }, [data]);

    useEffect(() => {
        if (!chatId || !user || !access_token) return;
        const socket = getSocket();
        activeSocketRef.current = socket;

        const joinChat = () => {
            socket.emit("join_chat", chatId);
            joinedRef.current = true;
        };

        joinChat();
        // Optimistic invalidation — drop unread counts as soon as the user
        // enters the chat. The server's chat_read broadcast confirms shortly.
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        queryClient.invalidateQueries({ queryKey: ["chats", "unread"] });

        const handleNew = (msg: Message) => {
            setMessages((prev) =>
                prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
            );
            queryClient.invalidateQueries({ queryKey: ["chats"] });
            queryClient.invalidateQueries({ queryKey: ["chats", "unread"] });
        };

        socket.on("new_message", handleNew);
        socket.on("connect", joinChat);

        return () => {
            socket.off("new_message", handleNew);
            socket.off("connect", joinChat);
            socket.emit("leave_chat", chatId);
            joinedRef.current = false;
            if (activeSocketRef.current === socket) {
                activeSocketRef.current = null;
            }
        };
    }, [chatId, user, access_token, queryClient]);

    const sendMessage = (content: string) => {
        // Prefer the socket that already has new_message listener set up;
        // fall back to getSocket() which may create a new one (auto-join in gateway handles room membership)
        const socket = activeSocketRef.current ?? getSocket();
        socket.emit("send_message", { chatId, content });
    };

    return { messages, isLoading, sendMessage };
}
