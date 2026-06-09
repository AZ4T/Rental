"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { doRefresh } from "@/services/api";

export function AuthInitializer() {
    const triedRef = useRef(false);

    useEffect(() => {
        if (triedRef.current) return;
        triedRef.current = true;
        // Always attempt a refresh on cold load so an expired access token
        // (15 min TTL) gets replaced immediately rather than on the first
        // failing API call. If there's no refresh cookie (guest), the request
        // rejects quickly and we only log out if we were previously authenticated.
        const wasAuthenticated = useAuthStore.getState().isAuthenticated;
        doRefresh().catch(() => {
            if (wasAuthenticated) {
                useAuthStore.getState().logout();
            }
        });
    }, []);

    return null;
}
