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

function getDeviceId(): string {
    const key = 'device_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }
    return id;
}

interface AuthResponse {
    access_token: string;
    user: User;
}

function safeRedirectPath(raw: string | null): string {
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
    return raw;
}

export function useLogin(redirectTo?: string | null) {
    const { setAuth } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: (dto: LoginDto) =>
            api.post<AuthResponse>("/auth/login", { ...dto, device_id: getDeviceId() }).then((r) => r.data),

        onSuccess: (data) => {
            setAuth(data.user, data.access_token);
            toast.success("Вы успешно вошли");

            if (data.user.role === "ADMIN") {
                router.push("/admin");
            } else {
                router.push(safeRedirectPath(redirectTo ?? null));
            }
        },

        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка входа");
        },
    });
}

export function useGoogleSignIn(redirectTo?: string | null) {
    const { setAuth } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: (idToken: string) =>
            api
                .post<AuthResponse>("/auth/google", {
                    id_token: idToken,
                    device_id: getDeviceId(),
                })
                .then((r) => r.data),

        onSuccess: (data) => {
            setAuth(data.user, data.access_token);
            toast.success("Вы вошли через Google");
            if (data.user.role === "ADMIN") {
                router.push("/admin");
            } else {
                router.push(safeRedirectPath(redirectTo ?? null));
            }
        },

        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка входа через Google");
        },
    });
}

export function useRegister() {
    const { setAuth } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: (dto: RegisterDto) =>
            api.post<AuthResponse>("/auth/register", { ...dto, device_id: getDeviceId() }).then((r) => r.data),

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

interface ForgotPasswordDto {
    email: string;
}

interface ResetPasswordDto {
    token: string;
    password: string;
}

interface ChangePasswordDto {
    current_password: string;
    new_password: string;
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: (dto: ForgotPasswordDto) =>
            api.post<{ message: string }>("/auth/forgot-password", dto).then((r) => r.data),
        onSuccess: () => {
            toast.success("Если аккаунт существует, письмо будет отправлено");
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка");
        },
    });
}

export function useResetPassword() {
    const router = useRouter();

    return useMutation({
        mutationFn: (dto: ResetPasswordDto) =>
            api.post<{ message: string }>("/auth/reset-password", dto).then((r) => r.data),
        onSuccess: () => {
            toast.success("Пароль изменён. Войдите заново.");
            router.push("/auth/login");
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Ссылка недействительна или истекла");
        },
    });
}

export function useChangePassword() {
    const { logout } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: ChangePasswordDto) =>
            api.post<{ message: string }>("/auth/change-password", dto).then((r) => r.data),
        onSuccess: () => {
            toast.success("Пароль изменён. Войдите заново.");
            disconnectSocket();
            logout();
            queryClient.clear();
            router.push("/auth/login");
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка смены пароля");
        },
    });
}

export function useLogout() {
    const { logout } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();

    const doLogout = () => {
        disconnectSocket();
        logout();
        queryClient.clear();
        router.push("/auth/login");
    };

    return useMutation({
        mutationFn: () => api.post("/auth/logout").then((r) => r.data),
        onSuccess: doLogout,
        onError: doLogout,
    });
}
