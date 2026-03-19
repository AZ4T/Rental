import { useMutation } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";

export function useUploadImage() {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await api.post<{ url: string }>(
                "/uploads/image",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                },
            );
            return res.data.url;
        },
        onError: () => {
            toast.error("Ошибка загрузки фото");
        },
    });
}
