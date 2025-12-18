import Link from "next/link";
import { ArrowRight, Shield, Brain, Key } from "lucide-react";
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
                        Running AI workloads today is fragile.
                        <br />
                        You rent GPUs from different providers,
                        deploy manually, forget to stop instances,
                        <br />
                        and only notice the problem when the bill arrives.
                    </p>

                    <p className="homepage-h3 md:homepage-h3 homepage-h3-mobile text-text-primary text-center font-semibold">
                        This isn't a performance problem.
                        <br />
                        It's a control problem.
                    </p>
                </div>

                {/* Position Statement */}
                <div className="max-w-4xl mx-auto bg-cream-50 border-2 border-brand/20 rounded-2xl p-8 md:p-12 mb-20">
                    <p className="homepage-body text-text-secondary leading-relaxed space-y-4">
                        <span className="block">
                            ComputeHub <span className="text-text-primary font-semibold">does not sell compute</span>.
                        </span>
                        <span className="block">
                            We <span className="text-text-primary font-semibold">don't hide your infrastructure</span>.
                        </span>
                        <span className="block">
                            We <span className="text-text-primary font-semibold">don't optimize behind a black box</span>.
                        </span>
                    </p>

                    <p className="homepage-h3 md:homepage-h3 homepage-h3-mobile text-brand mt-8 font-semibold">
                        We give you one control surface
                        <br />
                        to manage what already exists — safely.
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
                                Reduce Failure Cost
                            </h3>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                Auto-stop, budget caps, and clear visibility —
                                so mistakes don't become disasters.
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
                                Lower Cognitive Load
                            </h3>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                You don't need to understand clouds, GPUs, or pricing models.
                                Templates and guardrails do the boring work.
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
                                You Stay in Control
                            </h3>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                Your accounts.
                                <br />
                                Your API keys.
                                <br />
                                Your infrastructure.
                                <br />
                                <br />
                                We're the switchboard — not the owner.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link href="/features">
                        <Button
                            variant="outline"
                            size="lg"
                            className="homepage-button-secondary px-8 h-12 border-brand text-brand bg-cream-50 hover:bg-brand hover:text-white transition-colors"
                        >
                            Explore Core Features
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
