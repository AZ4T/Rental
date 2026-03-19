import Link from "next/link";
import Image from "next/image";
import { Listing } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";

interface ListingCardProps {
    listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
    const image = listing.images[0]?.image_url;

    return (
        <Link href={`/listings/${listing.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                {/* Фото */}
                <div className="relative h-48 bg-gray-100">
                    {image ? (
                        <Image
                            src={image}
                            alt={listing.title}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Нет фото
                        </div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-white text-gray-700">
                        {listing.category.name}
                    </Badge>
                </div>

                <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">
                        {listing.title}
                    </h3>

                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{listing.city}</span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div>
                            <span className="text-lg font-bold text-blue-600">
                                {Number(listing.price).toLocaleString()} ₸
                            </span>
                            <span className="text-sm text-gray-500">
                                {" "}
                                / день
                            </span>
                        </div>

                        {listing.owner.rating_avg && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>
                                    {Number(listing.owner.rating_avg).toFixed(
                                        1,
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
