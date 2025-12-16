"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Bell, Send, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getNotificationSettings,
    updateNotificationSettings,
    getTelegramStatus,
    createTelegramBindToken,
    unbindTelegram,
    sendTestNotification,
    type NotificationSettings,
    type TelegramStatus,
} from "@/lib/notification-api";

export default function NotificationsPage() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
    const [bindUrl, setBindUrl] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchData();
        }
    }, [isLoaded, isSignedIn]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                throw new Error("No authentication token");
            }
            const [settingsData, statusData] = await Promise.all([
                getNotificationSettings(token),
                getTelegramStatus(token),
            ]);
            setSettings(settingsData);
            setTelegramStatus(statusData);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load notification settings",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        try {
            const token = await getToken();
            if (!token) throw new Error("No token");
            const updated = await updateNotificationSettings(token, {
                email: settings.email,
                enable_telegram: settings.enable_telegram,
                enable_email: settings.enable_email,
                enable_deployment_success: settings.enable_deployment_success,
                enable_deployment_failure: settings.enable_deployment_failure,
                enable_instance_down: settings.enable_instance_down,
                enable_cost_alert: settings.enable_cost_alert,
                enable_price_change: settings.enable_price_change,
                cost_alert_threshold: settings.cost_alert_threshold,
            });
            setSettings(updated);
            toast({
                title: "Success",
                description: "Notification settings updated",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update settings",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleBindTelegram = async () => {
        try {
            const token = await getToken();
            if (!token) throw new Error("No token");
            const response = await createTelegramBindToken(token);
            setBindUrl(response.bind_url);
            toast({
                title: "Bind URL Generated",
                description: "Click the link below to bind your Telegram account",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to generate bind URL",
                variant: "destructive",
            });
        }
    };

    const handleUnbindTelegram = async () => {
        try {
            const token = await getToken();
            if (!token) throw new Error("No token");
            await unbindTelegram(token);
            setTelegramStatus({ is_bound: false });
            toast({
                title: "Success",
                description: "Telegram unbound successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to unbind Telegram",
                variant: "destructive",
            });
        }
    };

    const handleTestNotification = async (channel: string) => {
        try {
            const token = await getToken();
            if (!token) throw new Error("No token");
            await sendTestNotification(token, channel);
            toast({
                title: "Test Sent",
                description: `Test notification sent via ${channel}`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to send test notification",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="text-center text-zinc-400 py-12">
                Failed to load notification settings
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
                        Notification Settings
                    </h2>
                    <p className="text-zinc-400">
                        Configure how you receive notifications
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/settings/notifications/history'}
                    >
                        View History
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Bell className="mr-2 h-4 w-4" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Telegram Configuration */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle>Telegram Notifications</CardTitle>
                    <CardDescription>
                        Receive instant notifications via Telegram
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {telegramStatus?.is_bound ? (
                        <div className="space-y-4">
                            <Alert className="bg-green-500/10 border-green-500/50">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-500">
                                    Telegram is connected
                                    {telegramStatus.username && ` (@${telegramStatus.username})`}
                                </AlertDescription>
                            </Alert>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Enable Telegram Notifications</Label>
                                    <p className="text-sm text-zinc-500">
                                        Receive notifications via Telegram
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.enable_telegram}
                                    onCheckedChange={(checked) =>
                                        setSettings({ ...settings, enable_telegram: checked })
                                    }
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleTestNotification("telegram")}
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Test
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleUnbindTelegram}
                                >
                                    Unbind Telegram
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Alert className="bg-yellow-500/10 border-yellow-500/50">
                                <XCircle className="h-4 w-4 text-yellow-500" />
                                <AlertDescription className="text-yellow-500">
                                    Telegram is not connected
                                </AlertDescription>
                            </Alert>
                            <Button onClick={handleBindTelegram}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Bind Telegram Account
                            </Button>
                            {bindUrl && (
                                <Alert>
                                    <AlertDescription>
                                        <p className="mb-2">Click the link below to bind your Telegram:</p>
                                        <a
                                            href={bindUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:underline"
                                        >
                                            {bindUrl}
                                        </a>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Email Configuration */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>
                        Receive notifications via email
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={settings.email || ""}
                            onChange={(e) =>
                                setSettings({ ...settings, email: e.target.value })
                            }
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable Email Notifications</Label>
                            <p className="text-sm text-zinc-500">
                                Receive notifications via email
                            </p>
                        </div>
                        <Switch
                            checked={settings.enable_email}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, enable_email: checked })
                            }
                        />
                    </div>
                    {settings.email && (
                        <Button
                            variant="outline"
                            onClick={() => handleTestNotification("email")}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Send Test Email
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Event Preferences */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle>Event Preferences</CardTitle>
                    <CardDescription>
                        Choose which events trigger notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Deployment Success</Label>
                            <p className="text-sm text-zinc-500">
                                Notify when deployments succeed
                            </p>
                        </div>
                        <Switch
                            checked={settings.enable_deployment_success}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, enable_deployment_success: checked })
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Deployment Failure</Label>
                            <p className="text-sm text-zinc-500">
                                Notify when deployments fail
                            </p>
                        </div>
                        <Switch
                            checked={settings.enable_deployment_failure}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, enable_deployment_failure: checked })
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Instance Down</Label>
                            <p className="text-sm text-zinc-500">
                                Notify when instances go down
                            </p>
                        </div>
                        <Switch
                            checked={settings.enable_instance_down}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, enable_instance_down: checked })
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Cost Alerts</Label>
                            <p className="text-sm text-zinc-500">
                                Notify when costs exceed threshold
                            </p>
                        </div>
                        <Switch
                            checked={settings.enable_cost_alert}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, enable_cost_alert: checked })
                            }
                        />
                    </div>
                    {settings.enable_cost_alert && (
                        <div className="space-y-2 pl-6">
                            <Label htmlFor="threshold">Cost Alert Threshold ($)</Label>
                            <Input
                                id="threshold"
                                type="number"
                                step="0.01"
                                value={settings.cost_alert_threshold}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        cost_alert_threshold: parseFloat(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Price Changes</Label>
                            <p className="text-sm text-zinc-500">
                                Notify when GPU prices change significantly
                            </p>
                        </div>
                        <Switch
                            checked={settings.enable_price_change}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, enable_price_change: checked })
                            }
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
