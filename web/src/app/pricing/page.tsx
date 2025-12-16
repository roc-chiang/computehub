"use client";

import { Check, X, Info, Sparkles, Shield, Zap, Users, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LandingHeader } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
    {
        name: "Free",
        icon: Zap,
        price: "$0",
        period: "/month",
        description: "Pay-as-you-go for individuals",
        features: {
            "GPU Pricing": "Cost price + optional 5-7% service fee",
            "Global GPU Access": true,
            "Deployment Templates": "Basic",
            "Log Retention": "24 hours",
            "Concurrent Deployments": "1",
            "Projects": "1",
            "API Rate Limit": "Low",
            "Smart Scheduling": false,
            "Auto-Recovery": false,
            "Priority Queue": false,
            "Team Members": "1",
            "SLA": false,
            "Support": "Community",
        },
        cta: "Get Started",
        ctaLink: "/signup",
        popular: false,
    },
    {
        name: "Pro",
        icon: Sparkles,
        price: "$29",
        period: "/month",
        description: "For developers & researchers",
        features: {
            "GPU Pricing": "Cost price + optional 5-7% service fee",
            "Global GPU Access": true,
            "Deployment Templates": "All templates",
            "Log Retention": "30 days",
            "Concurrent Deployments": "5",
            "Projects": "Unlimited",
            "API Rate Limit": "High",
            "Smart Scheduling": true,
            "Auto-Recovery": true,
            "Priority Queue": true,
            "Team Members": "1",
            "SLA": false,
            "Support": "Priority (24h)",
        },
        cta: "Start Free Trial",
        ctaLink: "/signup?plan=pro",
        popular: true,
    },
    {
        name: "Team",
        icon: Users,
        price: "$149",
        period: "/month",
        description: "For AI teams & products",
        features: {
            "GPU Pricing": "Cost price + optional 5-7% service fee",
            "Global GPU Access": true,
            "Deployment Templates": "All + Custom",
            "Log Retention": "90 days",
            "Concurrent Deployments": "20",
            "Projects": "Unlimited",
            "API Rate Limit": "Very High",
            "Smart Scheduling": true,
            "Auto-Recovery": true,
            "Priority Queue": true,
            "Team Members": "10",
            "SLA": "99.5%",
            "Support": "Priority (12h)",
        },
        cta: "Contact Sales",
        ctaLink: "/contact",
        popular: false,
    },
    {
        name: "Enterprise",
        icon: Building2,
        price: "$499",
        period: "/month+",
        description: "For compliance & scale",
        features: {
            "GPU Pricing": "Cost price + optional 5-7% service fee",
            "Global GPU Access": true,
            "Deployment Templates": "All + Custom + Private",
            "Log Retention": "365 days",
            "Concurrent Deployments": "Unlimited",
            "Projects": "Unlimited",
            "API Rate Limit": "Unlimited",
            "Smart Scheduling": true,
            "Auto-Recovery": true,
            "Priority Queue": true,
            "Team Members": "50+",
            "SLA": "99.9%",
            "Support": "24/7 Dedicated",
        },
        cta: "Contact Sales",
        ctaLink: "/contact",
        popular: false,
    },
];

const faqs = [
    {
        question: "Do you mark up GPU prices?",
        answer: "No. We use transparent pricing: GPU costs are always at provider cost price. We offer an optional 5-7% service fee for smart scheduling, auto-recovery, and infrastructure costs. You can disable this fee in settings and pay pure cost price."
    },
    {
        question: "Why should I subscribe to Pro/Team?",
        answer: "Subscriptions provide massive value beyond GPU access: Smart scheduling saves 10-30% on costs, auto-recovery prevents training losses (saving hours or thousands of dollars), priority queues reduce wait times, and enhanced monitoring improves efficiency. Many teams subscribe to spend less time on infrastructure and more time coding."
    },
    {
        question: "Can I just run one model without subscribing?",
        answer: "Absolutely! Use the Free tier with pay-as-you-go pricing. No subscription required, no credit card pre-authorization. Pay only for what you use. Upgrade to Pro if you need better stability, faster startup, or cost savings."
    },
    {
        question: "What's the difference between Team and Enterprise?",
        answer: "Team is perfect for software teams and AI product development (10 members, 99.5% SLA, basic compliance). Enterprise is for industries with strict compliance requirements like finance and healthcare (data residency, 99.9% SLA, private nodes, VPC isolation, 24/7 support)."
    },
    {
        question: "What if I don't need Canada-based nodes?",
        answer: "Canada is our sovereignty core for compliance. You can still use the cheapest GPUs globally, but Enterprise customers can choose to run only in Canada for stronger compliance (PIPEDA, data sovereignty). This is critical for finance, healthcare, and government clients."
    },
    {
        question: "Will prices increase in the future?",
        answer: "We commit to transparent pricing with no hidden fees. Subscription prices are locked for ≥12 months. Any price changes will be announced at least 60 days in advance, and existing customers can choose to keep their original pricing."
    },
];

