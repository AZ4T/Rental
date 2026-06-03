"use client";

import { useEffect, useRef } from "react";
import { useGoogleSignIn } from "@/hooks/use-auth";

interface Props {
    redirectTo?: string | null;
}

// Google Identity Services types
type CredentialResponse = { credential: string };
type GsiAPI = {
    accounts: {
        id: {
            initialize: (cfg: {
                client_id: string;
                callback: (resp: CredentialResponse) => void;
                ux_mode?: "popup" | "redirect";
                auto_select?: boolean;
            }) => void;
            renderButton: (
                container: HTMLElement,
                options: Record<string, unknown>,
            ) => void;
            prompt: () => void;
            cancel: () => void;
        };
    };
};

declare global {
    interface Window {
        google?: GsiAPI;
    }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/**
 * "Sign in with Google" button rendered by Google Identity Services.
 * On click, opens Google's popup; on success we receive an `id_token`
 * which we POST to `/auth/google`.
 */
export function GoogleSignInButton({ redirectTo }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const { mutate: signIn } = useGoogleSignIn(redirectTo);

    useEffect(() => {
        if (!CLIENT_ID) return; // Not configured — render nothing.

        const ensureScript = () =>
            new Promise<void>((resolve) => {
                if (window.google?.accounts?.id) return resolve();
                const existing = document.querySelector<HTMLScriptElement>(
                    `script[src="${SCRIPT_SRC}"]`,
                );
                if (existing) {
                    existing.addEventListener("load", () => resolve(), { once: true });
                    return;
                }
                const s = document.createElement("script");
                s.src = SCRIPT_SRC;
                s.async = true;
                s.defer = true;
                s.onload = () => resolve();
                document.head.appendChild(s);
            });

        let cancelled = false;
        void ensureScript().then(() => {
            if (cancelled || !ref.current || !window.google) return;
            window.google.accounts.id.initialize({
                client_id: CLIENT_ID,
                callback: (resp) => signIn(resp.credential),
                ux_mode: "popup",
            });
            window.google.accounts.id.renderButton(ref.current, {
                type: "standard",
                theme: "outline",
                size: "large",
                text: "signin_with",
                shape: "rectangular",
                width: ref.current.clientWidth || 320,
            });
        });

        return () => {
            cancelled = true;
        };
    }, [signIn]);

    if (!CLIENT_ID) return null;
    return <div ref={ref} className="flex justify-center" />;
}
