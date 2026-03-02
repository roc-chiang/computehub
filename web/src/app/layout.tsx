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
    // Attempt to fetch from backend configuration, useful for self-hosted instances
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${backendUrl}/api/v1/admin/config/public`, { cache: "no-store", next: { revalidate: 0 } });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data.clerkPublishableKey;
  } catch (e) {
    // This is expected if backend is offline or unreachable during SSR
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use backend configuration first, fallback to the environment variable
  const clerkKey = (await getClerkKey()) || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider publishableKey={clerkKey || ""} signInUrl="/login">
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

