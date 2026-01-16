import { LandingHeader } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col bg-cream-50 text-text-primary">
            <LandingHeader />

            <main className="flex-1 pt-24 pb-16">
                <div className="container px-4 md:px-6 max-w-4xl mx-auto">
                    <h1 className="homepage-h1 md:homepage-h1 homepage-h1-mobile tracking-tight mb-4">
                        Privacy Policy
                    </h1>
                    <p className="homepage-body text-text-secondary mb-8">
                        Last updated: January 16, 2026
                    </p>

                    <div className="prose prose-slate max-w-none space-y-8">
                        <section className="bg-brand-light border-2 border-brand/20 rounded-lg p-6 mb-8">
                            <h2 className="homepage-h3 text-brand mb-4">🔒 Self-Hosted = Your Data, Your Control</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                ComputeHub is an <strong>open-source, self-hosted</strong> platform. When you deploy ComputeHub on your own infrastructure,
                                <strong> all your data stays on your servers</strong>. We (the ComputeHub project maintainers) do not collect, store, or have access to your deployment data,
                                configurations, or usage information.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">1. What This Policy Covers</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                This Privacy Policy applies to:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li><strong>ComputeHub.com website</strong>: Information collected when you visit our project website</li>
                                <li><strong>Pro License purchases</strong>: Information collected when you purchase a Pro License via Gumroad</li>
                                <li><strong>GitHub repository</strong>: Public contributions and interactions</li>
                            </ul>
                            <p className="homepage-body text-text-secondary leading-relaxed mt-4">
                                <strong>This policy does NOT cover your self-hosted instance</strong> — that data is entirely under your control.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">2. Information We Collect</h2>

                            <h3 className="homepage-h3 text-text-primary mb-3 mt-4">2.1 Website Visitors</h3>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-2">
                                When you visit ComputeHub.com, we may collect:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li>Basic analytics (page views, referrers, browser type)</li>
                                <li>Cookies for session management</li>
                            </ul>

                            <h3 className="homepage-h3 text-text-primary mb-3 mt-4">2.2 Pro License Purchasers</h3>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-2">
                                When you purchase a Pro License via Gumroad, we collect:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li>Email address (for license key delivery)</li>
                                <li>Payment information (processed by Gumroad, not stored by us)</li>
                                <li>License key and activation status</li>
                            </ul>

                            <h3 className="homepage-h3 text-text-primary mb-3 mt-4">2.3 GitHub Contributors</h3>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-2">
                                If you contribute to ComputeHub on GitHub:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li>Your GitHub username and public profile information</li>
                                <li>Contribution history (commits, issues, pull requests)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">3. How We Use Your Information</h2>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li><strong>License delivery</strong>: Send Pro License keys to purchasers</li>
                                <li><strong>Support</strong>: Respond to questions and provide assistance</li>
                                <li><strong>Analytics</strong>: Understand how our website is used to improve it</li>
                                <li><strong>Project development</strong>: Manage contributions and community interactions</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">4. Information Sharing</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                We do not sell your personal information. We may share information with:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li><strong>Gumroad</strong>: Payment processing for Pro Licenses</li>
                                <li><strong>GitHub</strong>: Public contributions are visible on GitHub</li>
                                <li><strong>Law enforcement</strong>: When required by law</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">5. Your Self-Hosted Data</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                When you self-host ComputeHub:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li><strong>You own all data</strong>: Deployment configs, logs, user data, etc.</li>
                                <li><strong>No telemetry</strong>: ComputeHub does not send usage data to us</li>
                                <li><strong>Your responsibility</strong>: You control data retention, backups, and security</li>
                                <li><strong>Third-party providers</strong>: Your cloud provider API keys and data are stored locally</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">6. Data Security</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                We implement appropriate security measures to protect the limited data we collect (email addresses, license keys).
                                However, no method of transmission over the Internet is 100% secure. For your self-hosted instance,
                                security is your responsibility.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">7. Your Rights</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                You have the right to:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li>Request a copy of your data (email, license info)</li>
                                <li>Request deletion of your data</li>
                                <li>Opt out of marketing communications</li>
                                <li>Revoke your Pro License (no refund after 14 days)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">8. Cookies</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                Our website uses minimal cookies for session management and analytics. You can disable cookies in your browser settings,
                                though this may affect website functionality.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">9. Changes to This Policy</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date.
                                For significant changes, we will notify Pro License holders via email.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">10. Contact Us</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                If you have questions about this Privacy Policy, please contact us at:
                            </p>
                            <ul className="list-none homepage-body text-text-secondary space-y-2 mt-2">
                                <li><strong>Email</strong>: privacy@computehub.com</li>
                                <li><strong>GitHub</strong>: <a href="https://github.com/roc-chiang/computehub/issues" className="text-brand hover:underline">Open an issue</a></li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
