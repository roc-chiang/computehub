"use client";

import { Check, Info, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "/month",
        description: "Pay-as-you-go for individuals",
        features: [
            "GPU at cost price + optional 5-7% service fee",
            "Global GPU access",
            "Basic deployment templates",
            "24-hour log retention",
            "1 concurrent deployment",
            "Community support",
        ],
        cta: "Get Started",
        ctaLink: "/signup",
        popular: false,
        note: "Service fee can be disabled in settings",
    },
    {
        name: "Pro",
        price: "$29",
        period: "/month",
        description: "For developers & researchers",
        features: [
            "Everything in Free, plus:",
            "Smart scheduling (save 10-30% cost)",
            "Auto-recovery & failover",
            "Priority queue (faster startup)",
            "30-day log retention",
            "5 concurrent deployments",
            "Unlimited projects",
            "Enhanced monitoring",
            "Priority support",
        ],
        cta: "Start Free Trial",
        ctaLink: "/signup?plan=pro",
        popular: true,
    },
    {
        name: "Team",
        price: "$149",
        period: "/month",
        description: "For AI teams & products",
        features: [
            "Everything in Pro, plus:",
            "Up to 10 team members",
            "RBAC permissions",
            "Unified billing & invoices",
            "90-day audit logs",
            "Custom Docker images",
            "20 concurrent deployments",
            "99.5% SLA",
            "Dual-zone scheduling",
        ],
        cta: "Contact Sales",
        ctaLink: "/contact",
        popular: false,
    },
    {
        name: "Enterprise",
        price: "$499",
        period: "/month+",
        description: "For compliance & scale",
        features: [
            "Everything in Team, plus:",
            "50+ team members",
            "Data residency (Canada)",
            "Private node pools",
            "VPC networking",
            "99.9% SLA",
            "SOC2/ISO27001-ready logs",
            "24/7 dedicated support",
            "Custom integrations",
        ],
        cta: "Contact Sales",
        ctaLink: "/contact",
        popular: false,
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-cream-50 homepage-section-spacing">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="homepage-h2 md:homepage-h2 homepage-h2-mobile text-text-primary">
                        Transparent, flexible pricing.
                    </h2>
                    <p className="homepage-body text-text-secondary mx-auto">
                        GPU at cost price. Pay for experience, not access.
                    </p>
                </div>

                {/* Service Fee Notice */}
                <Alert className="max-w-3xl mx-auto mb-12 border-brand/20 bg-brand-light">
                    <Info className="h-4 w-4 text-brand" />
                    <AlertDescription className="homepage-small text-text-primary">
                        <strong>Transparent Pricing:</strong> GPU costs are always at provider cost price.
                        Optional 5-7% service fee for smart scheduling & auto-recovery (can be disabled).
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {plans.map((plan, index) => (
                        <Card
                            key={index}
                            className={`flex flex-col relative ${plan.popular
                                ? 'border-brand shadow-lg shadow-brand/10 scale-105 z-10 bg-cream-50'
                                : 'border-cream-200 bg-cream-100'
                                }`}
                        >
                            {plan.popular && (
                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand hover:bg-brand-dark text-white">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Most Popular
                                </Badge>
                            )}
                            <CardHeader>
                                <CardTitle className="homepage-h3 text-text-primary">{plan.name}</CardTitle>
                                <div className="mt-4 flex items-baseline">
                                    <span className="text-4xl font-bold tracking-tighter text-brand">{plan.price}</span>
                                    <span className="homepage-small text-text-secondary ml-1">{plan.period}</span>
                                </div>
                                <CardDescription className="homepage-small text-text-secondary mt-2">{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2.5">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start text-sm">
                                            <Check className="mr-2 h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
                                            <span className="homepage-small text-text-secondary">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                {plan.note && (
                                    <p className="text-xs text-text-secondary mt-4 italic">
                                        {plan.note}
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Link href={plan.ctaLink} className="w-full">
                                    <Button
                                        className={`w-full ${plan.popular ? 'bg-brand hover:bg-brand-dark text-white' : 'border-cream-200 hover:bg-cream-50'}`}
                                        variant={plan.popular ? 'default' : 'outline'}
                                    >
                                        {plan.cta}
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* View Full Pricing Link */}
                <div className="text-center mt-12">
                    <Link href="/pricing">
                        <Button variant="link" className="text-brand hover:text-brand-dark">
                            View detailed pricing & FAQ →
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
