import Link from "next/link";
import { Cpu, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-cream-200 bg-cream-100 py-12">
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-text-primary">
                            <Cpu className="h-6 w-6 text-brand" />
                            <span>ComputeHub</span>
                        </Link>
                        <p className="homepage-small text-text-secondary">
                            The next generation GPU aggregation platform for AI and ML workloads.
                        </p>
                        <div className="flex gap-4">
                            <Link href="https://github.com/roc-chiang" target="_blank" className="text-text-secondary hover:text-brand transition-colors">
                                <Github className="h-5 w-5" />
                            </Link>
                            <Link href="https://x.com/rocchiang1" target="_blank" className="text-text-secondary hover:text-brand transition-colors">
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link href="https://www.linkedin.com/in/pengjiang8/" target="_blank" className="text-text-secondary hover:text-brand transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h3 className="homepage-h4 text-text-primary mb-4">Product</h3>
                        <ul className="space-y-2 homepage-small text-text-secondary">
                            <li><Link href="/#features" className="hover:text-brand transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-brand transition-colors">Pricing</Link></li>
                            <li><Link href="/docs" className="hover:text-brand transition-colors">Documentation</Link></li>
                            <li><Link href="/deploy" className="hover:text-brand transition-colors">Dashboard</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="homepage-h4 text-text-primary mb-4">Company</h3>
                        <ul className="space-y-2 homepage-small text-text-secondary">
                            <li><Link href="/about" className="hover:text-brand transition-colors">About</Link></li>
                            <li><Link href="/contact" className="hover:text-brand transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="homepage-h4 text-text-primary mb-4">Legal</h3>
                        <ul className="space-y-2 homepage-small text-text-secondary">
                            <li><Link href="/privacy" className="hover:text-brand transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-brand transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-cream-200 text-center homepage-small text-text-secondary">
                    © 2024 ComputeHub Inc. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
