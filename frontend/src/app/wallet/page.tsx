"use client";

import { useState } from "react";
import { useWallet, useTopUp } from "@/hooks/use-wallet";
import { Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowDownLeft, ArrowUpRight, CreditCard, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { StripePaymentModal } from "@/components/stripe-payment-modal";

const QUICK_AMOUNTS = [1000, 5000, 10000, 50000];

function downloadPDF(transactions: Transaction[], balance: number) {
    const rows = transactions.map((tx) => {
        const isIncoming = tx.type === "DEPOSIT" || tx.type === "INCOME";
        const sign = isIncoming ? "+" : "-";
        const date = new Date(tx.created_at).toLocaleDateString("ru-RU");
        const color = isIncoming ? "#16a34a" : "#dc2626";
        return `
            <tr>
                <td>${date}</td>
                <td>${tx.description}</td>
                <td style="color:${color};text-align:right;font-weight:600">${sign}${Number(tx.amount).toLocaleString()} ₸</td>
            </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Выписка по кошельку</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
  h1 { text-align: center; font-size: 22px; margin-bottom: 24px; }
  .meta { font-size: 13px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; border-bottom: 2px solid #111; padding: 6px 8px; font-weight: 700; }
  th:last-child { text-align: right; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>Выписка по кошельку</h1>
  <div class="meta">
    <div>Баланс: <strong>${Number(balance).toLocaleString()} ₸</strong></div>
    <div>Дата формирования: ${new Date().toLocaleDateString("ru-RU")}</div>
  </div>
  <table>
    <thead><tr><th>Дата</th><th>Описание</th><th style="text-align:right">Сумма</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
}

function TransactionRow({ tx }: { tx: Transaction }) {
    const isIncoming = tx.type === "DEPOSIT" || tx.type === "INCOME";
    return (
        <div className="flex items-center gap-3 py-3 border-b last:border-0">
            <div className={`p-2 rounded-full shrink-0 ${isIncoming ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
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
    const { data, isLoading, refetch } = useWallet();
    const { mutate: topUp } = useTopUp();
    const [stripeOpen, setStripeOpen] = useState(false);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [customAmt, setCustomAmt] = useState("");

    const openStripe = (amount: number) => {
        if (amount <= 0 || amount > 1_000_000) {
            toast.error("Сумма от 1 до 1 000 000 ₸");
            return;
        }
        setPendingAmount(amount);
        setStripeOpen(true);
    };

    const handleStripeSuccess = () => {
        setStripeOpen(false);
        topUp(pendingAmount, {
            onSuccess: () => {
                toast.success(`Кошелёк пополнен на ${pendingAmount.toLocaleString()} ₸`);
                refetch();
            },
            onError: (e: Error) => toast.error(e.message ?? "Ошибка"),
        });
        setCustomAmt("");
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
            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 opacity-80" />
                            <span className="text-sm opacity-80">Баланс</span>
                        </div>
                        <div className="text-right opacity-60 text-xs">Rental Pay</div>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold tracking-tight">
                        {Number(data?.balance ?? 0).toLocaleString()} ₸
                    </p>
                    <p className="text-xs opacity-60 mt-2">Доступно для оплаты аренды</p>
                </CardContent>
            </Card>

            {/* Top-up via Stripe */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Пополнить картой
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Quick amounts */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {QUICK_AMOUNTS.map((amt) => (
                            <button
                                key={amt}
                                onClick={() => openStripe(amt)}
                                className="border rounded-xl py-3 text-sm font-semibold hover:border-[#635BFF] hover:text-[#635BFF] hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all"
                            >
                                {amt.toLocaleString()} ₸
                            </button>
                        ))}
                    </div>

                    {/* Custom amount */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="number"
                                placeholder="Другая сумма (₸)"
                                value={customAmt}
                                onChange={(e) => setCustomAmt(e.target.value)}
                                min={1}
                                max={1000000}
                                className="w-full border rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF]"
                            />
                        </div>
                        <Button
                            onClick={() => openStripe(Number(customAmt))}
                            disabled={!customAmt || Number(customAmt) <= 0}
                            className="bg-[#635BFF] hover:bg-[#5147e8] px-5 rounded-xl shrink-0"
                        >
                            Оплатить
                        </Button>
                    </div>

                    {/* Stripe badge */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <svg viewBox="0 0 60 25" className="h-4 fill-current opacity-50">
                            <path d="M59.64 14.28h-8.06v-1.83h8.06v1.83zm-6.23-7.9c-2.14 0-3.45 1.01-3.45 2.67 0 3.3 5.1 2.08 5.1 4.15 0 .74-.65 1.16-1.7 1.16-1.52 0-2.27-.79-2.27-1.76H48.7c0 1.92 1.37 3.15 4.07 3.15 2.41 0 3.88-1.14 3.88-2.86 0-3.33-5.1-2.1-5.1-4.12 0-.63.55-1.01 1.52-1.01 1.3 0 2.02.62 2.06 1.6h2.32c-.06-1.85-1.38-2.98-3.94-2.98zm-8.9.17h-2.27v7.73h2.27V6.55zm-1.13-3.58c-.78 0-1.4.63-1.4 1.4 0 .78.62 1.4 1.4 1.4.77 0 1.4-.62 1.4-1.4 0-.77-.63-1.4-1.4-1.4zM35.7 6.38c-2.32 0-3.87 1.73-3.87 4.04 0 2.3 1.55 4.04 3.87 4.04 1.2 0 2.15-.5 2.75-1.3v1.12h2.2V6.55h-2.2v1.12c-.6-.81-1.55-1.3-2.75-1.3zm.5 6.06c-1.19 0-2.1-.88-2.1-2.02 0-1.13.91-2.02 2.1-2.02 1.19 0 2.1.89 2.1 2.02 0 1.14-.91 2.02-2.1 2.02zm-8.16-6.06c-1.3 0-2.33.5-2.97 1.35V6.55h-2.2v10.9h2.2v-3.3c.64.85 1.67 1.35 2.97 1.35 2.27 0 3.8-1.74 3.8-4.06 0-2.31-1.53-4.06-3.8-4.06zm-.5 6.06c-1.19 0-2.1-.89-2.1-2.02 0-1.14.91-2.02 2.1-2.02 1.19 0 2.1.88 2.1 2.02 0 1.13-.91 2.02-2.1 2.02z"/>
                        </svg>
                        <span>Безопасная оплата · Тестовый режим</span>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">История операций</CardTitle>
                    {data?.transactions && data.transactions.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadPDF(data.transactions, data.balance)}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                        </Button>
                    )}
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

            <StripePaymentModal
                open={stripeOpen}
                amount={pendingAmount}
                onClose={() => setStripeOpen(false)}
                onSuccess={handleStripeSuccess}
            />
        </div>
    );
}
