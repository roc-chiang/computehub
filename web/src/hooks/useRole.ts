// Custom hook to check user role
"use client";

import { useUser } from "@clerk/nextjs";

export function useRole() {
    const { user, isLoaded } = useUser();

    if (!isLoaded) {
        return { role: null, isAdmin: false, isLoaded: false };
    }

    const role = user?.publicMetadata?.role as string | undefined;
    const isAdmin = role === "admin";

    return { role, isAdmin, isLoaded: true };
}
