"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/services/socket";

let notifSocket: Socket | null = null;

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuthStore();
    const accessToken = useAuthStore((s) => s.access_token);
    const queryClient = useQueryClient();

    // accessToken in deps so a token refresh recreates the socket with the fresh token
    useEffect(() => {
        if (!isAuthenticated || !user || !accessToken) {
            if (notifSocket) {
                notifSocket.disconnect();
                notifSocket = null;
            }
            return;
        }

        if (typeof window !== "undefined" && typeof Notification !== "undefined" && Notification.permission === "default") {
            void Notification.requestPermission();
        }

        notifSocket = io(window.location.origin, {
            path: '/ws-notifications',
            auth: { token: accessToken },
        });

        notifSocket.on("rental_status_changed", (data: { message: string }) => {
            toast.info(data.message, { duration: 6000 });
            queryClient.invalidateQueries({ queryKey: ["rentals"] });
            if (typeof window !== "undefined" && typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification("Rental — изменение статуса", {
                    body: data.message,
                    icon: "/favicon.ico",
                });
            }
        });

        notifSocket.on("payment_received", (data: { message: string }) => {
            toast.success(data.message, { duration: 6000 });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["rentals"] });
            if (typeof window !== "undefined" && typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification("Rental — оплата получена", {
                    body: data.message,
                    icon: "/favicon.ico",
                });
            }
        });

        // Renter side of the same event — fired when their payment goes
        // through. Lets /rentals/my refresh even when paid via QR scan
        // in a different tab.
        notifSocket.on("payment_made", (data: { message: string }) => {
            toast.success(data.message, { duration: 4000 });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["rentals"] });
        });

        notifSocket.on("incoming_rental", (data: { message: string }) => {
            toast.info(data.message, { duration: 6000 });
            queryClient.invalidateQueries({ queryKey: ["rentals", "incoming"] });
            queryClient.invalidateQueries({ queryKey: ["rentals", "incoming", "count"] });
            if (typeof window !== "undefined" && typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification("Rental — новая заявка", {
                    body: data.message,
                    icon: "/favicon.ico",
                });
            }
        });

        // Eagerly open chats socket so we get message notifications anywhere in the app,
        // not only when the user has a specific chat open.
        const chatsSocket = getSocket();
        const handleChatUpdated = (data: { chatId: string; message: { sender_id: string; content: string; sender: { name: string } } }) => {
            const me = useAuthStore.getState().user?.id;
            queryClient.invalidateQueries({ queryKey: ["chats"] });
            queryClient.invalidateQueries({ queryKey: ["chats", "unread"] });
            // Don't notify about our own outgoing messages
            if (data.message.sender_id === me) return;
            toast.info(`${data.message.sender.name}: ${data.message.content.slice(0, 80)}`, { duration: 5000 });
            if (typeof window !== "undefined" && typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification(`Rental — ${data.message.sender.name}`, {
                    body: data.message.content.slice(0, 200),
                    icon: "/favicon.ico",
                });
            }
        };
        const handleChatRead = () => {
            // Server marked messages read for this user — refresh unread counts
            // on every screen instantly (no waiting for the 10s polling refetch).
            queryClient.invalidateQueries({ queryKey: ["chats"] });
            queryClient.invalidateQueries({ queryKey: ["chats", "unread"] });
        };
        chatsSocket.on("chat_updated", handleChatUpdated);
        chatsSocket.on("chat_read", handleChatRead);

        return () => {
            chatsSocket.off("chat_updated", handleChatUpdated);
            chatsSocket.off("chat_read", handleChatRead);
            notifSocket?.disconnect();
            notifSocket = null;
        };
    }, [isAuthenticated, user, accessToken, queryClient]);

    return <>{children}</>;
}
