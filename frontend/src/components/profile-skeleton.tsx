import { Card, CardContent } from "@/components/ui/card";

export function ProfileSkeleton() {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center gap-6 mb-6">
                    <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse" />
                    <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
