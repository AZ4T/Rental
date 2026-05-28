import dynamic from "next/dynamic";
import { Listing } from "@/types";
import { Loader2 } from "lucide-react";

const MapViewInner = dynamic(() => import("./map-view-inner"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-[600px] rounded-xl bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    ),
});

export function MapView({ listings }: { listings: Listing[] }) {
    return <MapViewInner listings={listings} />;
}
