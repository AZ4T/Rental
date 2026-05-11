"use client";

import { useState } from "react";
import { useWallet, useTopUp } from "@/hooks/use-wallet";
import { Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const QUICK_AMOUNTS = [1000, 5000, 10000, 50000];

function TransactionRow({ tx }: { tx: Transaction }) {
    const isIncoming = tx.type === "DEPOSIT" || tx.type === "INCOME";

    return (
        <div className="flex items-center gap-3 py-3 border-b last:border-0">
            <div className={`p-2 rounded-full ${isIncoming ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                {isIncoming
                    ? <ArrowDownLeft className="h-4 w-4 text-green-600 dark:text-green-400" />
                    : <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: ru })}
                </p>
            </div>
            <span className={`font-semibold text-sm shrink-0 ${isIncoming ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {isIncoming ? "+" : "−"}{Number(tx.amount).toLocaleString()} ₸
            </span>
        </div>
    );
}

export default function WalletPage() {
    const { data, isLoading } = useWallet();
    const { mutate: topUp, isPending } = useTopUp();
    const [custom, setCustom] = useState("");

    const handleTopUp = (amount: number) => {
        if (amount <= 0 || amount > 1_000_000) {
            toast.error("Введите сумму от 1 до 1 000 000 ₸");
            return;
        }
        topUp(amount, {
            onSuccess: () => toast.success(`Кошелёк пополнен на ${amount.toLocaleString()} ₸`),
            onError: (e: Error) => toast.error(e.message ?? "Ошибка пополнения"),
        });
        setCustom("");
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Кошелёк</h1>

            {/* Balance card */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Wallet className="h-5 w-5 opacity-80" />
                        <span className="text-sm opacity-80">Баланс</span>
                    </div>
                    <p className="text-4xl font-bold">
                        {Number(data?.balance ?? 0).toLocaleString()} ₸
                    </p>
                </CardContent>
            </Card>

            {/* Top-up */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Пополнить
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                        {QUICK_AMOUNTS.map((amt) => (
                            <Button
                                key={amt}
                                variant="outline"
                                size="sm"
                                onClick={() => handleTopUp(amt)}
                                disabled={isPending}
                            >
                                {amt.toLocaleString()} ₸
                            </Button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Другая сумма"
                            value={custom}
                            onChange={(e) => setCustom(e.target.value)}
                            min={1}
                            max={1000000}
                        />
                        <Button
                            onClick={() => handleTopUp(Number(custom))}
                            disabled={isPending || !custom}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Пополнить"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">История операций</CardTitle>
                </CardHeader>
                <CardContent>
                    {!data?.transactions.length ? (
                        <p className="text-center text-muted-foreground py-6 text-sm">
                            Операций пока нет
                        </p>
                    ) : (
                        data.transactions.map((tx) => (
                            <TransactionRow key={tx.id} tx={tx} />
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
