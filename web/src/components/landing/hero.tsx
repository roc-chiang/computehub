import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
            {/* Background Gradients - 使用新的品牌色 */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-light/30 via-cream-50 to-cream-50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-brand/10 blur-[100px] rounded-full -z-10" />

            <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-8">
                <Badge variant="secondary" className="px-4 py-2 text-sm rounded-full border-brand/20 bg-brand-light text-brand-dark hover:bg-brand-light/80 transition-colors">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Now supporting NVIDIA H100 Clusters
                </Badge>

                <h1 className="homepage-h1 md:homepage-h1 homepage-h1-mobile bg-clip-text text-transparent bg-gradient-to-b from-text-primary to-text-primary/60">
                    Compute without <br />
                    <span className="text-brand">Boundaries.</span>
                </h1>

                <p className="homepage-body text-text-secondary md:text-2xl leading-relaxed">
                    Access a global network of high-performance GPUs.
                    Deploy AI models, training jobs, and rendering tasks in seconds.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
                    <Link href="/deploy">
                        <Button size="lg" className="w-full sm:w-auto homepage-button-primary px-8 h-12 bg-brand hover:bg-brand-dark text-white">
                            Start Deploying <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href="/docs">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto homepage-button-secondary px-8 h-12 border-brand text-brand bg-cream-50 hover:bg-brand hover:text-white transition-colors">
                            View Documentation
                        </Button>
                    </Link>
                </div>

                {/* Social Proof / Trusted By */}
                <div className="pt-12 homepage-small text-text-secondary">
                    <p className="mb-4">Trusted by AI teams at</p>
                    <div className="flex gap-8 items-center justify-center opacity-60 hover:opacity-100 transition-all duration-500">
                        {/* Placeholders for logos */}
                        <span className="font-bold text-lg text-text-primary">ACME AI</span>
                        <span className="font-bold text-lg text-text-primary">NeuroTech</span>
                        <span className="font-bold text-lg text-text-primary">TensorFlow</span>
                        <span className="font-bold text-lg text-text-primary">PyTorch</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
