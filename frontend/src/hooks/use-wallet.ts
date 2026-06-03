import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Transaction } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

interface WalletData {
    balance: number;
    deposit_balance: number;
    premium_until: string | null;
    is_premium: boolean;
    transactions: Transaction[];
}

export function useWallet() {
    const { isAuthenticated } = useAuthStore();
    return useQuery<WalletData>({
        queryKey: ["wallet"],
        queryFn: () => api.get("/wallet").then((r) => r.data),
        enabled: isAuthenticated,
    });
}

export function useTopUp() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (amount: number) =>
            api.post("/wallet/top-up", { amount }).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["wallet"] });
        },
    });
}

export function usePayRental() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (rentalRequestId: string) =>
            api.post(`/wallet/pay/${rentalRequestId}`).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["wallet"] });
            qc.invalidateQueries({ queryKey: ["rentals"] });
        },
    });
}

export type PromotionTier = "basic" | "pro" | "premium";

export interface PromotionPlan {
    key: PromotionTier;
    price: number;
    days: number;
}

export function usePromotionTiers() {
    return useQuery({
        queryKey: ["promotion-tiers"],
        queryFn: () =>
            api.get<PromotionPlan[]>("/wallet/promotion-tiers").then((r) => r.data),
        staleTime: 5 * 60_000,
    });
}

export function usePromoteListing() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ listingId, tier }: { listingId: string; tier: PromotionTier }) =>
            api
                .post<{ promoted_until: string; price: number; tier: PromotionTier }>(
                    `/wallet/promote/${listingId}`,
                    { tier },
                )
                .then((r) => r.data),
        onSuccess: (data) => {
            toast.success(`Объявление продвинуто (${data.tier})`);
            qc.invalidateQueries({ queryKey: ["wallet"] });
            qc.invalidateQueries({ queryKey: ["listings"] });
        },
        onError: (e: Error) =>
            toast.error(e.message ?? "Не удалось продвинуть"),
    });
}

export function useSubscribePremium() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () =>
            api
                .post<{ premium_until: string; price: number }>("/wallet/premium")
                .then((r) => r.data),
        onSuccess: () => {
            toast.success("Premium активирован на 30 дней");
            qc.invalidateQueries({ queryKey: ["wallet"] });
            qc.invalidateQueries({ queryKey: ["user", "me"] });
            qc.invalidateQueries({ queryKey: ["users", "me"] });
        },
        onError: (e: Error) =>
            toast.error(e.message ?? "Не удалось активировать Premium"),
    });
}
