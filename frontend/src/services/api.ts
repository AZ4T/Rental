import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;

            try {
                const res = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true },
                );

                const { access_token } = res.data as { access_token: string };
                localStorage.setItem("access_token", access_token);
                Cookies.set("access_token", access_token, { expires: 1 / 96 }); // ← добавляем

                original.headers.Authorization = `Bearer ${access_token}`;
                return api(original);
            } catch {
                localStorage.removeItem("access_token");
                Cookies.remove("access_token"); // ← добавляем
                if (!window.location.pathname.startsWith("/auth/")) {
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
