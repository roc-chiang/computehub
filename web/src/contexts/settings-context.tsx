"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getAllSettings, SettingItem } from "@/lib/admin-settings-api";

interface SettingsContextType {
    settings: Record<string, string>;
    loading: boolean;
    getSetting: (key: string, defaultValue?: string) => string;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: {},
    loading: true,
    getSetting: () => "",
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await getAllSettings(false);
            const settingsMap: Record<string, string> = {};
            data.forEach((setting) => {
                settingsMap[setting.key] = setting.value;
            });
            setSettings(settingsMap);
        } catch (error) {
            console.error("Failed to fetch settings:", error);
            // Use default values if fetch fails
            setSettings({
                platform_name: "ComputeHub",
                support_email: "support@computehub.com",
                platform_url: "https://computehub.com",
            });
        } finally {
            setLoading(false);
        }
    };

    const getSetting = (key: string, defaultValue: string = "") => {
        return settings[key] || defaultValue;
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, getSetting }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
