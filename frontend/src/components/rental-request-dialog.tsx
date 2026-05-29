"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Clock, X } from "lucide-react";

const AGREEMENT_TEXT = `ДОГОВОР АРЕНДЫ — УСЛОВИЯ ИСПОЛЬЗОВАНИЯ ПЛАТФОРМЫ

1. Арендатор обязуется вернуть арендованное имущество в указанный срок и в исходном состоянии, пригодном для дальнейшего использования.

2. Арендатор несёт полную материальную ответственность за повреждение, утрату или уничтожение имущества в период аренды. В случае повреждения залог удерживается полностью или частично по согласованию сторон.

3. Арендодатель гарантирует исправность и комплектность передаваемого имущества на момент начала аренды. При обнаружении скрытых дефектов арендатор обязан незамедлительно уведомить арендодателя.

4. Оплата аренды производится через платформу в полном объёме до начала периода аренды. Залог возвращается арендатору после успешного завершения аренды и проверки состояния имущества.

5. Использование имущества допускается только по прямому назначению. Передача имущества третьим лицам без письменного согласия арендодателя запрещена.

6. Платформа выступает гарантом сделки и обеспечивает безопасность расчётов. Платформа не несёт ответственности за действия или бездействие сторон, нарушающие настоящие условия.

7. В случае несвоевременного возврата имущества начисляется штраф в размере двойной дневной ставки за каждый день просрочки.

8. Все споры разрешаются через службу поддержки платформы. При невозможности урегулирования в досудебном порядке стороны вправе обратиться в суд по месту нахождения платформы.

9. Подача заявки на аренду означает полное принятие настоящих условий обеими сторонами.`;

interface Props {
    listing: Listing;
    initialStartDate?: string;
    initialEndDate?: string;
    onClose: () => void;
}

export function RentalRequestDialog({
    listing,
    initialStartDate = "",
    initialEndDate = "",
    onClose,
}: Props) {
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [returnTime, setReturnTime] = useState("");
    const [agreed, setAgreed] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    const useHourly = returnTime.length > 0;

    // Build end datetime string for backend
    const endDatetime = endDate
        ? returnTime
            ? `${endDate}T${returnTime}:00`
            : endDate
        : "";

    const diffMs =
        startDate && endDatetime
            ? new Date(endDatetime).getTime() - new Date(startDate).getTime()
            : 0;

    const totalHours = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
    const totalDays = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;

    const hourlyRate = Number(listing.price) / 24;
    const rentalCost = useHourly
        ? Math.ceil(totalHours) * hourlyRate
        : totalDays * Number(listing.price);
    const totalPrice = rentalCost + Number(listing.deposit);

    const isValid =
        startDate &&
        endDate &&
        diffMs > 0 &&
        agreed;

    const { mutate: createRequest, isPending } = useMutation({
        mutationFn: () =>
            api.post("/rental-requests", {
                listing_id: listing.id,
                start_date: startDate,
                end_date: endDatetime,
            }),
        onSuccess: () => {
            toast.success("Заявка на аренду отправлена!");
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Ошибка отправки заявки");
        },
    });

    const handleSubmit = () => {
        if (!startDate || !endDate) { toast.error("Выберите даты"); return; }
        if (diffMs <= 0) { toast.error("Дата окончания должна быть позже даты начала"); return; }
        if (!agreed) { toast.error("Необходимо принять условия аренды"); return; }
        createRequest();
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Оформить аренду</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate font-medium">
                        {listing.title}
                    </p>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
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
                    </div>

                    {/* Return time (optional) */}
                    <div className="space-y-1">
                        <Label className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            Время возврата
                            <span className="text-xs text-muted-foreground font-normal">(необязательно — для почасового расчёта)</span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="time"
                                value={returnTime}
                                onChange={(e) => setReturnTime(e.target.value)}
                                className="w-40"
                            />
                            {returnTime && (
                                <button
                                    type="button"
                                    onClick={() => setReturnTime("")}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Сбросить
                                </button>
                            )}
                        </div>
                        {returnTime && (
                            <p className="text-xs text-blue-600">
                                Расчёт по часам: {hourlyRate.toFixed(0)} ₸/час
                            </p>
                        )}
                    </div>

                    {/* Cost breakdown */}
                    {diffMs > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1.5 text-sm">
                            {useHourly ? (
                                <>
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>{Math.ceil(totalHours)} ч. × {hourlyRate.toFixed(0)} ₸</span>
                                        <span>{rentalCost.toFixed(0)} ₸</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>{totalDays} дн. × {Number(listing.price).toLocaleString()} ₸</span>
                                    <span>{rentalCost.toLocaleString()} ₸</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Залог (возвратный)</span>
                                <span>{Number(listing.deposit).toLocaleString()} ₸</span>
                            </div>
                            <div className="border-t pt-1.5 flex justify-between font-bold">
                                <span>Итого</span>
                                <span className="text-blue-600">{totalPrice.toLocaleString()} ₸</span>
                            </div>
                        </div>
                    )}

                    {/* Rental agreement */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-muted/30 border-b">
                            <p className="text-sm font-semibold">Условия аренды</p>
                        </div>
                        <div className="px-4 py-3">
                            <div className="max-h-56 overflow-y-auto rounded bg-muted/40 p-4 text-sm text-foreground whitespace-pre-line leading-relaxed">
                                {AGREEMENT_TEXT}
                            </div>
                        </div>
                        <div className="flex items-start gap-3 px-4 pb-4 pt-1">
                            <input
                                type="checkbox"
                                id="agreement"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-0.5 h-4 w-4 cursor-pointer accent-blue-600"
                            />
                            <label
                                htmlFor="agreement"
                                className="text-sm cursor-pointer leading-snug"
                            >
                                Я ознакомился с условиями аренды и принимаю их
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            Отмена
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={isPending || !isValid}
                        >
                            {isPending ? "Отправляем..." : "Отправить заявку"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
