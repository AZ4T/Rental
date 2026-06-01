// Single source of truth for the platform's commission rate so we can keep
// the user-visible warnings, breakdowns and tooltips in sync if we ever
// change PLATFORM_FEE_RATE on the backend. Premium owners pay 0%.
export const PLATFORM_FEE_RATE = 0.05;

export function platformFee(amount: number, ownerIsPremium = false): number {
    if (ownerIsPremium) return 0;
    return Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
}

export function ownerEarnings(amount: number, ownerIsPremium = false): number {
    return amount - platformFee(amount, ownerIsPremium);
}
