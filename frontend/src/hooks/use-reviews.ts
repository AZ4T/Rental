import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";

interface CreateReviewDto {
    rental_request_id: string;
    target_user_id: string;
    rating: number;
    comment?: string;
}

export function useCreateReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateReviewDto) =>
            api.post("/reviews", dto).then((r) => r.data),
        onSuccess: () => {
            toast.success("Отзыв оставлен!");
            void queryClient.invalidateQueries({ queryKey: ["rentals"] });
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка");
        },
    });
}
