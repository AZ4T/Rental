"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

        return () => {
            notifSocket?.disconnect();
            notifSocket = null;
        };
    }, [isAuthenticated, user, accessToken, queryClient]);

    return <>{children}</>;
}
