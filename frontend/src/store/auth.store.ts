import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

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

            setAuth: (user, token) =>
                set({ user, access_token: token, isAuthenticated: true }),

            setUser: (user) => set({ user }),

            logout: () =>
                set({ user: null, access_token: null, isAuthenticated: false }),
        }),
        {
            name: "auth-storage",
            // Persist only user display data, never the token
            partialize: (state) => ({ user: state.user }),
        },
    ),
);
