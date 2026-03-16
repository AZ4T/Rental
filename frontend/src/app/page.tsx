"use client";

import { api } from "@/services/api";
import { useEffect, useState } from "react";

export default function HomePage() {
    const [health, setHealth] = useState<string>("loading...");

    useEffect(() => {
        api<{ ok: boolean }>("/health")
            .then((d) => setHealth(String(d.ok)))
            .catch((e) => setHealth(e.message));
    }, []);

    return (
        <main style={{ padding: 24 }}>
            <h1>Frontend ↔ Backend check</h1>
            <p>/health: {health}</p>
        </main>
    );
}
