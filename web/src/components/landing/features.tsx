import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Globe, Cpu, Shield, Clock, Code2 } from "lucide-react";

const features = [
    {
        title: "Instant Provisioning",
        description: "Spin up H100s and A100s in less than 60 seconds. No waiting in queues.",
        icon: Zap,
        color: "text-accent-warm",
    },
    {
        title: "Global Availability",
        description: "Aggregated supply from top providers ensuring you always get compute.",
        icon: Globe,
        color: "text-brand",
    },
    {
        title: "Unified API",
        description: "One interface to rule them all. Switch providers without changing code.",
        icon: Code2,
        color: "text-brand-dark",
    },
    {
        title: "Secure by Design",
        description: "End-to-end encryption and isolated environments for your sensitive workloads.",
        icon: Shield,
        color: "text-accent-success",
    },
    {
        title: "Pay as you Go",
        description: "No long-term contracts. Billed by the second. Stop anytime.",
        icon: Clock,
        color: "text-brand",
    },
    {
        title: "Custom Images",
        description: "Bring your own Docker container or use our optimized pre-built images.",
        icon: Cpu,
        color: "text-brand-dark",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-cream-100 homepage-section-spacing">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="homepage-h2 md:homepage-h2 homepage-h2-mobile text-text-primary">
                        Everything you need to <br /> scale your AI.
                    </h2>
                    <p className="homepage-body text-text-secondary mx-auto">
                        Built for developers, researchers, and startups who need raw compute power without the cloud overhead.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <Card key={index} className="bg-cream-50 border-cream-200 hover:border-brand/30 hover:shadow-lg transition-all">
                            <CardHeader>
                                <feature.icon className={`h-10 w-10 mb-4 ${feature.color}`} />
                                <CardTitle className="homepage-h4 text-text-primary">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="homepage-small text-text-secondary leading-relaxed">
                                    {feature.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
