"use client";

import { Check, X, Info, Github, Sparkles } from "lucide-react";
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
        icon: Github,
        price: "$0",
        period: "Forever",
        description: "Open-source, self-hosted",
        features: [
            "Multi-provider management",
            "Deployment dashboard",
            "Price comparison",
            "Organization & Projects",
            "Basic templates",
            "SSH access",
            "Cost tracking",
            "Community support"
        ],
        cta: "View on GitHub",
        ctaLink: "https://github.com/roc-chiang/computehub",
        popular: false,
    },
    {
        name: "Pro",
        icon: Sparkles,
        price: "$49",
        period: "One-time payment",
        description: "Unlock automation & notifications",
        features: [
            "Everything in Free, plus:",
            "Automation engine",
            "Auto-restart on failure",
            "Cost limit auto-shutdown",
            "Automation rules (IF-THEN)",
            "Email notifications",
            "Telegram notifications",
            "Webhook integration",
            "Advanced monitoring",
            "Batch operations",
            "Advanced templates",
            "Email support"
        ],
        cta: "Buy Pro License",
        ctaLink: "https://gumroad.com/l/computehub-pro",
        popular: true,
    },
];

const featureComparison = [
    {
        category: "Core Management", features: [
            { name: "Multi-provider support", free: true, pro: true },
            { name: "Deployment dashboard", free: true, pro: true },
            { name: "Price comparison", free: true, pro: true },
            { name: "Organization & Projects", free: true, pro: true },
            { name: "Basic templates", free: true, pro: true },
        ]
    },
    {
        category: "Automation", features: [
            { name: "Auto-restart on failure", free: false, pro: true },
            { name: "Cost limit auto-shutdown", free: false, pro: true },
            { name: "Automation rules (IF-THEN)", free: false, pro: true },
        ]
    },
    {
        category: "Notifications", features: [
            { name: "Email notifications", free: false, pro: true },
            { name: "Telegram notifications", free: false, pro: true },
            { name: "Webhook integration", free: false, pro: true },
        ]
    },
    {
        category: "Advanced", features: [
            { name: "Advanced monitoring", free: false, pro: true },
            { name: "Batch operations", free: false, pro: true },
            { name: "Advanced templates", free: false, pro: true },
        ]
    },
    {
        category: "Support", features: [
            { name: "Community support", free: true, pro: true },
            { name: "Email support", free: false, pro: true },
        ]
    },
];

const faqs = [
    {
        question: "Is ComputeHub really free?",
        answer: "Yes! ComputeHub is open-source and free forever. You can self-host it and use all core features at no cost. Pro features are optional and unlock with a one-time $49 license."
    },
    {
        question: "What's the difference between Free and Pro?",
        answer: "Free includes all core management features. Pro adds automation (auto-restart, cost limits), notifications (Email, Telegram, Webhook), and advanced monitoring. Perfect for production workloads."
    },
    {
        question: "Is this a subscription?",
        answer: "No! Pro is a one-time $49 payment for lifetime access. No recurring fees, no monthly charges. Buy once, use forever."
    },
    {
        question: "How do I activate Pro features?",
        answer: "After purchasing, you'll receive a license key. Enter it in your self-hosted ComputeHub instance under Settings → License. Pro features unlock immediately."
    },
    {
        question: "Can I try Pro before buying?",
        answer: "Yes! All Pro features are visible in the open-source code. You can review the implementation on GitHub before purchasing."
    },
    {
        question: "What if I need help?",
        answer: "Free users get community support via GitHub Issues. Pro users get email support. We also offer paid consulting for custom deployments."
    },
    {
        question: "Do you offer refunds?",
        answer: "Pro licenses are sold 'as is' with no SLA. However, if you're not satisfied within 14 days, contact us for a refund."
    },
    {
        question: "Will there be updates?",
        answer: "Yes! We actively maintain ComputeHub. Pro license holders get all future updates for free."
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
                                No Subscription • No Recurring Fees
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
                                Simple, Transparent Pricing
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
                                Open-source forever. Optional Pro features with a one-time payment.
                            </p>
                        </div>

                        {/* Service Fee Notice */}
                        <Alert className="max-w-3xl mx-auto mb-12 border-blue-500/20 bg-blue-500/10">
                            <Info className="h-4 w-4 text-blue-500" />
                            <AlertDescription>
                                <strong>100% Open Source:</strong> Self-host ComputeHub for free. Pro features unlock with a simple license key. No vendor lock-in, your data stays with you.
                            </AlertDescription>
                        </Alert>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
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
                                            <Icon className="h-10 w-10 mb-4 text-blue-500" />
                                            <CardTitle className="text-3xl">{plan.name}</CardTitle>
                                            <div className="mt-4 flex items-baseline">
                                                <span className="text-5xl font-bold tracking-tighter">{plan.price}</span>
                                                <span className="text-sm font-normal text-muted-foreground ml-2">{plan.period}</span>
                                            </div>
                                            <CardDescription className="mt-2 text-base">{plan.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <ul className="space-y-3">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <Check className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                                        <span className="text-sm">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter className="mt-auto">
                                            <Link href={plan.ctaLink} className="w-full" target="_blank">
                                                <Button
                                                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-500' : ''}`}
                                                    variant={plan.popular ? 'default' : 'outline'}
                                                    size="lg"
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
                            <div className="max-w-3xl mx-auto">
                                {featureComparison.map((category, idx) => (
                                    <div key={idx} className="mb-8">
                                        <h3 className="text-xl font-semibold mb-4 text-blue-400">{category.category}</h3>
                                        <div className="space-y-2">
                                            {category.features.map((feature, i) => (
                                                <div key={i} className="grid grid-cols-3 gap-4 p-3 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                                    <div className="col-span-1 text-sm text-muted-foreground">{feature.name}</div>
                                                    <div className="text-center">
                                                        {feature.free ? (
                                                            <Check className="h-5 w-5 text-blue-500 mx-auto" />
                                                        ) : (
                                                            <X className="h-5 w-5 text-zinc-600 mx-auto" />
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        {feature.pro ? (
                                                            <Check className="h-5 w-5 text-blue-500 mx-auto" />
                                                        ) : (
                                                            <X className="h-5 w-5 text-zinc-600 mx-auto" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
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
                            <h3 className="text-2xl font-bold mb-4">Ready to Deploy?</h3>
                            <p className="text-muted-foreground mb-8">
                                Start with the free version, upgrade when you need automation.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Link href="https://github.com/roc-chiang/computehub" target="_blank">
                                    <Button size="lg" variant="outline">
                                        <Github className="h-5 w-5 mr-2" />
                                        View on GitHub
                                    </Button>
                                </Link>
                                <Link href="https://gumroad.com/l/computehub-pro" target="_blank">
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500">
                                        Buy Pro License - $49
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
