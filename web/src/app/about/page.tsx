import { LandingHeader } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Target, Users, Zap, Shield } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="flex min-h-screen flex-col bg-cream-50 text-text-primary">
            <LandingHeader />

            <main className="flex-1 pt-24 pb-16">
                <div className="container px-4 md:px-6 max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="homepage-h1 md:homepage-h1 homepage-h1-mobile tracking-tight mb-4">
                            About ComputeHub
                        </h1>
                        <p className="homepage-body text-text-secondary">
                            Democratizing access to high-performance GPU compute for AI and ML workloads
                        </p>
                    </div>

                    {/* Mission */}
                    <div className="mb-16">
                        <h2 className="homepage-h2 text-text-primary mb-6">Our Mission</h2>
                        <p className="homepage-body text-text-secondary leading-relaxed">
                            At ComputeHub, we believe that access to powerful GPU compute shouldn't be limited by geography, budget, or technical complexity. We're building the next generation GPU aggregation platform that makes it easy for anyone to deploy, manage, and scale their AI and ML workloads across multiple cloud providers.
                        </p>
                    </div>

                    {/* Values */}
                    <div className="mb-16">
                        <h2 className="homepage-h2 text-text-primary mb-8">Our Values</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="p-3 bg-brand-light rounded-lg">
                                        <Target className="h-6 w-6 text-brand" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="homepage-h4 text-text-primary mb-2">Simplicity First</h3>
                                    <p className="homepage-body text-text-secondary">
                                        We make complex infrastructure simple. Deploy GPUs in seconds, not hours.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="p-3 bg-brand-light rounded-lg">
                                        <Zap className="h-6 w-6 text-brand" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="homepage-h4 text-text-primary mb-2">Performance</h3>
                                    <p className="homepage-body text-text-secondary">
                                        Access to the latest GPUs with optimal performance and reliability.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="p-3 bg-brand-light rounded-lg">
                                        <Users className="h-6 w-6 text-brand" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="homepage-h4 text-text-primary mb-2">Community Driven</h3>
                                    <p className="homepage-body text-text-secondary">
                                        Built by developers, for developers. We listen to our community.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="p-3 bg-brand-light rounded-lg">
                                        <Shield className="h-6 w-6 text-brand" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="homepage-h4 text-text-primary mb-2">Security</h3>
                                    <p className="homepage-body text-text-secondary">
                                        Enterprise-grade security and compliance for your workloads.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Story */}
                    <div className="mb-16">
                        <h2 className="homepage-h2 text-text-primary mb-6">Our Story</h2>
                        <div className="space-y-4 homepage-body text-text-secondary leading-relaxed">
                            <p>
                                ComputeHub was founded in 2024 by a team of AI engineers and infrastructure experts who experienced firsthand the challenges of accessing affordable, reliable GPU compute.
                            </p>
                            <p>
                                We saw researchers and startups struggling with complex cloud configurations, unpredictable pricing, and vendor lock-in. We knew there had to be a better way.
                            </p>
                            <p>
                                Today, ComputeHub serves thousands of users worldwide, from individual researchers to enterprise teams, providing seamless access to GPU compute across multiple providers with transparent pricing and simple management.
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-cream-100 rounded-lg border border-cream-200">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-brand mb-2">1000+</div>
                            <div className="homepage-small text-text-secondary">Active Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-brand mb-2">5000+</div>
                            <div className="homepage-small text-text-secondary">Deployments</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-brand mb-2">99.9%</div>
                            <div className="homepage-small text-text-secondary">Uptime</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-brand mb-2">24/7</div>
                            <div className="homepage-small text-text-secondary">Support</div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
