"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePayRental } from "@/hooks/use-wallet";
import { useAuthStore } from "@/store/auth.store";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ScanRentalData {
    id: string;
    start_date: string;
    end_date: string;
    total_price: number;
    payment_status: string;
    listing: {
        title: string;
    };
    renter: {
        name: string;
    };
}

interface Props {
    params: Promise<{ token: string }>;
}

export default function ScanRentalPage({ params }: Props) {
    const t = useTranslations("Rental");
    const { token } = use(params);
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [paid, setPaid] = useState(false);

    const { data: rental, isLoading, isError } = useQuery<ScanRentalData>({
        queryKey: ["rental-scan", token],
        queryFn: () =>
            api.get<ScanRentalData>(`/rental-requests/scan/${token}`).then((r) => r.data),
        enabled: !!token,
        retry: false,
    });

    const { mutate: pay, isPending: isPaying } = usePayRental();

    const handlePay = () => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        if (!rental) return;
        pay(rental.id, {
            onSuccess: () => {
                setPaid(true);
                toast.success(t("scanPayOk"));
            },
            onError: (e: Error) => {
                toast.error(e.message ?? t("scanPayError"));
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isError || !rental) {
        return (
            <div className="flex flex-col items-center py-20 gap-4 text-center">
                <p className="text-red-500 text-lg">{t("scanInvalid")}</p>
                <Button asChild variant="outline">
                    <Link href="/">{t("scanHome")}</Link>
                </Button>
            </div>
        );
    }

    const alreadyPaid = paid || rental.payment_status === "PAID";

    return (
        <div className="max-w-md mx-auto py-12 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-center">{t("scanTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground">{t("scanListing")}</p>
                            <p className="font-semibold">{rental.listing.title}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{t("scanRenter")}</p>
                            <p className="font-medium">{rental.renter.name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {new Date(rental.start_date).toLocaleDateString()} —{" "}
                                {new Date(rental.end_date).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-3">
                            <span className="text-muted-foreground">{t("scanTotal")}</span>
                            <span className="text-xl font-bold text-blue-600">
                                {Number(rental.total_price).toLocaleString()} ₸
                            </span>
                        </div>
                    </div>

                    {alreadyPaid ? (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <Badge className="bg-green-100 text-green-700 gap-1 text-sm px-3 py-1">
                                <CheckCircle className="h-4 w-4" />
                                {t("scanAlreadyPaid")}
                            </Badge>
                            <Button asChild variant="outline" className="mt-2">
                                <Link href="/rentals/my">{t("scanMyRentals")}</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {!isAuthenticated && (
                                <p className="text-sm text-center text-muted-foreground">
                                    {t("scanLoginToPay")}
                                </p>
                            )}
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={handlePay}
                                disabled={isPaying}
                            >
                                {isPaying ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <CreditCard className="h-4 w-4 mr-2" />
                                )}
                                {t("scanPayBtn")}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
