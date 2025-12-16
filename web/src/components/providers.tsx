"use client";

import { SettingsProvider } from "@/contexts/settings-context";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return <SettingsProvider>{children}</SettingsProvider>;
}
