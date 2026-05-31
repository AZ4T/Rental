"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { doRefresh } from "@/services/api";

export function AuthInitializer() {
    const triedRef = useRef(false);

    useEffect(() => {
        if (triedRef.current) return;
        // We must run this AFTER zustand persist has finished hydrating the
        // store from localStorage — otherwise on first render the store still
        // holds defaults (isAuthenticated=false, user=null) and an effect with
        // empty deps that bailed on `!user` would never fire again. Read state
        // imperatively here so we always see the post-hydration values.
        const state = useAuthStore.getState();
        if (state.isAuthenticated) {
            triedRef.current = true;
            return;
        }
        triedRef.current = true;
        // Try refresh on every cold load. If there's no refresh cookie
        // (guest user), the call rejects quickly and logout() is a no-op.
        doRefresh().catch(() => useAuthStore.getState().logout());
    }, []);

    return null;
}
