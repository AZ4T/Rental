"use client";

import { useState } from "react";
import { useWallet, useTopUp, useSubscribePremium } from "@/hooks/use-wallet";
import { Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Wallet, ArrowDownLeft, ArrowUpRight, Smartphone, Loader2, Download, Lock, QrCode, CheckCircle2, Sparkles, Crown } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import QRCode from "react-qr-code";

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
    const t = useTranslations("Wallet");
    const tCommon = useTranslations("Common");
    const { data, isLoading, refetch } = useWallet();
    const { mutate: topUp, isPending: isTopUpPending } = useTopUp();
    const { mutate: subscribePremium, isPending: isSubscribing } =
        useSubscribePremium();
    const [qrAmount, setQrAmount] = useState<number | null>(null);
    const [customAmt, setCustomAmt] = useState("");
    const [premiumOpen, setPremiumOpen] = useState(false);

    const openQr = (amount: number) => {
        if (amount <= 0 || amount > 1_000_000) {
            toast.error(t("amountRangeError"));
            return;
        }
        setQrAmount(amount);
    };

    const handleConfirmPayment = () => {
        if (!qrAmount) return;
        topUp(qrAmount, {
            onSuccess: () => {
                toast.success(t("topUpOk", { amount: qrAmount.toLocaleString() }));
                setQrAmount(null);
                setCustomAmt("");
                refetch();
            },
            onError: (e: Error) => toast.error(e.message ?? tCommon("error")),
        });
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
            <h1 className="text-2xl font-bold">{t("title")}</h1>

            {/* Balance cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 opacity-80" />
                                <span className="text-sm opacity-80">{t("balance")}</span>
                            </div>
                            <div className="text-right opacity-60 text-xs">{t("rentalPay")}</div>
                        </div>
                        <p className="text-3xl sm:text-4xl font-bold tracking-tight">
                            {Number(data?.balance ?? 0).toLocaleString()} ₸
                        </p>
                        <p className="text-xs opacity-60 mt-2">{t("balanceHint")}</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5 opacity-80" />
                                <span className="text-sm opacity-80">{t("depositAccount")}</span>
                            </div>
                            <div className="text-right opacity-60 text-xs">{t("depositFrozen")}</div>
                        </div>
                        <p className="text-3xl sm:text-4xl font-bold tracking-tight">
                            {Number(data?.deposit_balance ?? 0).toLocaleString()} ₸
                        </p>
                        <p className="text-xs opacity-60 mt-2">{t("depositHint")}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Premium */}
            <Card
                className={
                    data?.is_premium
                        ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
                        : "border-2 border-dashed"
                }
            >
                <CardContent className="p-5 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="rounded-full p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white shrink-0">
                            <Crown className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{t("premium")}</h3>
                                {data?.is_premium && data.premium_until && (
                                    <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                                        {t("premiumUntil", { date: new Date(data.premium_until).toLocaleDateString() })}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {t("premiumDesc")}
                            </p>
                        </div>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                        onClick={() => setPremiumOpen(true)}
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {data?.is_premium ? t("premiumExtend") : t("premiumActivate")}
                    </Button>
                </CardContent>
            </Card>

            {/* Top-up via QR */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Smartphone className="h-4 w-4" /> {t("topUpVia")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!qrAmount ? (
                        <>
                            <p className="text-sm text-muted-foreground">{t("topUpHint")}</p>
                            {/* Quick amounts */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {QUICK_AMOUNTS.map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => openQr(amt)}
                                        className="border rounded-xl py-3 text-sm font-semibold hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                    >
                                        {amt.toLocaleString()} ₸
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder={t("customAmount")}
                                    value={customAmt}
                                    onChange={(e) => setCustomAmt(e.target.value)}
                                    min={1}
                                    max={1000000}
                                    className="flex-1 border rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                />
                                <Button
                                    onClick={() => openQr(Number(customAmt))}
                                    disabled={!customAmt || Number(customAmt) <= 0}
                                    className="bg-red-600 hover:bg-red-700 px-5 rounded-xl shrink-0"
                                >
                                    <QrCode className="h-4 w-4 mr-1.5" />
                                    {t("getQr")}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-center">
                                <p className="font-semibold text-lg">{qrAmount.toLocaleString()} ₸</p>
                                <p className="text-sm text-muted-foreground">{t("scanWithKaspi")}</p>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border shadow-sm">
                                <QRCode
                                    value={`https://kaspi.kz/pay?service=rental&amount=${qrAmount}&comment=Wallet+topup`}
                                    size={200}
                                    level="M"
                                />
                            </div>
                            <div className="text-xs text-muted-foreground text-center max-w-xs">
                                {t("kaspiInstruction")}
                            </div>
                            <div className="flex gap-3 w-full max-w-xs">
                                <Button variant="outline" className="flex-1" onClick={() => setQrAmount(null)}>
                                    {tCommon("cancel")}
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={handleConfirmPayment}
                                    disabled={isTopUpPending}
                                >
                                    {isTopUpPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                    )}
                                    {t("iPaid")}
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                        <Smartphone className="h-3.5 w-3.5 opacity-60" />
                        <span>{t("kaspiSafe")}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{t("transactions")}</CardTitle>
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
                            {t("noTransactions")}
                        </p>
                    ) : (
                        data.transactions.map((tx) => (
                            <TransactionRow key={tx.id} tx={tx} />
                        ))
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={premiumOpen}
                title={data?.is_premium ? t("premiumConfirmExtendTitle") : t("premiumConfirmTitle")}
                description={t("premiumConfirmDesc")}
                confirmLabel={data?.is_premium ? t("premiumConfirmExtend") : t("premiumConfirmActivate")}
                pendingLabel={t("premiumPending")}
                variant="default"
                isPending={isSubscribing}
                onConfirm={() =>
                    subscribePremium(undefined, {
                        onSuccess: () => setPremiumOpen(false),
                    })
                }
                onCancel={() => setPremiumOpen(false)}
            />
        </div>
    );
}
