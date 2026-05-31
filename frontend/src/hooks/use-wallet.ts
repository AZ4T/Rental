import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Transaction } from "@/types";
import { useAuthStore } from "@/store/auth.store";

interface WalletData {
    balance: number;
    deposit_balance: number;
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
