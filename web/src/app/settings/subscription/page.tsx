"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Check, Crown, Zap, Building2, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getCurrentSubscription, createCheckoutSession, type Subscription } from "@/lib/subscription-api";
import { setAuthToken } from "@/lib/api";

const PLANS = [
    {
        id: 'basic',
        name: 'Free',
        price: '$0',
        period: 'forever',
        icon: Zap,
        color: 'text-gray-500',
        features: [
            '1 Provider binding',
            'Price comparison',
            'Basic deployment',
            'Community support',
        ],
        limitations: [
            'No templates',
            'No automation',
            'No monitoring',
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$49',
        period: 'per month',
        icon: Crown,
        color: 'text-purple-500',
        popular: true,
        features: [
            '3 Provider bindings',
            'All deployment templates',
            'Batch operations',
            'Auto-restart (basic automation)',
            'Advanced monitoring & alerts',
            'Price history & API access',
            'Up to 3 team members',
            'Email + Telegram notifications',
        ],
    },
    {
        id: 'team',
        name: 'Team',
        price: '$299',
        period: 'per month',
        icon: Building2,
        color: 'text-blue-500',
        features: [
            'Unlimited providers',
            'Cross-provider auto-migration',
            'Auto-failover',
            'Batch processing queue',
            'Unlimited team members',
            'Project isolation',
            'Cost prediction',
            '99.5% SLA',
            'Priority support',
        ],
    },
];

export default function SubscriptionPage() {
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!isLoaded || !isSignedIn) return;

            try {
                const token = await getToken();
                setAuthToken(token);
                const data = await getCurrentSubscription();
                setSubscription(data);
            } catch (error) {
                console.error("Failed to fetch subscription:", error);
                toast({
                    title: "Error",
                    description: "Failed to load subscription information",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [isLoaded, isSignedIn, getToken, toast]);

    const handleUpgrade = async (tier: 'pro' | 'team') => {
        setUpgrading(tier);
        try {
            const session = await createCheckoutSession(tier);
            // Redirect to Stripe Checkout
            window.location.href = session.checkout_url;
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to start upgrade process",
                variant: "destructive",
            });
            setUpgrading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const currentTier = subscription?.tier || 'basic';

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
                <p className="text-muted-foreground mt-1">
                    Choose the plan that's right for you
                </p>
            </div>

            {/* Current Plan Alert */}
            {subscription && (
                <Alert>
                    <AlertDescription>
                        You are currently on the <strong className="capitalize">{currentTier}</strong> plan.
                        {subscription.cancel_at_period_end && (
                            <span className="text-destructive ml-2">
                                (Will cancel at period end)
                            </span>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Pricing Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {PLANS.map((plan) => {
                    const Icon = plan.icon;
                    const isCurrentPlan = currentTier === plan.id;
                    const canUpgrade = plan.id !== 'basic' && !isCurrentPlan;

                    return (
                        <Card
                            key={plan.id}
                            className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary">Most Popular</Badge>
                                </div>
                            )}

                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <Icon className={`h-8 w-8 ${plan.color}`} />
                                    {isCurrentPlan && (
                                        <Badge variant="secondary">Current Plan</Badge>
                                    )}
                                </div>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground">/{plan.period}</span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    {plan.features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                            <span className="text-sm">{feature}</span>
                                        </div>
                                    ))}
                                    {plan.limitations?.map((limitation, index) => (
                                        <div key={index} className="flex items-start gap-2 opacity-50">
                                            <span className="text-sm">✗ {limitation}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter>
                                {isCurrentPlan ? (
                                    <Button className="w-full" disabled>
                                        Current Plan
                                    </Button>
                                ) : canUpgrade ? (
                                    <Button
                                        className="w-full"
                                        onClick={() => handleUpgrade(plan.id as 'pro' | 'team')}
                                        disabled={upgrading !== null}
                                    >
                                        {upgrading === plan.id ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Upgrade to {plan.name}
                                                <ArrowRight className="h-4 w-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Button className="w-full" variant="outline" disabled>
                                        {plan.id === 'basic' ? 'Free Forever' : 'Contact Sales'}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Enterprise */}
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-6 w-6" />
                        Enterprise
                    </CardTitle>
                    <CardDescription>
                        Custom solutions for large organizations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold">Everything in Team, plus:</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• SOC 2, HIPAA, GDPR compliance</li>
                                <li>• Private deployment options</li>
                                <li>• 99.9% SLA</li>
                                <li>• 24/7 dedicated support</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold">Additional features:</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Custom development</li>
                                <li>• White-label solutions</li>
                                <li>• On-site training</li>
                                <li>• Architecture consulting</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" variant="outline">
                        Contact Sales
                    </Button>
                </CardFooter>
            </Card>

            {/* FAQ */}
            <Card>
                <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-1">Can I change plans anytime?</h4>
                        <p className="text-sm text-muted-foreground">
                            Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1">What payment methods do you accept?</h4>
                        <p className="text-sm text-muted-foreground">
                            We accept all major credit cards through Stripe.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1">Is there a free trial?</h4>
                        <p className="text-sm text-muted-foreground">
                            The Free plan is available forever. You can upgrade to Pro or Team at any time.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
