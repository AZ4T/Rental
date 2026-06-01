export type Role = "ADMIN" | "USER";

export type RentalRequestStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "COMPLETED";

export type PaymentStatus = "UNPAID" | "PAID";
export type TransactionType =
    | "DEPOSIT"
    | "PAYMENT"
    | "INCOME"
    | "REFUND"
    | "PLATFORM_FEE"
    | "PROMOTION"
    | "PREMIUM";

export type PlatformIncomeSource = "COMMISSION" | "PROMOTION" | "PREMIUM";

export interface PlatformFinance {
    total: number;
    totals: Record<PlatformIncomeSource, number>;
    counts: Record<PlatformIncomeSource, number>;
    activePremium: number;
    activePromoted: number;
    byDay: { date: string; total: number }[];
    recent: {
        id: string;
        amount: number;
        source: PlatformIncomeSource;
        description: string | null;
        created_at: string;
    }[];
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: TransactionType;
    description: string;
    rental_request_id: string | null;
    created_at: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    role: Role;
    rating_avg: string | null;
    reviews_count: number;
    premium_until?: string | null;
    is_premium?: boolean;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    created_at: string;
    _count?: { listings: number };
}

export interface ListingImage {
    id: string;
    listing_id: string;
    image_url: string;
}

export interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    deposit: number;
    city: string;
    owner_id: string;
    category_id: string;
    views_count: number;
    rating_avg: string | null;
    reviews_count: number;
    is_hidden?: boolean;
    hidden_at?: string | null;
    promoted_until?: string | null;
    created_at: string;
    updated_at: string;
    images: ListingImage[];
    category: Category;
    owner: Pick<User, "id" | "name" | "avatar_url" | "rating_avg"> & {
        premium_until?: string | null;
    };
}

export interface Review {
    id: string;
    author_id: string;
    target_user_id: string;
    rental_request_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    author: Pick<User, "id" | "name" | "avatar_url">;
    rentalRequest?: {
        listing: Pick<Listing, "id" | "title" | "images">;
    };
}

export interface Favorite {
    id: string;
    user_id: string;
    listing_id: string;
    created_at: string;
    listing: Listing;
}

// Пагинация
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    };
}

// Фильтры для listings
export interface ListingFilters {
    search?: string;
    category_ids?: string[];
    city?: string;
    price_min?: number;
    price_max?: number;
    page?: number;
    limit?: number;
    sortBy?: "price" | "created_at" | "rating_avg" | "views_count";
    sortOrder?: "asc" | "desc";
}

export interface RentalRequest {
    id: string;
    listing_id: string;
    renter_id: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: RentalRequestStatus;
    payment_status: PaymentStatus;
    created_at: string;
    listing: Listing;
    renter?: Pick<User, "id" | "name" | "avatar_url" | "rating_avg">;
    reviews?: Review[];
    qr_token?: string;
    return_images: string[];
    dispute?: Pick<Dispute, "id" | "status"> | null;
}

export type DisputeStatus =
    | "OPEN"
    | "RESOLVED_FOR_RENTER"
    | "RESOLVED_FOR_OWNER"
    | "RESOLVED_SPLIT"
    | "REJECTED";

export interface Dispute {
    id: string;
    rental_request_id: string;
    opened_by_id: string;
    reason: string;
    description: string | null;
    renter_evidence: string[];
    owner_evidence: string[];
    status: DisputeStatus;
    admin_note: string | null;
    deposit_to_renter: number | null;
    resolved_at: string | null;
    created_at: string;
    updated_at: string;
    rentalRequest?: RentalRequest;
    openedBy?: Pick<User, "id" | "name" | "avatar_url">;
}

export interface BlockedUser {
    id: string;
    blocker_id: string;
    blocked_id: string;
    created_at: string;
    blocked: Pick<User, "id" | "name" | "avatar_url">;
}
