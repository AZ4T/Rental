"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Listing } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";
import { toast } from "sonner";

interface Props {
    listing: Listing;
    onClose: () => void;
}

export function RentalRequestDialog({ listing, onClose }: Props) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const days =
        startDate && endDate
            ? Math.ceil(
                  (new Date(endDate).getTime() -
                      new Date(startDate).getTime()) /
                      (1000 * 60 * 60 * 24),
              )
            : 0;

    const totalPrice = days > 0 ? days * Number(listing.price) : 0;

    const { mutate: createRequest, isPending } = useMutation({
        mutationFn: () =>
            api.post("/rental-requests", {
                listing_id: listing.id,
                start_date: startDate,
                end_date: endDate,
            }),
        onSuccess: () => {
            toast.success("Заявка отправлена!");
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка отправки заявки");
        },
    });

    const handleSubmit = () => {
        if (!startDate || !endDate) {
            toast.error("Выберите даты");
            return;
        }
        if (days <= 0) {
            toast.error("Дата окончания должна быть позже даты начала");
            return;
        }
        createRequest();
    };

    const today = new Date().toISOString().split("T")[0];

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Оформить аренду</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {listing.title}
                    </p>

                    <div className="space-y-1">
                        <Label>Дата начала</Label>
                        <Input
                            type="date"
                            min={today}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Дата окончания</Label>
                        <Input
                            type="date"
                            min={startDate || today}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    {days > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Количество дней
                                </span>
                                <span className="font-medium">{days}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Цена за день
                                </span>
                                <span className="font-medium">
                                    {Number(listing.price).toLocaleString()} ₸
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Залог
                                </span>
                                <span className="font-medium">
                                    {Number(listing.deposit).toLocaleString()} ₸
                                </span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-semibold">
                                <span>Итого</span>
                                <span className="text-blue-600">
                                    {totalPrice.toLocaleString()} ₸
                                </span>
                            </div>
                        </div>
                    )}

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
                            disabled={isPending || days <= 0}
                        >
                            {isPending ? "Отправляем..." : "Отправить заявку"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
