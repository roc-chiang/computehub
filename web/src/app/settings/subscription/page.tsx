"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Crown, Zap, Rocket, Check } from "lucide-react";

interface Subscription {
    user_id: string;
    tier: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    features: Record<string, any>;
}

const PLANS = [
    {
        tier: "basic",
        name: "Basic",
        price: "$0",
        period: "forever",
        icon: Check,
        features: [
            "3 Deployments",
            "1 Provider",
            "Basic Support",
            "Community Access"
        ],
        limits: {
            max_deployments: 3,
            max_providers: 1
        }
    },
    {
        tier: "pro",
        name: "Pro",
        price: "$49",
        period: "per month",
        icon: Zap,
        popular: true,
        features: [
            "10 Deployments",
            "3 Providers",
            "Basic Automation",
            "Email & Telegram Notifications",
            "Advanced Monitoring",
            "Priority Support"
        ],
        limits: {
            max_deployments: 10,
            max_providers: 3
        }
    },
    {
        tier: "enterprise",
        name: "Enterprise",
        price: "$299",
        period: "per month",
        icon: Rocket,
        features: [
            "Unlimited Deployments",
            "Unlimited Providers",
            "Advanced Automation",
            "Auto-Migration & Failover",
            "Team Collaboration",
            "Custom Integrations",
            "Dedicated Support"
        ],
        limits: {
            max_deployments: -1,
            max_providers: -1
        }
    }
];

export default function SubscriptionPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const response = await fetch("/api/v1/subscriptions/current", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSubscription(data);
            }
        } catch (error) {
            console.error("Failed to fetch subscription:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (tier: string) => {
        setUpgrading(true);
        try {
            const response = await fetch("/api/v1/subscriptions/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ tier })
            });

            if (response.ok) {
                const data = await response.json();
                // Redirect to Stripe Checkout
                window.location.href = data.checkout_url;
            } else {
                const error = await response.json();
                alert(error.detail || "Failed to create checkout session");
            }
        } catch (error) {
            console.error("Failed to upgrade:", error);
            alert("Failed to upgrade subscription");
        } finally {
            setUpgrading(false);
        }
    };

    const handleManageSubscription = async () => {
        try {
            const response = await fetch("/api/v1/subscriptions/portal", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                window.location.href = data.portal_url;
            }
        } catch (error) {
            console.error("Failed to open portal:", error);
        }
    };

    if (loading) {
        return <div className="container mx-auto py-8">Loading...</div>;
    }

    const currentTier = subscription?.tier || "basic";

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Subscription Plans</h1>
                <p className="text-muted-foreground mt-2">
                    Choose the plan that fits your needs
                </p>
            </div>

            {subscription && subscription.tier !== "basic" && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Current Subscription</CardTitle>
                        <CardDescription>Manage your subscription</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold capitalize">{subscription.tier} Plan</div>
                                <div className="text-sm text-muted-foreground">
                                    Status: <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                                        {subscription.status}
                                    </Badge>
                                </div>
                                {subscription.current_period_end && (
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {subscription.cancel_at_period_end ? "Cancels" : "Renews"} on{" "}
                                        {new Date(subscription.current_period_end).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                            <Button onClick={handleManageSubscription}>
                                Manage Subscription
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                {PLANS.map((plan) => {
                    const Icon = plan.icon;
                    const isCurrent = currentTier === plan.tier;
                    const canUpgrade = plan.tier !== "basic" && !isCurrent;

                    return (
                        <Card
                            key={plan.tier}
                            className={`relative ${plan.popular ? "border-primary shadow-lg" : ""} ${isCurrent ? "border-green-500" : ""}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-primary">Most Popular</Badge>
                                </div>
                            )}
                            {isCurrent && (
                                <div className="absolute -top-3 right-4">
                                    <Badge className="bg-green-500">Current Plan</Badge>
                                </div>
                            )}

                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Icon className="h-6 w-6" />
                                    <CardTitle>{plan.name}</CardTitle>
                                </div>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground ml-2">/{plan.period}</span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <ul className="space-y-2">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {canUpgrade ? (
                                    <Button
                                        className="w-full"
                                        onClick={() => handleUpgrade(plan.tier)}
                                        disabled={upgrading}
                                    >
                                        {upgrading ? "Processing..." : "Upgrade Now"}
                                    </Button>
                                ) : isCurrent ? (
                                    <Button className="w-full" variant="outline" disabled>
                                        Current Plan
                                    </Button>
                                ) : (
                                    <Button className="w-full" variant="outline" disabled>
                                        Free Forever
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Alert className="mt-8">
                <AlertDescription>
                    All plans include access to our core deployment management features.
                    Upgrade anytime to unlock advanced automation and team collaboration.
                </AlertDescription>
            </Alert>
        </div>
    );
}
