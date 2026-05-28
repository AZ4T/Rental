export interface RecentItem {
    id: string;
    title: string;
    price: number;
    city: string;
    image_url: string | null;
    category_name: string;
    viewed_at: string;
}

const KEY = "recently_viewed";
const MAX = 10;

export function saveRecentlyViewed(listing: {
    id: string;
    title: string;
    price: number;
    city: string;
    images: { image_url: string }[];
    category: { name: string };
}): void {
    try {
        const existing = getRecentlyViewed().filter((i) => i.id !== listing.id);
        const item: RecentItem = {
            id: listing.id,
            title: listing.title,
            price: listing.price,
            city: listing.city,
            image_url: listing.images[0]?.image_url ?? null,
            category_name: listing.category.name,
            viewed_at: new Date().toISOString(),
        };
        const updated = [item, ...existing].slice(0, MAX);
        localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {
        // ignore localStorage errors
    }
}

export function getRecentlyViewed(): RecentItem[] {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as RecentItem[]) : [];
    } catch {
        return [];
    }
}
