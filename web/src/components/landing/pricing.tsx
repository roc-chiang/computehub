"use client";

import { Check, Info, Sparkles, Github } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "Forever",
        description: "Open-source, self-hosted",
        features: [
            "Multi-provider management",
            "Deployment dashboard",
            "Price comparison",
            "Organization & Projects",
            "Basic templates",
            "Community support",
        ],
        cta: "View on GitHub",
        ctaLink: "https://github.com/roc-chiang/computehub",
        popular: false,
        icon: Github,
    },
    {
        name: "Pro",
        price: "$49",
        period: "One-time",
        description: "Unlock automation & notifications",
        features: [
            "Everything in Free, plus:",
            "Automation engine",
            "Auto-restart & cost limits",
            "Email & Telegram notifications",
            "Advanced monitoring",
            "Batch operations",
            "Email support",
        ],
        cta: "Buy Pro License",
        ctaLink: "https://gumroad.com/l/computehub-pro",
        popular: true,
        icon: Sparkles,
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-cream-50 homepage-section-spacing">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16 space-y-4">
                    <Badge className="px-4 py-2 text-sm rounded-full border-brand/20 bg-brand-light text-brand">
                        No Subscription • No Recurring Fees
                    </Badge>
                    <h2 className="homepage-h2 md:homepage-h2 homepage-h2-mobile text-text-primary">
                        Simple Pricing
                    </h2>
                    <p className="homepage-body text-text-secondary mx-auto">
                        Open-source and free. Optional Pro features for $49 lifetime.
                    </p>
                </div>

                {/* Service Fee Notice */}
                <Alert className="max-w-3xl mx-auto mb-12 border-brand/20 bg-brand-light">
                    <Info className="h-4 w-4 text-brand" />
                    <AlertDescription className="homepage-small text-text-primary">
                        <strong>100% Open Source:</strong> Self-host ComputeHub for free. Pro features unlock with a simple license key.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan, index) => {
                        const Icon = plan.icon;
                        return (
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
                                    <Icon className="h-8 w-8 mb-2 text-brand" />
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
                                </CardContent>
                                <CardFooter>
                                    <Link href={plan.ctaLink} className="w-full" target="_blank">
                                        <Button
                                            className={`w-full ${plan.popular ? 'bg-brand hover:bg-brand-dark text-white' : 'border-cream-200 hover:bg-cream-50'}`}
                                            variant={plan.popular ? 'default' : 'outline'}
                                        >
                                            {plan.cta}
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {/* View Full Pricing Link */}
                <div className="text-center mt-12">
                    <Link href="/pricing">
                        <Button variant="link" className="text-brand hover:bg-brand-dark">
                            See full pricing & FAQ →
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
