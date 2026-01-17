"use client";

import { SettingsProvider } from "@/contexts/settings-context";
import { LicenseProvider } from "@/contexts/license-context";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <SettingsProvider>
            <LicenseProvider>
                {children}
            </LicenseProvider>
        </SettingsProvider>
    );
}
