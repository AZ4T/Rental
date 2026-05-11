import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import Cookies from "js-cookie";

interface AuthState {
    user: User | null;
    access_token: string | null;
    isAuthenticated: boolean;

    setAuth: (user: User, token: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            access_token: null,
            isAuthenticated: false,

            setAuth: (user, token) => {
                localStorage.setItem("access_token", token);
                Cookies.set("access_token", token, { expires: 1 / 96 }); // 15 минут
                set({ user, access_token: token, isAuthenticated: true });
            },

            setUser: (user) => set({ user }),

            logout: () => {
                localStorage.removeItem("access_token");
                Cookies.remove("access_token");
                set({ user: null, access_token: null, isAuthenticated: false });
            },
        }),
        {
            name: "auth-storage", // ключ в localStorage
            partialize: (state) => ({
                user: state.user,
                access_token: state.access_token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.access_token) {
                    Cookies.set("access_token", state.access_token, {
                        expires: 1,
                    });
                }
            },
        },
    ),
);
