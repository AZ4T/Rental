"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { doRefresh } from "@/services/api";

export function AuthInitializer() {
    const { isAuthenticated, user, logout } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) return;
        // `user` is persisted in localStorage — if null, the browser has never had
        // a session, so skip the refresh call entirely (avoids 401 noise for guests)
        if (!user) return;
        doRefresh().catch(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
