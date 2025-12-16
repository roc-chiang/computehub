"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getAllSettings,
    bulkUpdateSettings,
    SettingItem,
} from "@/lib/admin-settings-api";

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const { toast } = useToast();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await getAllSettings(false);
            setSettings(data);

            // Initialize form data
            const initialData: Record<string, string> = {};
            data.forEach((setting) => {
                initialData[setting.key] = setting.value;
            });
            setFormData(initialData);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load settings",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSwitchChange = (key: string, checked: boolean) => {
        setFormData((prev) => ({ ...prev, [key]: checked.toString() }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Only send changed values
            const changes: Record<string, string> = {};
            settings.forEach((setting) => {
                if (formData[setting.key] !== setting.value) {
                    changes[setting.key] = formData[setting.key];
                }
            });

            if (Object.keys(changes).length === 0) {
                toast({
                    title: "No changes",
                    description: "No settings were modified",
                });
                return;
            }

            await bulkUpdateSettings(changes);

            toast({
                title: "Success",
                description: `Updated ${Object.keys(changes).length} setting(s)`,
            });

            // Refresh settings
            await fetchSettings();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save settings",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const renderSettingInput = (setting: SettingItem) => {
        const key = setting.key;
        const value = formData[key] || "";

        // Boolean settings (switches)
        if (key.startsWith("enable_")) {
            return (
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor={key}>{formatLabel(key)}</Label>
                        {setting.description && (
                            <p className="text-sm text-text-secondary">{setting.description}</p>
                        )}
                    </div>
                    <Switch
                        id={key}
                        checked={value === "true"}
                        onCheckedChange={(checked) => handleSwitchChange(key, checked)}
                    />
                </div>
            );
        }

        // Numeric settings
        if (key.includes("price") || key.includes("percentage") || key.includes("hours") || key.includes("max_")) {
            return (
                <div className="space-y-2">
                    <Label htmlFor={key}>{formatLabel(key)}</Label>
                    {setting.description && (
                        <p className="text-sm text-text-secondary">{setting.description}</p>
                    )}
                    <Input
                        id={key}
                        type="number"
                        step={key.includes("price") ? "0.01" : "1"}
                        value={value}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                    />
                </div>
            );
        }

        // Text settings
        return (
            <div className="space-y-2">
                <Label htmlFor={key}>{formatLabel(key)}</Label>
                {setting.description && (
                    <p className="text-sm text-text-secondary">{setting.description}</p>
                )}
                <Input
                    id={key}
                    type="text"
                    value={value}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                />
            </div>
        );
    };

    const formatLabel = (key: string) => {
        return key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const getPlatformSettings = () => settings.filter((s) =>
        s.key.startsWith("platform_") || s.key.startsWith("support_")
    );

    const getPricingSettings = () => settings.filter((s) =>
        s.key.includes("price") || s.key.includes("fee") || s.key.includes("tier")
    );

    const getFeatureSettings = () => settings.filter((s) =>
        s.key.startsWith("enable_")
    );

    const getLimitSettings = () => settings.filter((s) =>
        s.key.startsWith("max_")
    );

    const getStripeSettings = () => settings.filter((s) =>
        s.key.startsWith("stripe_")
    );

    const getNotificationSettings = () => settings.filter((s) =>
        s.key.startsWith("telegram_") || s.key.startsWith("smtp_")
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                        System Settings
                    </h2>
                    <p className="text-text-secondary">Configure platform parameters and features.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <Tabs defaultValue="platform" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="platform">Platform</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="limits">Limits</TabsTrigger>
                </TabsList>

                <TabsContent value="platform" className="space-y-4">
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader>
                            <CardTitle>Platform Information</CardTitle>
                            <CardDescription>
                                Basic platform configuration and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getPlatformSettings().map((setting) => (
                                <div key={setting.key}>
                                    {renderSettingInput(setting)}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader>
                            <CardTitle>Pricing Configuration</CardTitle>
                            <CardDescription>
                                Subscription plans and service fee settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getPricingSettings().map((setting) => (
                                <div key={setting.key}>
                                    {renderSettingInput(setting)}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payment" className="space-y-4">
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader>
                            <CardTitle>Stripe Payment Configuration</CardTitle>
                            <CardDescription>
                                Configure Stripe API keys and product IDs for subscription payments
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getStripeSettings().map((setting) => {
                                const key = setting.key;
                                const value = formData[key] || "";
                                const isSecret = setting.is_secret;

                                return (
                                    <div key={setting.key} className="space-y-2">
                                        <Label htmlFor={key}>{formatLabel(key)}</Label>
                                        {setting.description && (
                                            <p className="text-sm text-text-secondary">{setting.description}</p>
                                        )}
                                        <Input
                                            id={key}
                                            type={isSecret ? "password" : "text"}
                                            value={value}
                                            onChange={(e) => handleInputChange(key, e.target.value)}
                                            placeholder={isSecret ? "••••••••" : ""}
                                        />
                                    </div>
                                );
                            })}
                            <div className="pt-4 border-t border-cream-200">
                                <p className="text-sm text-text-secondary mb-2">
                                    馃挕 <strong>Tip:</strong> Get your Stripe keys from{" "}
                                    <a
                                        href="https://dashboard.stripe.com/apikeys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand hover:underline"
                                    >
                                        Stripe Dashboard
                                    </a>
                                </p>
                                <p className="text-sm text-text-secondary">
                                    馃敀 Secret keys are encrypted before storage
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    {/* Telegram Configuration */}
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader>
                            <CardTitle>Telegram Bot Configuration</CardTitle>
                            <CardDescription>
                                Configure Telegram Bot for real-time notifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getNotificationSettings()
                                .filter((s) => s.key.startsWith("telegram_"))
                                .map((setting) => {
                                    const key = setting.key;
                                    const value = formData[key] || "";
                                    const isSecret = setting.is_secret;

                                    return (
                                        <div key={setting.key} className="space-y-2">
                                            <Label htmlFor={key}>{formatLabel(key)}</Label>
                                            {setting.description && (
                                                <p className="text-sm text-text-secondary">{setting.description}</p>
                                            )}
                                            <Input
                                                id={key}
                                                type={isSecret ? "password" : "text"}
                                                value={value}
                                                onChange={(e) => handleInputChange(key, e.target.value)}
                                                placeholder={isSecret ? "••••••••" : ""}
                                            />
                                        </div>
                                    );
                                })}
                            <div className="pt-4 border-t border-cream-200">
                                <p className="text-sm text-text-secondary mb-2">
                                    馃挕 <strong>Tip:</strong> Create a Telegram Bot via{" "}
                                    <a
                                        href="https://t.me/BotFather"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline"
                                    >
                                        @BotFather
                                    </a>
                                </p>
                                <p className="text-sm text-text-secondary">
                                    馃敀 Bot token is encrypted before storage
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SMTP/Email Configuration */}
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader>
                            <CardTitle>Email (SMTP) Configuration</CardTitle>
                            <CardDescription>
                                Configure SMTP server for email notifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getNotificationSettings()
                                .filter((s) => s.key.startsWith("smtp_"))
                                .map((setting) => {
                                    const key = setting.key;
                                    const value = formData[key] || "";
                                    const isSecret = setting.is_secret;

                                    return (
                                        <div key={setting.key} className="space-y-2">
                                            <Label htmlFor={key}>{formatLabel(key)}</Label>
                                            {setting.description && (
                                                <p className="text-sm text-text-secondary">{setting.description}</p>
                                            )}
                                            <Input
                                                id={key}
                                                type={isSecret ? "password" : "text"}
                                                value={value}
                                                onChange={(e) => handleInputChange(key, e.target.value)}
                                                placeholder={isSecret ? "••••••••" : ""}
                                            />
                                        </div>
                                    );
                                })}
                            <div className="pt-4 border-t border-cream-200">
                                <p className="text-sm text-text-secondary mb-2">
                                    馃挕 <strong>Gmail Users:</strong> Use an{" "}
                                    <a
                                        href="https://support.google.com/accounts/answer/185833"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand hover:underline"
                                    >
                                        App Password
                                    </a>
                                    {" "}instead of your regular password
                                </p>
                                <p className="text-sm text-text-secondary">
                                    馃敀 SMTP password is encrypted before storage
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader>
                            <CardTitle>Feature Toggles</CardTitle>
                            <CardDescription>
                                Enable or disable platform features
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {getFeatureSettings().map((setting) => (
                                <div key={setting.key}>
                                    {renderSettingInput(setting)}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="limits" className="space-y-4">
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader>
                            <CardTitle>Usage Limits</CardTitle>
                            <CardDescription>
                                Configure resource limits for different tiers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getLimitSettings().map((setting) => (
                                <div key={setting.key}>
                                    {renderSettingInput(setting)}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

