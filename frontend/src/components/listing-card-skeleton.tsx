import { Card, CardContent } from "@/components/ui/card";

export function ListingCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse" />
            <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
            </CardContent>
        </Card>
    );
}

export function ListingsGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
            ))}
        </div>
    );
}
