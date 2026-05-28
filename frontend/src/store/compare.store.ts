import { create } from "zustand";
import { Listing } from "@/types";

interface CompareState {
    items: Listing[];
    add: (listing: Listing) => void;
    remove: (id: string) => void;
    clear: () => void;
    has: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>((set, get) => ({
    items: [],
    add: (listing) => {
        if (get().items.length < 3 && !get().has(listing.id)) {
            set((s) => ({ items: [...s.items, listing] }));
        }
    },
    remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    clear: () => set({ items: [] }),
    has: (id) => get().items.some((i) => i.id === id),
}));
