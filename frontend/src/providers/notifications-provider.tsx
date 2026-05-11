"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

let notifSocket: Socket | null = null;

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuthStore();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isAuthenticated || !user) {
            if (notifSocket) {
                notifSocket.disconnect();
                notifSocket = null;
            }
            return;
        }

        const token = localStorage.getItem("access_token");
        notifSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
            auth: { token },
        });

        notifSocket.on("rental_status_changed", (data: { message: string }) => {
            toast.info(data.message, { duration: 6000 });
            queryClient.invalidateQueries({ queryKey: ["rentals"] });
        });

        notifSocket.on("payment_received", (data: { message: string }) => {
            toast.success(data.message, { duration: 6000 });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["rentals"] });
        });

        return () => {
            notifSocket?.disconnect();
            notifSocket = null;
        };
    }, [isAuthenticated, user, queryClient]);

    return <>{children}</>;
}
