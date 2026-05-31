import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { User } from "@/types";

const api = axios.create({
    baseURL: "/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().access_token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Shared promise guard — only one /auth/refresh request in flight at a time
let refreshPromise: Promise<string> | null = null;
let isRedirectingToLogin = false;

export function doRefresh(): Promise<string> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = axios
        .post<{ access_token: string; user: User }>(
            "/api/auth/refresh",
            {},
            {
                withCredentials: true,
                headers: { "X-Requested-With": "XMLHttpRequest" },
            },
        )
        .then((res) => {
            useAuthStore.getState().setAuth(res.data.user, res.data.access_token);
            return res.data.access_token;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;

            try {
                const access_token = await doRefresh();
                original.headers.Authorization = `Bearer ${access_token}`;
                return api(original);
            } catch (refreshError: unknown) {
                // Only force logout if the refresh ITSELF was rejected by the
                // server (real auth failure). On transient network errors we
                // keep the session intact so a flaky wifi doesn't kick the user.
                const status =
                    typeof refreshError === "object" &&
                    refreshError !== null &&
                    "response" in refreshError
                        ? (refreshError as { response?: { status?: number } }).response?.status
                        : undefined;
                const isAuthFailure = status === 401 || status === 403;
                if (!isAuthFailure) {
                    // Don't touch local state — surface the original error so callers can retry.
                    return Promise.reject(refreshError);
                }

                const { user, logout } = useAuthStore.getState();
                const wasAuthenticated = !!user;
                logout();
                if (
                    typeof window !== "undefined" &&
                    wasAuthenticated &&
                    !isRedirectingToLogin &&
                    !window.location.pathname.startsWith("/auth/")
                ) {
                    isRedirectingToLogin = true;
                    // Reset the flag once the navigation completes — the new page
                    // re-evaluates this module fresh, but if the browser ever
                    // recycles us via bfcache we want the next failure to redirect again.
                    setTimeout(() => {
                        isRedirectingToLogin = false;
                    }, 5_000);
                    window.location.href = "/auth/login";
                }
            }
        }

        const message =
            error.response?.data?.message ??
            error.response?.data?.error ??
            error.message;
        return Promise.reject(new Error(Array.isArray(message) ? message[0] : message));
    },
);

export default api;
