import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Listing, PaginatedResponse, ListingFilters } from "@/types";
import { useAuthStore } from "@/store/auth.store";

export function useListings(filters: ListingFilters = {}) {
    return useQuery({
        queryKey: ["listings", filters],
        queryFn: () =>
            api
                .get<PaginatedResponse<Listing>>("/listings", {
                    params: {
                        ...filters,
                        category_ids: filters.category_ids?.join(","), // ← передаём через запятую
                    },
                })
                .then((r) => r.data),
    });
}

export function useListing(id: string) {
    return useQuery({
        queryKey: ["listing", id],
        queryFn: () => api.get<Listing>(`/listings/${id}`).then((r) => r.data),
        enabled: !!id,
    });
}

export function useCreateListing() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: FormData) =>
            api.post<Listing>("/listings", data).then((r) => r.data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["listings"] });
        },
    });
}

export function useDeleteListing() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            api.delete(`/listings/${id}`).then((r) => r.data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["listings"] });
        },
    });
}

export function useMyListings() {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ["listings", "my"],
        queryFn: () =>
            api
                .get<PaginatedResponse<Listing>>("/listings/my")
                .then((r) => r.data),
        enabled: isAuthenticated,
    });
}

export function useUserListings(userId: string) {
    return useQuery({
        queryKey: ["listings", "user", userId],
        queryFn: () =>
            api.get<Listing[]>(`/listings/user/${userId}`).then((r) => r.data),
        enabled: !!userId,
    });
}

export function useSimilarListings(id: string, categoryId: string) {
    return useQuery({
        queryKey: ["listings", "similar", id],
        queryFn: () =>
            api
                .get<
                    Listing[]
                >(`/listings/${id}/similar?category_id=${categoryId}`)
                .then((r) => r.data),
        enabled: !!id && !!categoryId,
    });
}

export interface BookedRange {
    start_date: string;
    end_date: string;
}

export interface BlockedDate {
    id: string;
    start_date: string;
    end_date: string;
    reason: string | null;
}

export interface ListingAvailability {
    requests: BookedRange[];
    blocked: BlockedDate[];
}

export function useListingAvailability(id: string) {
    return useQuery({
        queryKey: ["listing", id, "availability"],
        queryFn: () =>
            api
                .get<ListingAvailability>(`/listings/${id}/availability`)
                .then((r) => r.data),
        enabled: !!id,
    });
}

export function useBlockDates(listingId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { start_date: string; end_date: string; reason?: string }) =>
            api
                .post<BlockedDate>(`/listings/${listingId}/blocked-dates`, data)
                .then((r) => r.data),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ["listing", listingId, "availability"] });
        },
    });
}

export function useUnblockDates(listingId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (blockId: string) =>
            api
                .delete(`/listings/${listingId}/blocked-dates/${blockId}`)
                .then((r) => r.data),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ["listing", listingId, "availability"] });
        },
    });
}

export interface ListingAnalytics {
    views_count: number;
    total_requests: number;
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
    revenue: number;
}

export function useListingAnalytics(id: string) {
    return useQuery({
        queryKey: ["listing", id, "analytics"],
        queryFn: () =>
            api
                .get<ListingAnalytics>(`/listings/${id}/analytics`)
                .then((r) => r.data),
        enabled: !!id,
    });
}

export function useSetListingVisibility() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
            api
                .patch(`/listings/${id}/visibility`, { hidden })
                .then((r) => r.data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["listings"] });
        },
    });
}
