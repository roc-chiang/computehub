import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ComputeHub",
  description: "GPU Aggregation Platform",
};

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import { AuthSync } from "@/components/auth-sync";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ClientProviders } from "@/components/providers";
import { DevQuickLogin } from "@/components/dev-quick-login";

async function getClerkKey() {
  try {
    console.log("Fetching Clerk Key from backend...");
    // Use internal backend service name for server-side rendering in Docker
    // Client-side will use NEXT_PUBLIC_API_URL from environment
    const backendUrl = typeof window === 'undefined'
      ? (process.env.INTERNAL_API_URL || "http://backend:8000")
      : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
    const res = await fetch(`${backendUrl}/api/v1/admin/config/public`, { cache: "no-store" });
    if (!res.ok) {
      console.error("Failed to fetch Clerk key: Status", res.status);
      return null;
    }
    const data = await res.json();
    console.log("Fetched Clerk Key:", data.clerkPublishableKey ? "FOUND" : "MISSING");
    return data.clerkPublishableKey;
  } catch (e) {
    console.error("Failed to fetch Clerk key (Network Error)", e);
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkKey = await getClerkKey();

  return (
    <ClerkProvider publishableKey={clerkKey} signInUrl="/login">
      <html lang="en" suppressHydrationWarning>
        <body className={cn(inter.className, "min-h-screen bg-background font-sans antialiased")}>
          <ErrorBoundary>
            <ClientProviders>
              <AuthSync />
              {children}
              <Toaster />
              <OfflineIndicator />
              <DevQuickLogin />
            </ClientProviders>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}

