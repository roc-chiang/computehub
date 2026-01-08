"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Mail, Send, Webhook, CheckCircle2, XCircle } from "lucide-react";

interface NotificationSettings {
    telegram_chat_id: string | null;
    telegram_username: string | null;
    email: string | null;
    webhook_url: string | null;
    webhook_secret: string | null;
    enable_telegram: boolean;
    enable_email: boolean;
    enable_webhook: boolean;
    enable_deployment_success: boolean;
    enable_deployment_failure: boolean;
    enable_instance_down: boolean;
    enable_cost_alert: boolean;
    enable_price_change: boolean;
    cost_alert_threshold: number;
}

export default function NotificationsPage() {
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingWebhook, setTestingWebhook] = useState(false);
    const [webhookTestResult, setWebhookTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Form state
    const [email, setEmail] = useState("");
    const [webhookUrl, setWebhookUrl] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch("/api/v1/notifications/settings", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
                setEmail(data.email || "");
                setWebhookUrl(data.webhook_url || "");
                setWebhookSecret(data.webhook_secret || "");
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (updates: Partial<NotificationSettings>) => {
        setSaving(true);
        try {
            const response = await fetch("/api/v1/notifications/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(updates)
            });
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (error) {
            console.error("Failed to update settings:", error);
        } finally {
            setSaving(false);
        }
    };

    const testWebhook = async () => {
        setTestingWebhook(true);
        setWebhookTestResult(null);
        try {
            const response = await fetch("/api/v1/notifications/webhook/test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    url: webhookUrl,
                    secret: webhookSecret || null
                })
            });
            if (response.ok) {
                const data = await response.json();
                setWebhookTestResult(data);
            }
        } catch (error) {
            console.error("Failed to test webhook:", error);
            setWebhookTestResult({
                success: false,
                message: "Failed to test webhook"
            });
        } finally {
            setTestingWebhook(false);
        }
    };

    if (loading || !settings) {
        return <div className="container mx-auto py-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Notification Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Configure how you want to receive notifications
                </p>
            </div>

            <Tabs defaultValue="channels" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="channels">Channels</TabsTrigger>
                    <TabsTrigger value="events">Event Types</TabsTrigger>
                </TabsList>

                <TabsContent value="channels" className="space-y-4">
                    {/* Email */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5" />
                                    <div>
                                        <CardTitle>Email Notifications</CardTitle>
                                        <CardDescription>Receive notifications via email</CardDescription>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.enable_email}
                                    onCheckedChange={(checked) => updateSettings({ enable_email: checked })}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                    />
                                    <Button
                                        onClick={() => updateSettings({ email })}
                                        disabled={saving}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Telegram */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Send className="h-5 w-5" />
                                    <div>
                                        <CardTitle>Telegram Notifications</CardTitle>
                                        <CardDescription>Receive notifications via Telegram</CardDescription>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.enable_telegram}
                                    onCheckedChange={(checked) => updateSettings({ enable_telegram: checked })}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {settings.telegram_chat_id ? (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Connected as @{settings.telegram_username}</span>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    Not connected. Use /start command in Telegram bot to connect.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Webhook */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Webhook className="h-5 w-5" />
                                    <div>
                                        <CardTitle>Webhook Notifications</CardTitle>
                                        <CardDescription>Send notifications to a custom webhook URL</CardDescription>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.enable_webhook}
                                    onCheckedChange={(checked) => updateSettings({ enable_webhook: checked })}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Webhook URL</Label>
                                <Input
                                    type="url"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    placeholder="https://your-server.com/webhook"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Webhook Secret (Optional)</Label>
                                <Input
                                    type="password"
                                    value={webhookSecret}
                                    onChange={(e) => setWebhookSecret(e.target.value)}
                                    placeholder="Secret for HMAC signature"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => updateSettings({ webhook_url: webhookUrl, webhook_secret: webhookSecret })}
                                    disabled={saving}
                                >
                                    Save Webhook
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={testWebhook}
                                    disabled={testingWebhook || !webhookUrl}
                                >
                                    Test Webhook
                                </Button>
                            </div>
                            {webhookTestResult && (
                                <Alert variant={webhookTestResult.success ? "default" : "destructive"}>
                                    {webhookTestResult.success ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    <AlertDescription>{webhookTestResult.message}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="events" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Notifications</CardTitle>
                            <CardDescription>Choose which events trigger notifications</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Deployment Success</div>
                                    <div className="text-sm text-muted-foreground">When a deployment starts successfully</div>
                                </div>
                                <Switch
                                    checked={settings.enable_deployment_success}
                                    onCheckedChange={(checked) => updateSettings({ enable_deployment_success: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Deployment Failure</div>
                                    <div className="text-sm text-muted-foreground">When a deployment fails to start</div>
                                </div>
                                <Switch
                                    checked={settings.enable_deployment_failure}
                                    onCheckedChange={(checked) => updateSettings({ enable_deployment_failure: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Instance Down</div>
                                    <div className="text-sm text-muted-foreground">When an instance becomes unhealthy</div>
                                </div>
                                <Switch
                                    checked={settings.enable_instance_down}
                                    onCheckedChange={(checked) => updateSettings({ enable_instance_down: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Cost Alerts</div>
                                    <div className="text-sm text-muted-foreground">When costs exceed thresholds</div>
                                </div>
                                <Switch
                                    checked={settings.enable_cost_alert}
                                    onCheckedChange={(checked) => updateSettings({ enable_cost_alert: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Price Changes</div>
                                    <div className="text-sm text-muted-foreground">When GPU prices change significantly</div>
                                </div>
                                <Switch
                                    checked={settings.enable_price_change}
                                    onCheckedChange={(checked) => updateSettings({ enable_price_change: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
