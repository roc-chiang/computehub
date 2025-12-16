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
                        Last updated: December 7, 2024
                    </p>

                    <div className="prose prose-slate max-w-none space-y-8">
                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">1. Acceptance of Terms</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                By accessing and using ComputeHub's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">2. Use of Service</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                ComputeHub provides GPU compute aggregation services. You agree to use the service only for lawful purposes and in accordance with these Terms.
                            </p>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                You agree not to use the service:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2 mt-2">
                                <li>In any way that violates any applicable law or regulation</li>
                                <li>To transmit any harmful or malicious code</li>
                                <li>To engage in cryptocurrency mining without explicit permission</li>
                                <li>To attempt to gain unauthorized access to our systems</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">3. Account Responsibilities</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">4. Billing and Payment</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                You agree to pay all fees associated with your use of the service. Fees are billed based on actual usage and are subject to change with notice. All payments are non-refundable unless otherwise stated.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">5. Service Availability</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                While we strive for high availability, we do not guarantee uninterrupted access to our services. We reserve the right to modify, suspend, or discontinue any part of the service at any time.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">6. Limitation of Liability</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                ComputeHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">7. Changes to Terms</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">8. Contact</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                If you have any questions about these Terms, please contact us at legal@computehub.com
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
