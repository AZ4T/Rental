"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Listing } from "@/types";
import Link from "next/link";

// Fix leaflet default marker icon in webpack/next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CITY_COORDS: Record<string, [number, number]> = {
    "Алматы": [43.238293, 76.945465],
    "Астана": [51.180454, 71.445596],
    "Шымкент": [42.316, 69.596],
    "Актобе": [50.300, 57.154],
    "Тараз": [42.902, 71.368],
    "Павлодар": [52.285, 76.940],
    "Усть-Каменогорск": [49.977, 82.628],
    "Семей": [50.411, 80.225],
    "Атырау": [47.117, 51.921],
    "Костанай": [53.214, 63.632],
    "Кызылорда": [44.853, 65.509],
    "Уральск": [51.233, 51.367],
    "Петропавловск": [54.875, 69.159],
    "Актау": [43.652, 51.159],
    "Темиртау": [50.056, 72.959],
    "Туркестан": [43.300, 68.267],
    "Жезказган": [47.803, 67.714],
    "Балхаш": [46.848, 74.995],
    "Экибастуз": [51.717, 75.333],
    "Рудный": [52.968, 63.128],
};

function idToOffset(id: string, index: number): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash |= 0;
    }
    return ((hash + index * 31337) % 100) / 2500;
}

function getCoords(listing: Listing): [number, number] {
    const base = CITY_COORDS[listing.city] ?? [48.019, 66.924];
    return [
        base[0] + idToOffset(listing.id, 0),
        base[1] + idToOffset(listing.id, 1),
    ];
}

interface MapViewInnerProps {
    listings: Listing[];
}

export default function MapViewInner({ listings }: MapViewInnerProps) {
    useEffect(() => {}, []);

    const center: [number, number] =
        listings.length > 0
            ? getCoords(listings[0])
            : [48.019, 66.924];

    return (
        <MapContainer
            center={center}
            zoom={listings.length === 1 ? 13 : 5}
            style={{ height: "600px", width: "100%", borderRadius: "12px" }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {listings.map((listing) => (
                <Marker key={listing.id} position={getCoords(listing)}>
                    <Popup>
                        <div className="min-w-[160px]">
                            {listing.images[0] && (
                                <img
                                    src={listing.images[0].image_url}
                                    alt={listing.title}
                                    className="w-full h-24 object-cover rounded mb-2"
                                />
                            )}
                            <p className="font-semibold text-sm leading-tight mb-1">
                                {listing.title}
                            </p>
                            <p className="text-xs text-gray-500 mb-2">
                                {listing.city}
                            </p>
                            <p className="text-blue-600 font-bold text-sm mb-2">
                                {Number(listing.price).toLocaleString()} ₸/день
                            </p>
                            <Link
                                href={`/listings/${listing.id}`}
                                className="text-xs text-blue-500 underline"
                            >
                                Подробнее →
                            </Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
