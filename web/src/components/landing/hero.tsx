import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-32">
            {/* Background Gradients */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-light/20 via-cream-50 to-cream-50" />

            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left: Copy */}
                    <div className="space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-brand/20 bg-brand-light text-brand text-sm font-medium">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            Open Source • Self-Hosted
                        </div>

                        {/* H1 - Core Message */}
                        <h1 className="homepage-h1 md:homepage-h1 homepage-h1-mobile leading-tight">
                            Manage GPU Deployments
                            <br />
                            <span className="text-brand">Across Multiple Clouds</span>
                        </h1>

                        {/* Subhead */}
                        <p className="homepage-h3 md:homepage-h3 homepage-h3-mobile text-text-secondary leading-relaxed">
                            Open-source platform for deploying and managing GPU instances.
                            <br />
                            <span className="text-text-primary font-semibold">Free forever</span>, with optional Pro automation features.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link href="https://github.com/roc-chiang/computehub" target="_blank">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto homepage-button-secondary px-8 h-14 border-brand text-brand bg-cream-50 hover:bg-brand hover:text-white transition-colors text-lg"
                                >
                                    <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    View on GitHub
                                </Button>
                            </Link>
                            <Link href="https://gumroad.com/l/computehub-pro" target="_blank">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto homepage-button-primary px-8 h-14 bg-brand hover:bg-brand-dark text-white text-lg"
                                >
                                    Buy Pro - $49
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>

                        {/* Trust Anchor */}
                        <p className="homepage-small text-text-secondary pt-4">
                            No subscription • One-time payment • Self-hosted
                        </p>
                    </div>

                    {/* Right: Architecture Diagram */}
                    <div className="flex items-center justify-center">
                        <div className="bg-cream-100 border-2 border-cream-200 rounded-2xl p-8 md:p-12 shadow-lg max-w-md w-full">
                            <div className="space-y-6 font-mono text-sm md:text-base">
                                {/* You */}
                                <div className="text-center">
                                    <div className="inline-block px-6 py-3 bg-brand text-white rounded-lg font-semibold">
                                        You
                                    </div>
                                </div>

                                {/* Arrow with labels */}
                                <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-12 bg-brand"></div>
                                    <div className="text-xs text-text-secondary space-y-1 text-center">
                                        <div>Deploy / Stop / Budget</div>
                                    </div>
                                    <div className="w-0.5 h-12 bg-brand"></div>
                                </div>

                                {/* ComputeHub */}
                                <div className="text-center">
                                    <div className="inline-block px-6 py-3 bg-brand-dark text-white rounded-lg font-semibold">
                                        ComputeHub
                                    </div>
                                </div>

                                {/* Providers */}
                                <div className="space-y-3 pl-8 border-l-2 border-brand">
                                    <div className="flex items-center">
                                        <div className="w-4 h-0.5 bg-brand mr-3"></div>
                                        <div className="px-4 py-2 bg-cream-200 rounded text-text-primary">
                                            RunPod
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-0.5 bg-brand mr-3"></div>
                                        <div className="px-4 py-2 bg-cream-200 rounded text-text-primary">
                                            Vast.ai
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-0.5 bg-brand mr-3"></div>
                                        <div className="px-4 py-2 bg-cream-200 rounded text-text-primary">
                                            Your Own GPU
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
