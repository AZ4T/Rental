import { create } from "zustand";
import { Listing } from "@/types";

interface CompareState {
    items: Listing[];
    add: (listing: Listing) => void;
    remove: (id: string) => void;
    clear: () => void;
    has: (id: string) => boolean;
    validate: (listing: Listing) => string | null;
}

export const useCompareStore = create<CompareState>((set, get) => ({
    items: [],
    validate: (listing) => {
        const { items } = get();
        if (items.length >= 3) return "Можно сравнивать не более 3 объявлений";
        if (items.length > 0 && items[0].category_id !== listing.category_id) {
            return `Сравнивать можно только объявления одной категории (текущая: ${items[0].category.name})`;
        }
        return null;
    },
    add: (listing) => {
        if (get().validate(listing) === null && !get().has(listing.id)) {
            set((s) => ({ items: [...s.items, listing] }));
        }
    },
    remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    clear: () => set({ items: [] }),
    has: (id) => get().items.some((i) => i.id === id),
}));
