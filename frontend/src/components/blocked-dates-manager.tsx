"use client";

import { useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, X, CalendarOff } from "lucide-react";
import { toast } from "sonner";
import {
    BlockedDate,
    useBlockDates,
    useUnblockDates,
} from "@/hooks/use-listings";
import { useTranslations } from "next-intl";

interface Props {
    listingId: string;
    blocked: BlockedDate[];
}

export function BlockedDatesManager({ listingId, blocked }: Props) {
    const t = useTranslations("Listing");
    const [range, setRange] = useState<DateRange | undefined>();
    const [reason, setReason] = useState("");
    const { mutate: block, isPending: isBlocking } = useBlockDates(listingId);
    const { mutate: unblock, isPending: isUnblocking } = useUnblockDates(listingId);

    const submit = () => {
        if (!range?.from || !range?.to) {
            toast.error(t("blockPickRange"));
            return;
        }
        block(
            {
                start_date: range.from.toISOString().split("T")[0],
                end_date: range.to.toISOString().split("T")[0],
                reason: reason.trim() || undefined,
            },
            {
                onSuccess: () => {
                    setRange(undefined);
                    setReason("");
                    toast.success(t("blockOk"));
                },
                onError: (e: Error) => toast.error(e.message ?? t("blockError")),
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <CalendarOff className="h-4 w-4" />
                    {t("blockTitle")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{t("blockHint")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    disabled={{ before: new Date() }}
                    numberOfMonths={2}
                    showOutsideDays={false}
                />

                <Input
                    placeholder={t("blockReasonPlaceholder")}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={255}
                />

                <Button
                    onClick={submit}
                    disabled={isBlocking || !range?.from || !range?.to}
                    className="w-full"
                >
                    {isBlocking ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Lock className="h-4 w-4 mr-2" />
                    )}
                    {t("blockBtn")}
                </Button>

                {blocked.length > 0 && (
                    <div className="space-y-2 pt-3 border-t">
                        <p className="text-sm font-medium">{t("blockedListTitle")}</p>
                        <div className="space-y-2">
                            {blocked.map((b) => (
                                <div
                                    key={b.id}
                                    className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
                                >
                                    <div className="text-sm min-w-0">
                                        <p className="font-medium">
                                            {new Date(b.start_date).toLocaleDateString()} —{" "}
                                            {new Date(b.end_date).toLocaleDateString()}
                                        </p>
                                        {b.reason && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {b.reason}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={isUnblocking}
                                        onClick={() => unblock(b.id)}
                                    >
                                        <X className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
