"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Sidebar } from "@/components/layout/sidebar";
import { useRole } from "@/hooks/useRole";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isLoaded: authLoaded, isSignedIn } = useAuth();
    const { isAdmin, isLoaded: roleLoaded } = useRole();

    useEffect(() => {
        // Wait for both auth and role to load
        if (!authLoaded || !roleLoaded) return;

        // Redirect if not signed in
        if (!isSignedIn) {
            router.push("/login?redirect_url=/admin");
            return;
        }

        // Redirect if not admin
        if (!isAdmin) {
            console.log("🚫 Access denied: User is not admin, redirecting to /deploy");
            router.push("/deploy");
            return;
        }
    }, [authLoaded, roleLoaded, isSignedIn, isAdmin, router]);

    // Show loading state while checking
    if (!authLoaded || !roleLoaded) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Verifying permissions...</p>
                </div>
            </div>
        );
    }

    // Don't render admin content if not authorized
    if (!isSignedIn || !isAdmin) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto lg:ml-64 pt-16 lg:pt-0 bg-cream-50">
                <div className="container mx-auto p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

