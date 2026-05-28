"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Lock, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";

interface Props {
    open: boolean;
    amount: number;
    onClose: () => void;
    onSuccess: () => void;
}

function formatCardNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + " / " + digits.slice(2);
    return digits;
}

function getCardBrand(num: string): "visa" | "mc" | "mir" | null {
    const n = num.replace(/\s/g, "");
    if (n.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mc";
    if (n.startsWith("2")) return "mir";
    return null;
}

function CardBrandIcon({ brand }: { brand: "visa" | "mc" | "mir" | null }) {
    if (!brand) return <CreditCard className="h-5 w-5 text-gray-400" />;
    const logos: Record<string, string> = {
        visa: "VISA",
        mc: "MC",
        mir: "МИР",
    };
    const colors: Record<string, string> = {
        visa: "text-blue-700 font-bold italic",
        mc: "text-red-600 font-bold",
        mir: "text-green-700 font-bold",
    };
    return <span className={`text-sm ${colors[brand]}`}>{logos[brand]}</span>;
}

export function StripePaymentModal({ open, amount, onClose, onSuccess }: Props) {
    const [cardNum, setCardNum] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [name, setName] = useState("");
    const [step, setStep] = useState<"form" | "processing" | "success">("form");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const expiryRef = useRef<HTMLInputElement>(null);
    const cvcRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);

    const brand = getCardBrand(cardNum);

    const validate = () => {
        const e: Record<string, string> = {};
        const digits = cardNum.replace(/\s/g, "");
        if (digits.length !== 16) e.card = "Введите 16 цифр карты";
        const expDigits = expiry.replace(/\s\/\s/, "");
        if (expDigits.length !== 4) e.expiry = "Укажите срок (ММ/ГГ)";
        else {
            const m = parseInt(expDigits.slice(0, 2));
            if (m < 1 || m > 12) e.expiry = "Неверный месяц";
        }
        if (cvc.length < 3) e.cvc = "Введите CVC";
        if (!name.trim()) e.name = "Введите имя";
        return e;
    };

    const handlePay = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        setStep("processing");
        setTimeout(() => {
            setStep("success");
            setTimeout(() => {
                onSuccess();
                setStep("form");
                setCardNum(""); setExpiry(""); setCvc(""); setName("");
            }, 1600);
        }, 2200);
    };

    const handleClose = () => {
        if (step === "processing") return;
        setStep("form");
        setErrors({});
        setCardNum(""); setExpiry(""); setCvc(""); setName("");
        onClose();
    };

    const inputCls = (err?: string) =>
        `w-full border rounded-md px-3 py-2.5 text-base focus:outline-none focus:ring-2 transition-all ${
            err
                ? "border-red-400 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
        }`;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
                <DialogTitle className="sr-only">Оплата</DialogTitle>

                {/* Header */}
                <div className="bg-[#635BFF] px-6 py-5 text-white">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium opacity-80">Rental Platform</span>
                        <Lock className="h-4 w-4 opacity-70" />
                    </div>
                    <p className="text-2xl font-bold">{amount.toLocaleString()} ₸</p>
                    <p className="text-sm opacity-70 mt-0.5">Пополнение кошелька</p>
                </div>

                <div className="p-6 space-y-4">
                    {step === "success" ? (
                        <div className="flex flex-col items-center py-6 gap-3 animate-in fade-in">
                            <CheckCircle2 className="h-14 w-14 text-green-500" />
                            <p className="text-lg font-semibold">Оплата прошла!</p>
                            <p className="text-sm text-muted-foreground text-center">
                                {amount.toLocaleString()} ₸ добавлено на кошелёк
                            </p>
                        </div>
                    ) : step === "processing" ? (
                        <div className="flex flex-col items-center py-6 gap-3">
                            <Loader2 className="h-12 w-12 animate-spin text-[#635BFF]" />
                            <p className="text-sm text-muted-foreground">Обрабатываем платёж...</p>
                        </div>
                    ) : (
                        <>
                            {/* Demo hint */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 leading-relaxed">
                                <strong>Тестовый режим.</strong> Используйте карту:{" "}
                                <span className="font-mono font-semibold">4242 4242 4242 4242</span>,
                                любой будущий срок, любой CVC.
                            </div>

                            {/* Card number */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Номер карты
                                </label>
                                <div className="relative">
                                    <input
                                        className={inputCls(errors.card)}
                                        placeholder="1234 5678 9012 3456"
                                        value={cardNum}
                                        inputMode="numeric"
                                        onChange={(e) => {
                                            const v = formatCardNumber(e.target.value);
                                            setCardNum(v);
                                            setErrors((p) => ({ ...p, card: "" }));
                                            if (v.replace(/\s/g, "").length === 16) expiryRef.current?.focus();
                                        }}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <CardBrandIcon brand={brand} />
                                    </span>
                                </div>
                                {errors.card && <p className="text-xs text-red-500 mt-1">{errors.card}</p>}
                            </div>

                            {/* Expiry + CVC */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Срок действия
                                    </label>
                                    <input
                                        ref={expiryRef}
                                        className={inputCls(errors.expiry)}
                                        placeholder="ММ / ГГ"
                                        value={expiry}
                                        inputMode="numeric"
                                        onChange={(e) => {
                                            const v = formatExpiry(e.target.value);
                                            setExpiry(v);
                                            setErrors((p) => ({ ...p, expiry: "" }));
                                            if (v.replace(/\s\/\s/g, "").length === 4) cvcRef.current?.focus();
                                        }}
                                    />
                                    {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        CVC
                                    </label>
                                    <input
                                        ref={cvcRef}
                                        className={inputCls(errors.cvc)}
                                        placeholder="123"
                                        value={cvc}
                                        inputMode="numeric"
                                        maxLength={4}
                                        type="password"
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                            setCvc(v);
                                            setErrors((p) => ({ ...p, cvc: "" }));
                                            if (v.length >= 3) nameRef.current?.focus();
                                        }}
                                    />
                                    {errors.cvc && <p className="text-xs text-red-500 mt-1">{errors.cvc}</p>}
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Имя на карте
                                </label>
                                <input
                                    ref={nameRef}
                                    className={inputCls(errors.name)}
                                    placeholder="IVAN PETROV"
                                    value={name}
                                    autoCapitalize="characters"
                                    onChange={(e) => {
                                        setName(e.target.value.toUpperCase());
                                        setErrors((p) => ({ ...p, name: "" }));
                                    }}
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            {/* Pay button */}
                            <button
                                onClick={handlePay}
                                className="w-full bg-[#635BFF] hover:bg-[#5147e8] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
                            >
                                <Lock className="h-4 w-4" />
                                Оплатить {amount.toLocaleString()} ₸
                            </button>

                            {/* Footer */}
                            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pt-1">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>Защищено</span>
                                <span className="font-bold text-gray-500 italic ml-0.5">stripe</span>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
