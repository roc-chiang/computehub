import { LandingHeader } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Target, Users, Zap, Shield, Github } from "lucide-react";

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
                            Open-source GPU management platform for multi-cloud deployments
                        </p>
                    </div>

                    {/* Mission */}
                    <div className="mb-16">
                        <h2 className="homepage-h2 text-text-primary mb-6">Our Mission</h2>
                        <p className="homepage-body text-text-secondary leading-relaxed">
                            ComputeHub makes it easy to deploy and manage GPU instances across multiple cloud providers.
                            As an open-source platform, we believe in transparency, user control, and building tools that
                            solve real problems without vendor lock-in.
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
                                    <h3 className="homepage-h4 text-text-primary mb-2">Open Source First</h3>
                                    <p className="homepage-body text-text-secondary">
                                        100% open-source, self-hosted, and transparent. Your data, your control.
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
                                    <h3 className="homepage-h4 text-text-primary mb-2">Simplicity</h3>
                                    <p className="homepage-body text-text-secondary">
                                        Deploy GPUs in minutes, not hours. Manage everything from one dashboard.
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
                                        Built by developers, for developers. Contributions welcome.
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
                                    <h3 className="homepage-h4 text-text-primary mb-2">No Lock-In</h3>
                                    <p className="homepage-body text-text-secondary">
                                        Use your own cloud provider accounts. Switch providers anytime.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Our Story */}
                    <div className="mb-16 bg-gradient-to-br from-brand-light to-cream-50 border-2 border-brand/20 rounded-2xl p-8 md:p-12">
                        <h2 className="homepage-h2 text-text-primary mb-6 text-center">Our Story</h2>

                        <div className="space-y-6">
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                ComputeHub was created by <span className="text-text-primary font-semibold">roc-chiang</span>,
                                a technology enthusiast with diverse experience across gaming, smart hardware, blockchain infrastructure,
                                and 3D digital humans. As a product and operations architect, he has witnessed the evolution of
                                cutting-edge technologies from multiple angles.
                            </p>

                            <div className="flex items-center justify-center gap-4 py-4">
                                <a
                                    href="https://github.com/roc-chiang"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-brand/20 bg-cream-50 hover:bg-brand hover:text-white transition-colors font-medium"
                                >
                                    <Github className="h-5 w-5" />
                                    <span>GitHub</span>
                                </a>
                                <a
                                    href="https://x.com/rocchiang1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-brand/20 bg-cream-50 hover:bg-brand hover:text-white transition-colors font-medium"
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    <span>X/Twitter</span>
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/pengjiang8/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-brand/20 bg-cream-50 hover:bg-brand hover:text-white transition-colors font-medium"
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    <span>LinkedIn</span>
                                </a>
                            </div>

                            <blockquote className="border-l-4 border-brand pl-6 py-2 italic text-text-secondary">
                                "An idealistic thinker and a pragmatic doer — holding the line in compromise,
                                staying flexible in persistence."
                            </blockquote>

                            <p className="homepage-body text-text-secondary leading-relaxed">
                                After managing GPU deployments across multiple projects — from AI training to 3D rendering —
                                the pain points became crystal clear: fragmented dashboards, manual cost tracking,
                                forgotten instances burning money, and lack of automation.
                            </p>

                            <p className="homepage-body text-text-secondary leading-relaxed">
                                ComputeHub was born to solve these problems — not as another SaaS product with recurring fees,
                                but as an <span className="text-text-primary font-semibold">open-source tool</span> that anyone can
                                self-host, modify, and improve. The project embraces the philosophy of
                                <span className="text-text-primary font-semibold"> building in public</span> and
                                <span className="text-text-primary font-semibold"> long-term value creation</span>.
                            </p>

                            <p className="homepage-body text-text-secondary leading-relaxed">
                                Free forever, with optional Pro features for those who need advanced automation.
                                No vendor lock-in, no data collection, no subscription traps. Just a tool that works.
                            </p>
                        </div>
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-cream-100 rounded-lg border border-cream-200">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-brand mb-2">100%</div>
                            <div className="homepage-small text-text-secondary">Open Source</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-brand mb-2">$0</div>
                            <div className="homepage-small text-text-secondary">Core Features</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-brand mb-2">$49</div>
                            <div className="homepage-small text-text-secondary">Pro (Lifetime)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-brand mb-2">MIT</div>
                            <div className="homepage-small text-text-secondary">License</div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