export default function PricingPage() {
    return (
        <div className="flex min-h-screen flex-col bg-black text-white">
            <LandingHeader />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-20 md:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-16 space-y-4">
                            <Badge variant="secondary" className="px-4 py-2 text-sm rounded-full border-blue-500/20 bg-blue-500/10 text-blue-400">
                                Transparent Pricing
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
                                Pay for experience,<br />not GPU access.
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
                                GPU at cost price. Optional service fee. Subscriptions unlock automation, stability, and team features.
                            </p>
                        </div>

                        {/* Service Fee Notice */}
                        <Alert className="max-w-3xl mx-auto mb-12 border-blue-500/20 bg-blue-500/10">
                            <Info className="h-4 w-4 text-blue-500" />
                            <AlertDescription>
                                <strong>100% Transparent:</strong> GPU costs are always at provider cost price.
                                Optional 5-7% service fee covers smart scheduling, auto-recovery, and infrastructure (can be disabled).
                            </AlertDescription>
                        </Alert>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                            {plans.map((plan, index) => {
                                const Icon = plan.icon;
                                return (
                                    <Card
                                        key={index}
                                        className={`flex flex-col relative ${plan.popular
                                                ? 'border-blue-500 shadow-lg shadow-blue-500/10 scale-105 z-10'
                                                : 'border-zinc-800'
                                            }`}
                                    >
                                        {plan.popular && (
                                            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 hover:bg-blue-600">
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                Most Popular
                                            </Badge>
                                        )}
                                        <CardHeader>
                                            <Icon className="h-8 w-8 mb-2 text-blue-500" />
                                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                            <div className="mt-4 flex items-baseline">
                                                <span className="text-4xl font-bold tracking-tighter">{plan.price}</span>
                                                <span className="text-sm font-normal text-muted-foreground ml-1">{plan.period}</span>
                                            </div>
                                            <CardDescription className="mt-2">{plan.description}</CardDescription>
                                        </CardHeader>
                                        <CardFooter className="mt-auto">
                                            <Link href={plan.ctaLink} className="w-full">
                                                <Button
                                                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-500' : ''}`}
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

                        {/* Feature Comparison Table */}
                        <div className="mb-20">
                            <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-800">
                                            <th className="text-left p-4 font-semibold">Feature</th>
                                            {plans.map((plan) => (
                                                <th key={plan.name} className="text-center p-4 font-semibold">
                                                    {plan.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(plans[0].features).map((feature) => (
                                            <tr key={feature} className="border-b border-zinc-800/50">
                                                <td className="p-4 text-muted-foreground">{feature}</td>
                                                {plans.map((plan) => {
                                                    const value = plan.features[feature as keyof typeof plan.features];
                                                    return (
                                                        <td key={plan.name} className="text-center p-4">
                                                            {typeof value === 'boolean' ? (
                                                                value ? (
                                                                    <Check className="h-5 w-5 text-blue-500 mx-auto" />
                                                                ) : (
                                                                    <X className="h-5 w-5 text-zinc-600 mx-auto" />
                                                                )
                                                            ) : (
                                                                <span className="text-sm">{value}</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FAQ Section */}
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                            <Accordion type="single" collapsible className="w-full">
                                {faqs.map((faq, index) => (
                                    <AccordionItem key={index} value={`item-${index}`}>
                                        <AccordionTrigger className="text-left">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>

                        {/* CTA Section */}
                        <div className="text-center mt-20">
                            <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
                            <p className="text-muted-foreground mb-8">
                                Start with Free tier. Upgrade anytime.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Link href="/signup">
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500">
                                        Get Started Free
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button size="lg" variant="outline">
                                        Contact Sales
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
