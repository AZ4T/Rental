"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RentalRequest } from "@/types";
import { useCreateReview } from "@/hooks/use-reviews";
import { Star } from "lucide-react";

interface Props {
    rental: RentalRequest;
    targetUserId?: string;
    dialogTitle?: string;
    onClose: () => void;
}

export function ReviewDialog({ rental, targetUserId, dialogTitle, onClose }: Props) {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState("");
    const { mutate: createReview, isPending } = useCreateReview();

    const handleSubmit = () => {
        if (rating === 0) return;
        createReview({
            rental_request_id: rental.id,
            target_user_id: targetUserId ?? rental.listing.owner_id,
            rating,
            comment: comment.trim() || undefined,
        });
        onClose();
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{dialogTitle ?? "Оставить отзыв"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {rental.listing.title}
                    </p>

                    {/* Звёзды */}
                    <div>
                        <p className="text-sm font-medium mb-2">Оценка</p>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHovered(star)}
                                    onMouseLeave={() => setHovered(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`h-8 w-8 transition-colors ${
                                            star <= (hovered || rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Комментарий */}
                    <div>
                        <p className="text-sm font-medium mb-2">
                            Комментарий (необязательно)
                        </p>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            placeholder="Расскажите о вашем опыте аренды..."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Отмена
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={isPending || rating === 0}
                        >
                            Отправить
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
