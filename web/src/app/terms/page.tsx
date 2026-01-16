import { LandingHeader } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function TermsPage() {
    return (
        <div className="flex min-h-screen flex-col bg-cream-50 text-text-primary">
            <LandingHeader />

            <main className="flex-1 pt-24 pb-16">
                <div className="container px-4 md:px-6 max-w-4xl mx-auto">
                    <h1 className="homepage-h1 md:homepage-h1 homepage-h1-mobile tracking-tight mb-4">
                        Terms of Service
                    </h1>
                    <p className="homepage-body text-text-secondary mb-8">
                        Last updated: January 16, 2026
                    </p>

                    <div className="prose prose-slate max-w-none space-y-8">
                        <section className="bg-brand-light border-2 border-brand/20 rounded-lg p-6 mb-8">
                            <h2 className="homepage-h3 text-brand mb-4">📜 Open Source License</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                ComputeHub is released under the <strong>MIT License</strong>. You are free to use, modify, and distribute the software.
                                The Pro License is an <strong>optional add-on</strong> that unlocks additional features in your self-hosted instance.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">1. Acceptance of Terms</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                By using ComputeHub (the open-source software, website, or purchasing a Pro License), you agree to these Terms of Service.
                                If you do not agree, please do not use ComputeHub.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">2. Open Source Software</h2>

                            <h3 className="homepage-h3 text-text-primary mb-3 mt-4">2.1 MIT License</h3>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                ComputeHub's core software is licensed under the MIT License. You may:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li>Use it for any purpose (personal, commercial, etc.)</li>
                                <li>Modify and create derivative works</li>
                                <li>Distribute copies</li>
                                <li>Sublicense it</li>
                            </ul>

                            <h3 className="homepage-h3 text-text-primary mb-3 mt-4">2.2 No Warranty</h3>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                ComputeHub is provided "AS IS", without warranty of any kind. We do not guarantee that the software will be error-free,
                                secure, or suitable for your specific use case.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">3. Pro License</h2>

                            <h3 className="homepage-h3 text-text-primary mb-3 mt-4">3.1 What You Get</h3>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                The Pro License ($49 one-time payment) unlocks:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li>Automation engine (auto-restart, cost limits, rules)</li>
                                <li>Notification system (Email, Telegram, Webhooks)</li>
                                <li>Advanced monitoring and batch operations</li>
                                <li>Email support</li>
                                <li>All future updates to Pro features</li>
                            </ul>

                            <h3 className="homepage-h3 text-text-primary mb-3 mt-4">3.2 License Terms</h3>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li><strong>One-time payment</strong>: No recurring fees</li>
                                <li><strong>Lifetime access</strong>: Valid for all future versions</li>
                                <li><strong>Single instance</strong>: One license per self-hosted instance</li>
                                <li><strong>Non-transferable</strong>: Cannot be resold or transferred</li>
                                <li><strong>Revocable</strong>: We reserve the right to revoke licenses for abuse</li>
                            </ul>

                            <h3 className="homepage-h3 text-text-primary mb-3 mt-4">3.3 Refund Policy</h3>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                Pro Licenses are sold "as is" with no SLA. However, if you're not satisfied within <strong>14 days of purchase</strong>,
                                contact us for a refund. After 14 days, all sales are final.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">4. Self-Hosted Deployment</h2>

                            <h3 className="homepage-h3 text-text-primary mb-3 mt-4">4.1 Your Responsibility</h3>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                When you self-host ComputeHub, you are responsible for:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li>Infrastructure costs (servers, databases, etc.)</li>
                                <li>Security and data protection</li>
                                <li>Compliance with applicable laws</li>
                                <li>Backups and disaster recovery</li>
                                <li>Managing your cloud provider API keys</li>
                            </ul>

                            <h3 className="homepage-h3 text-text-primary mb-3 mt-4">4.2 Third-Party Services</h3>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                ComputeHub integrates with third-party cloud providers (RunPod, Vast.ai, etc.).
                                You are responsible for complying with their terms of service and managing your accounts with them.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">5. Acceptable Use</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                You agree not to use ComputeHub to:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li>Violate any applicable laws or regulations</li>
                                <li>Infringe on intellectual property rights</li>
                                <li>Transmit malware or harmful code</li>
                                <li>Engage in unauthorized cryptocurrency mining (without provider permission)</li>
                                <li>Attempt to reverse-engineer the Pro License validation system</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">6. Support</h2>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li><strong>Free users</strong>: Community support via GitHub Issues</li>
                                <li><strong>Pro users</strong>: Email support (best effort, no SLA)</li>
                                <li><strong>Consulting</strong>: Available for custom deployments (paid separately)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">7. Limitation of Liability</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                ComputeHub and its maintainers shall not be liable for any indirect, incidental, special, consequential,
                                or punitive damages resulting from your use of the software, including but not limited to:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2 mt-2">
                                <li>Data loss or corruption</li>
                                <li>Cloud provider charges or billing issues</li>
                                <li>Service interruptions or downtime</li>
                                <li>Security breaches in your self-hosted instance</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">8. Indemnification</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                You agree to indemnify and hold harmless ComputeHub and its contributors from any claims, damages, or expenses
                                arising from your use of the software or violation of these Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">9. Changes to Terms</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                We may update these Terms from time to time. Changes will be posted on this page with an updated "Last updated" date.
                                Continued use of ComputeHub after changes constitutes acceptance of the new Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">10. Governing Law</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                These Terms are governed by the laws of [Your Jurisdiction]. Any disputes shall be resolved in the courts of [Your Jurisdiction].
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">11. Contact</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                If you have questions about these Terms, please contact us at:
                            </p>
                            <ul className="list-none homepage-body text-text-secondary space-y-2 mt-2">
                                <li><strong>Email</strong>: legal@computehub.com</li>
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
