'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';

interface LicenseStatus {
    isProEnabled: boolean;
    licenseKey?: string;
    activatedAt?: string;
    message?: string;
}

interface LicenseContextType {
    license: LicenseStatus;
    loading: boolean;
    refreshLicense: () => Promise<void>;
    activateLicense: (licenseKey: string) => Promise<{ success: boolean; message: string }>;
    deactivateLicense: () => Promise<{ success: boolean; message: string }>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: ReactNode }) {
    const { getToken, isLoaded } = useAuth();
    const [license, setLicense] = useState<LicenseStatus>({ isProEnabled: false });
    const [loading, setLoading] = useState(true);

    const refreshLicense = async () => {
        try {
            if (!isLoaded) {
                setLoading(true);
                return;
            }

            const token = await getToken();
            if (!token) {
                setLicense({ isProEnabled: false, message: 'Not authenticated' });
                setLoading(false);
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/license/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setLicense(data);
            } else {
                setLicense({ isProEnabled: false, message: 'Failed to fetch license status' });
            }
        } catch (error) {
            console.error('Failed to fetch license status:', error);
            setLicense({ isProEnabled: false, message: 'Error fetching license status' });
        } finally {
            setLoading(false);
        }
    };

    const activateLicense = async (licenseKey: string): Promise<{ success: boolean; message: string }> => {
        try {
            const token = await getToken();
            if (!token) {
                return { success: false, message: 'Not authenticated' };
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/license/activate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ license_key: licenseKey }),
            });

            const data = await response.json();

            if (response.ok) {
                await refreshLicense();
                return { success: true, message: data.message || 'License activated successfully' };
            } else {
                return { success: false, message: data.detail || 'Failed to activate license' };
            }
        } catch (error) {
            console.error('Failed to activate license:', error);
            return { success: false, message: 'Error activating license' };
        }
    };

    const deactivateLicense = async (): Promise<{ success: boolean; message: string }> => {
        try {
            const token = await getToken();
            if (!token) {
                return { success: false, message: 'Not authenticated' };
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/license/deactivate`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                await refreshLicense();
                return { success: true, message: data.message || 'License deactivated successfully' };
            } else {
                return { success: false, message: data.detail || 'Failed to deactivate license' };
            }
        } catch (error) {
            console.error('Failed to deactivate license:', error);
            return { success: false, message: 'Error deactivating license' };
        }
    };

    useEffect(() => {
        if (isLoaded) {
            refreshLicense();
        }
    }, [isLoaded]);

    return (
        <LicenseContext.Provider value={{ license, loading, refreshLicense, activateLicense, deactivateLicense }}>
            {children}
        </LicenseContext.Provider>
    );
}

export function useLicense() {
    const context = useContext(LicenseContext);
    if (context === undefined) {
        throw new Error('useLicense must be used within a LicenseProvider');
    }
    return context;
}
