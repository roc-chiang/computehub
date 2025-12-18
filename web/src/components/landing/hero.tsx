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
                        {/* H1 - Core Message */}
                        <h1 className="homepage-h1 md:homepage-h1 homepage-h1-mobile leading-tight">
                            Stop Losing Money on GPUs.
                            <br />
                            <span className="text-brand">Run AI workloads with control, not chaos.</span>
                        </h1>

                        {/* Subhead */}
                        <p className="homepage-h3 md:homepage-h3 homepage-h3-mobile text-text-secondary leading-relaxed">
                            ComputeHub is a <span className="text-text-primary font-semibold">control layer</span> for GPU compute.
                            <br />
                            One place to deploy, monitor, and auto-stop workloads
                            <br />
                            across providers like RunPod and Vast.ai.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link href="/deploy">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto homepage-button-primary px-8 h-14 bg-brand hover:bg-brand-dark text-white text-lg"
                                >
                                    Start Free — No Credit Card
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="#about">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full sm:w-auto homepage-button-secondary px-8 h-14 border-brand text-brand bg-cream-50 hover:bg-brand hover:text-white transition-colors text-lg"
                                >
                                    <Play className="mr-2 h-5 w-5" />
                                    See How It Prevents GPU Waste
                                </Button>
                            </Link>
                        </div>

                        {/* Trust Anchor */}
                        <p className="homepage-small text-text-secondary pt-4">
                            Built for solo builders and small teams running real AI workloads.
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
