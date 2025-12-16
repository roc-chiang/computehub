"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setAuthToken } from "@/lib/api";

export function AuthSync() {
    const { getToken, isSignedIn } = useAuth();

    useEffect(() => {
        const syncToken = async () => {
            if (isSignedIn) {
                const token = await getToken();
                setAuthToken(token);
                console.log("[AuthSync] Token synced");
            } else {
                setAuthToken(null);
            }
        };

        // Initial sync
        syncToken();

        // Periodic sync to refresh token
        const interval = setInterval(syncToken, 55000); // 55s (Clerk tokens last 60s usually)

        return () => clearInterval(interval);
    }, [getToken, isSignedIn]);

    return null;
}
