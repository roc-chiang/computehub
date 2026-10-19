"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getAllSettings, SettingItem } from "@/lib/admin-settings-api";
import { useRole } from "@/hooks/useRole";

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

const defaultSettings = {
    platform_name: "ComputeHub",
    support_email: "support@computehub.com",
    platform_url: "https://computehub.pardpro.ca",
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const { isAdmin, isLoaded } = useRole();
    const [settings, setSettings] = useState<Record<string, string>>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        let active = true;
        const fetchSettings = async () => {
            try {
                const data = await getAllSettings(false);
                if (!active) return;
                const settingsMap: Record<string, string> = { ...defaultSettings };
                data.forEach((setting) => {
                    settingsMap[setting.key] = setting.value;
                });
                setSettings(settingsMap);
            } catch (error) {
                console.warn("Unable to load administrator settings; using defaults.", error);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchSettings();
        return () => {
            active = false;
        };
    }, [isAdmin, isLoaded]);

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
