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
                        Last updated: December 7, 2024
                    </p>

                    <div className="prose prose-slate max-w-none space-y-8">
                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">1. Information We Collect</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                We collect information that you provide directly to us, including:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li>Account information (name, email, password)</li>
                                <li>Payment information</li>
                                <li>Usage data and deployment configurations</li>
                                <li>Communications with our support team</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">2. How We Use Your Information</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li>Provide, maintain, and improve our services</li>
                                <li>Process transactions and send related information</li>
                                <li>Send technical notices and support messages</li>
                                <li>Respond to your comments and questions</li>
                                <li>Monitor and analyze trends and usage</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">3. Information Sharing</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                We do not sell your personal information. We may share your information with:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2 mt-2">
                                <li>Service providers who assist in our operations</li>
                                <li>Cloud infrastructure providers (RunPod, Vast.ai) for deployment purposes</li>
                                <li>Law enforcement when required by law</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">4. Data Security</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">5. Data Retention</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                We retain your information for as long as your account is active or as needed to provide you services. You may request deletion of your account at any time.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">6. Your Rights</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed mb-4">
                                You have the right to:
                            </p>
                            <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2">
                                <li>Access your personal information</li>
                                <li>Correct inaccurate data</li>
                                <li>Request deletion of your data</li>
                                <li>Object to processing of your data</li>
                                <li>Export your data</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">7. Cookies</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">8. Changes to Privacy Policy</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                            </p>
                        </section>

                        <section>
                            <h2 className="homepage-h2 text-text-primary mb-4">9. Contact Us</h2>
                            <p className="homepage-body text-text-secondary leading-relaxed">
                                If you have any questions about this Privacy Policy, please contact us at privacy@computehub.com
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
