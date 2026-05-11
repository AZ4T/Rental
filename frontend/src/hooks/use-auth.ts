import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import api from "@/services/api";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { disconnectSocket } from "@/services/socket";

interface LoginDto {
    email: string;
    password: string;
}

interface RegisterDto {
    name: string;
    email: string;
    password: string;
}

interface AuthResponse {
    access_token: string;
    user: User;
}

export function useLogin() {
    const { setAuth } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: (dto: LoginDto) =>
            api.post<AuthResponse>("/auth/login", dto).then((r) => r.data),

        onSuccess: (data) => {
            setAuth(data.user, data.access_token);
            toast.success("Вы успешно вошли");

            // Редирект в зависимости от роли
            if (data.user.role === "ADMIN") {
                router.push("/admin");
            } else {
                router.push("/");
            }
        },

        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка входа");
        },
    });
}

export function useRegister() {
    const { setAuth } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: (dto: RegisterDto) =>
            api.post<AuthResponse>("/auth/register", dto).then((r) => r.data),

        onSuccess: (data) => {
            setAuth(data.user, data.access_token);
            toast.success("Аккаунт успешно создан");
            router.push("/");
        },

        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка регистрации");
        },
    });
}

export function useLogout() {
    const { logout } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => api.post("/auth/logout").then((r) => r.data),

        onSuccess: () => {
            disconnectSocket();
            logout();
            queryClient.clear();
            router.push("/auth/login");
        },
    });
}
