import { LandingHeader } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Book, Code, Rocket, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocsPage() {
    return (
        <div className="flex min-h-screen flex-col bg-cream-50 text-text-primary">
            <LandingHeader />

            <main className="flex-1 pt-24 pb-16">
                <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="homepage-h1 md:homepage-h1 homepage-h1-mobile tracking-tight mb-4">
                            Documentation
                        </h1>
                        <p className="homepage-body text-text-secondary max-w-2xl mx-auto">
                            Everything you need to get started with ComputeHub
                        </p>
                    </div>

                    {/* Quick Start */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        <Link href="#getting-started" className="p-6 bg-cream-100 rounded-lg border border-cream-200 hover:border-brand transition-colors">
                            <Rocket className="h-8 w-8 text-brand mb-4" />
                            <h3 className="homepage-h4 text-text-primary mb-2">Getting Started</h3>
                            <p className="homepage-small text-text-secondary">
                                Quick start guide to deploy your first GPU instance
                            </p>
                        </Link>

                        <Link href="#api" className="p-6 bg-cream-100 rounded-lg border border-cream-200 hover:border-brand transition-colors">
                            <Code className="h-8 w-8 text-brand mb-4" />
                            <h3 className="homepage-h4 text-text-primary mb-2">API Reference</h3>
                            <p className="homepage-small text-text-secondary">
                                Complete API documentation and examples
                            </p>
                        </Link>

                        <Link href="#guides" className="p-6 bg-cream-100 rounded-lg border border-cream-200 hover:border-brand transition-colors">
                            <Book className="h-8 w-8 text-brand mb-4" />
                            <h3 className="homepage-h4 text-text-primary mb-2">Guides</h3>
                            <p className="homepage-small text-text-secondary">
                                Step-by-step tutorials for common use cases
                            </p>
                        </Link>

                        <Link href="#examples" className="p-6 bg-cream-100 rounded-lg border border-cream-200 hover:border-brand transition-colors">
                            <Zap className="h-8 w-8 text-brand mb-4" />
                            <h3 className="homepage-h4 text-text-primary mb-2">Examples</h3>
                            <p className="homepage-small text-text-secondary">
                                Ready-to-use templates and code samples
                            </p>
                        </Link>
                    </div>

                    {/* Getting Started Section */}
                    <section id="getting-started" className="mb-16">
                        <h2 className="homepage-h2 text-text-primary mb-6">Getting Started</h2>
                        <div className="space-y-6">
                            <div className="p-6 bg-cream-100 rounded-lg border border-cream-200">
                                <h3 className="homepage-h3 text-text-primary mb-4">1. Create an Account</h3>
                                <p className="homepage-body text-text-secondary mb-4">
                                    Sign up for a free account to get started. No credit card required for the free tier.
                                </p>
                                <Link href="/deploy">
                                    <Button variant="outline">Sign Up Now</Button>
                                </Link>
                            </div>

                            <div className="p-6 bg-cream-100 rounded-lg border border-cream-200">
                                <h3 className="homepage-h3 text-text-primary mb-4">2. Configure Provider</h3>
                                <p className="homepage-body text-text-secondary mb-4">
                                    Add your preferred GPU provider (RunPod, Vast.ai) or use our local option for testing.
                                </p>
                                <pre className="bg-cream-50 p-4 rounded border border-cream-200 overflow-x-auto">
                                    <code className="text-sm text-accent-success">
                                        {`# Navigate to Admin > Providers
# Click "Add Provider"
# Enter your API key
# Save configuration`}
                                    </code>
                                </pre>
                            </div>

                            <div className="p-6 bg-cream-100 rounded-lg border border-cream-200">
                                <h3 className="homepage-h3 text-text-primary mb-4">3. Deploy Your First Instance</h3>
                                <p className="homepage-body text-text-secondary mb-4">
                                    Choose a template or configure a custom deployment with your preferred GPU.
                                </p>
                                <pre className="bg-cream-50 p-4 rounded border border-cream-200 overflow-x-auto">
                                    <code className="text-sm text-accent-success">
                                        {`# Go to Dashboard > New Deployment
# Select a template (e.g., PyTorch, TensorFlow)
# Choose GPU type (RTX 3090, A100, H100)
# Click "Deploy Instance"
# Wait for deployment to be ready (~30 seconds)`}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </section>

                    {/* API Reference */}
                    <section id="api" className="mb-16">
                        <h2 className="homepage-h2 text-text-primary mb-6">API Reference</h2>
                        <div className="p-6 bg-cream-100 rounded-lg border border-cream-200">
                            <h3 className="homepage-h3 text-text-primary mb-4">Authentication</h3>
                            <p className="homepage-body text-text-secondary mb-4">
                                All API requests require authentication using your API key.
                            </p>
                            <pre className="bg-cream-50 p-4 rounded border border-cream-200 overflow-x-auto">
                                <code className="text-sm text-accent-success">
                                    {`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.computehub.com/v1/deployments`}
                                </code>
                            </pre>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="mb-16">
                        <h2 className="homepage-h2 text-text-primary mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            <div className="p-6 bg-cream-100 rounded-lg border border-cream-200">
                                <h3 className="homepage-h4 text-text-primary mb-2">How much does it cost?</h3>
                                <p className="homepage-body text-text-secondary">
                                    We offer a free tier for testing. Production pricing starts at $0.24/hour for RTX 3090 GPUs. Check our pricing page for details.
                                </p>
                            </div>

                            <div className="p-6 bg-cream-100 rounded-lg border border-cream-200">
                                <h3 className="homepage-h4 text-text-primary mb-2">Which providers do you support?</h3>
                                <p className="homepage-body text-text-secondary">
                                    Currently we support RunPod, Vast.ai, and local deployments. More providers coming soon!
                                </p>
                            </div>

                            <div className="p-6 bg-cream-100 rounded-lg border border-cream-200">
                                <h3 className="homepage-h4 text-text-primary mb-2">Can I use my own Docker images?</h3>
                                <p className="homepage-body text-text-secondary">
                                    Yes! You can use any public Docker image or your own private images.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
