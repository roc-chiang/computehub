import Link from "next/link";
import { ArrowRight, Shield, Brain, Key, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function About() {
    return (
        <section id="about" className="py-24 md:py-32 bg-cream-100">
            <div className="container px-4 md:px-6">
                {/* Section Title */}
                <div className="text-center mb-16">
                    <h2 className="homepage-h2 md:homepage-h2 homepage-h2-mobile mb-6">
                        Why ComputeHub Exists
                    </h2>
                </div>

                {/* Problem Statement */}
                <div className="max-w-4xl mx-auto space-y-6 mb-20">
                    <p className="homepage-body text-text-secondary text-center leading-relaxed">
                        Managing GPU deployments across multiple cloud providers is complex.
                        <br />
                        You juggle different dashboards, forget to stop instances,
                        <br />
                        and struggle with cost control and automation.
                    </p>

                    <p className="homepage-h3 md:homepage-h3 homepage-h3-mobile text-text-primary text-center font-semibold">
                        ComputeHub brings everything together
                        <br />
                        in one open-source platform.
                    </p>
                </div>

                {/* Position Statement */}
                <div className="max-w-4xl mx-auto bg-cream-50 border-2 border-brand/20 rounded-2xl p-8 md:p-12 mb-20">
                    <p className="homepage-body text-text-secondary leading-relaxed space-y-4">
                        <span className="block">
                            ComputeHub is <span className="text-text-primary font-semibold">100% open-source</span>.
                        </span>
                        <span className="block">
                            We <span className="text-text-primary font-semibold">don't sell compute</span>.
                        </span>
                        <span className="block">
                            We <span className="text-text-primary font-semibold">don't lock you in</span>.
                        </span>
                    </p>

                    <p className="homepage-h3 md:homepage-h3 homepage-h3-mobile text-brand mt-8 font-semibold">
                        Self-host it, modify it, own it.
                        <br />
                        Your infrastructure, your control.
                    </p>
                </div>

                {/* Three Principles */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    {/* Principle 1 */}
                    <Card className="bg-cream-50 border-cream-200 hover:border-brand transition-colors">
                        <CardContent className="pt-8 pb-8 px-6 space-y-4">
                            <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-brand" />
                            </div>
                            <h3 className="homepage-h3 md:homepage-h3 homepage-h3-mobile text-text-primary">
                                Cost Control
                            </h3>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                Auto-stop, budget caps, and cost alerts —
                                prevent runaway GPU bills.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Principle 2 */}
                    <Card className="bg-cream-50 border-cream-200 hover:border-brand transition-colors">
                        <CardContent className="pt-8 pb-8 px-6 space-y-4">
                            <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center">
                                <Brain className="h-6 w-6 text-brand" />
                            </div>
                            <h3 className="homepage-h3 md:homepage-h3 homepage-h3-mobile text-text-primary">
                                Automation
                            </h3>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                Auto-restart on failure, rule-based automation,
                                and smart notifications.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Principle 3 */}
                    <Card className="bg-cream-50 border-cream-200 hover:border-brand transition-colors">
                        <CardContent className="pt-8 pb-8 px-6 space-y-4">
                            <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center">
                                <Key className="h-6 w-6 text-brand" />
                            </div>
                            <h3 className="homepage-h3 md:homepage-h3 homepage-h3-mobile text-text-primary">
                                Full Control
                            </h3>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                Your accounts.
                                <br />
                                Your API keys.
                                <br />
                                Your data.
                                <br />
                                <br />
                                Self-hosted, no vendor lock-in.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Our Story Section */}
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-brand-light to-cream-50 border-2 border-brand/20 rounded-2xl p-8 md:p-12 mb-12">
                    <h3 className="homepage-h3 md:homepage-h3 homepage-h3-mobile text-text-primary mb-6 text-center">
                        Our Story
                    </h3>

                    <div className="space-y-6">
                        <p className="homepage-body text-text-secondary leading-relaxed">
                            ComputeHub was created by <span className="text-text-primary font-semibold">roc-chiang</span>,
                            a technology enthusiast with experience across gaming, smart hardware, blockchain, and 3D digital humans.
                        </p>

                        <div className="flex items-center justify-center gap-4 py-4">
                            <a
                                href="https://github.com/rocchiang1"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-brand/20 bg-cream-50 hover:bg-brand hover:text-white transition-colors"
                            >
                                <Github className="h-5 w-5" />
                                <span className="font-medium">@rocchiang1</span>
                            </a>
                        </div>

                        <blockquote className="border-l-4 border-brand pl-6 italic text-text-secondary">
                            "An idealistic thinker and a pragmatic doer — holding the line in compromise,
                            staying flexible in persistence. A long-term value advocate with an interesting soul."
                        </blockquote>

                        <p className="homepage-body text-text-secondary leading-relaxed">
                            After managing GPU deployments across multiple projects, the pain points became clear:
                            fragmented dashboards, manual cost tracking, and lack of automation.
                            ComputeHub was born to solve these problems — not as a SaaS product,
                            but as an <span className="text-text-primary font-semibold">open-source tool</span> that anyone can use and improve.
                        </p>

                        <p className="homepage-body text-text-secondary leading-relaxed">
                            The project embraces the philosophy of <span className="text-text-primary font-semibold">building in public</span>
                            and <span className="text-text-primary font-semibold">long-term value creation</span>.
                            Free forever, with optional Pro features for those who need advanced automation.
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link href="https://github.com/roc-chiang/computehub" target="_blank">
                        <Button
                            variant="outline"
                            size="lg"
                            className="homepage-button-secondary px-8 h-12 border-brand text-brand bg-cream-50 hover:bg-brand hover:text-white transition-colors"
                        >
                            <Github className="mr-2 h-4 w-4" />
                            View on GitHub
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
