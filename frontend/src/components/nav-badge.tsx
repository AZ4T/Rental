"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
    count: number;
    color?: "blue" | "red";
    className?: string;
}

/**
 * Round count pill used on nav items. Briefly pulses when the number
 * grows so the user notices the new activity even out of the corner of
 * their eye.
 */
export function NavBadge({ count, color = "blue", className = "" }: Props) {
    const [pulse, setPulse] = useState(false);
    const prev = useRef(count);

    useEffect(() => {
        if (count > prev.current) {
            setPulse(true);
            const id = setTimeout(() => setPulse(false), 1500);
            return () => clearTimeout(id);
        }
        prev.current = count;
    }, [count]);

    if (!count) return null;

    const bg = color === "red" ? "bg-red-500" : "bg-blue-500";
    const ring = color === "red" ? "ring-red-400/60" : "ring-blue-400/60";

    return (
        <span
            className={`${bg} text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center transition-all ${
                pulse ? `animate-pulse-badge ring-2 ${ring}` : ""
            } ${className}`}
        >
            {count > 99 ? "99+" : count}
        </span>
    );
}
