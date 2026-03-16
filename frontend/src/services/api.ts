const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set. Check .env.local");
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
        // попробуем прочитать json ошибку, если она есть
        let message = `Request failed: ${res.status} ${res.statusText}`;
        try {
            const data = await res.json();
            message = data?.message ? String(data.message) : message;
        } catch {}
        throw new Error(message);
    }

    return res.json() as Promise<T>;
}
