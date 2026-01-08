"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, CreditCard, Key, Webhook } from "lucide-react";

interface StripeSetting {
    key: string;
    value: string;
    description: string;
    is_secret: boolean;
}

export default function StripeSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Form state
    const [secretKey, setSecretKey] = useState("");
    const [publishableKey, setPublishableKey] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");
    const [priceProMonthly, setPriceProMonthly] = useState("");
    const [priceEnterpriseMonthly, setPriceEnterpriseMonthly] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const keys = [
                'stripe_secret_key',
                'stripe_publishable_key',
                'stripe_webhook_secret',
                'stripe_price_pro_monthly',
                'stripe_price_enterprise_monthly'
            ];

            const settingsMap: Record<string, string> = {};

            for (const key of keys) {
                const response = await fetch(`/api/v1/admin/settings/${key}`, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    settingsMap[key] = data.value || "";
                }
            }

            setSettings(settingsMap);
            setSecretKey(settingsMap['stripe_secret_key'] || "");
            setPublishableKey(settingsMap['stripe_publishable_key'] || "");
            setWebhookSecret(settingsMap['stripe_webhook_secret'] || "");
            setPriceProMonthly(settingsMap['stripe_price_pro_monthly'] || "");
            setPriceEnterpriseMonthly(settingsMap['stripe_price_enterprise_monthly'] || "");
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveSetting = async (key: string, value: string, isSecret: boolean = false) => {
        try {
            const response = await fetch(`/api/v1/admin/settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    key,
                    value,
                    is_secret: isSecret
                })
            });
            return response.ok;
        } catch (error) {
            console.error(`Failed to save ${key}:`, error);
            return false;
        }
    };

    const saveAllSettings = async () => {
        setSaving(true);
        setTestResult(null);

        try {
            const results = await Promise.all([
                saveSetting('stripe_secret_key', secretKey, true),
                saveSetting('stripe_publishable_key', publishableKey, false),
                saveSetting('stripe_webhook_secret', webhookSecret, true),
                saveSetting('stripe_price_pro_monthly', priceProMonthly, false),
                saveSetting('stripe_price_enterprise_monthly', priceEnterpriseMonthly, false)
            ]);

            if (results.every(r => r)) {
                setTestResult({
                    success: true,
                    message: "Stripe settings saved successfully!"
                });
                fetchSettings();
            } else {
                setTestResult({
                    success: false,
                    message: "Failed to save some settings"
                });
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: "Failed to save settings"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="container mx-auto py-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Stripe Configuration</h1>
                <p className="text-muted-foreground mt-2">
                    Configure Stripe API keys and subscription pricing
                </p>
            </div>

            <Tabs defaultValue="api-keys" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="webhook">Webhook</TabsTrigger>
                </TabsList>

                <TabsContent value="api-keys" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Key className="h-5 w-5" />
                                <div>
                                    <CardTitle>Stripe API Keys</CardTitle>
                                    <CardDescription>
                                        Get your API keys from <a href="https://dashboard.stripe.com/apikeys" target="_blank" className="text-blue-500 underline">Stripe Dashboard</a>
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Secret Key</Label>
                                <Input
                                    type="password"
                                    value={secretKey}
                                    onChange={(e) => setSecretKey(e.target.value)}
                                    placeholder="sk_test_... or sk_live_..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Used for server-side API calls. Keep this secret!
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Publishable Key</Label>
                                <Input
                                    type="text"
                                    value={publishableKey}
                                    onChange={(e) => setPublishableKey(e.target.value)}
                                    placeholder="pk_test_... or pk_live_..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Used for client-side checkout. Safe to expose.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5" />
                                <div>
                                    <CardTitle>Subscription Pricing</CardTitle>
                                    <CardDescription>
                                        Configure Stripe Price IDs for each plan
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertDescription>
                                    Create products and prices in your <a href="https://dashboard.stripe.com/products" target="_blank" className="text-blue-500 underline">Stripe Dashboard</a>, then paste the Price IDs here.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Label>Pro Plan Price ID ($49/month)</Label>
                                <Input
                                    type="text"
                                    value={priceProMonthly}
                                    onChange={(e) => setPriceProMonthly(e.target.value)}
                                    placeholder="price_..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Enterprise Plan Price ID ($299/month)</Label>
                                <Input
                                    type="text"
                                    value={priceEnterpriseMonthly}
                                    onChange={(e) => setPriceEnterpriseMonthly(e.target.value)}
                                    placeholder="price_..."
                                />
                            </div>

                            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                                <div className="font-semibold">Plan Configuration:</div>
                                <div>• <strong>Basic</strong>: $0/month (Free, no Price ID needed)</div>
                                <div>• <strong>Pro</strong>: $49/month</div>
                                <div>• <strong>Enterprise</strong>: $299/month</div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="webhook" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Webhook className="h-5 w-5" />
                                <div>
                                    <CardTitle>Webhook Configuration</CardTitle>
                                    <CardDescription>
                                        Configure Stripe webhook for subscription events
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <div>1. Go to <a href="https://dashboard.stripe.com/webhooks" target="_blank" className="text-blue-500 underline">Stripe Webhooks</a></div>
                                        <div>2. Add endpoint: <code className="bg-muted px-2 py-1 rounded">https://your-domain.com/api/v1/stripe/webhook</code></div>
                                        <div>3. Select events: checkout.session.completed, customer.subscription.*, invoice.*</div>
                                        <div>4. Copy the signing secret below</div>
                                    </div>
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Label>Webhook Signing Secret</Label>
                                <Input
                                    type="password"
                                    value={webhookSecret}
                                    onChange={(e) => setWebhookSecret(e.target.value)}
                                    placeholder="whsec_..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Used to verify webhook authenticity
                                </p>
                            </div>

                            <div className="bg-muted p-4 rounded-lg text-sm">
                                <div className="font-semibold mb-2">Required Webhook Events:</div>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>checkout.session.completed</li>
                                    <li>customer.subscription.created</li>
                                    <li>customer.subscription.updated</li>
                                    <li>customer.subscription.deleted</li>
                                    <li>invoice.paid</li>
                                    <li>invoice.payment_failed</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="mt-6 space-y-4">
                <Button
                    onClick={saveAllSettings}
                    disabled={saving}
                    className="w-full"
                    size="lg"
                >
                    {saving ? "Saving..." : "Save All Settings"}
                </Button>

                {testResult && (
                    <Alert variant={testResult.success ? "default" : "destructive"}>
                        {testResult.success ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <XCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>{testResult.message}</AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}
