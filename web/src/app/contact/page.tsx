import { LandingHeader } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ContactPage() {
    return (
        <div className="flex min-h-screen flex-col bg-cream-50 text-text-primary">
            <LandingHeader />

            <main className="flex-1 pt-24 pb-16">
                <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="homepage-h1 md:homepage-h1 homepage-h1-mobile tracking-tight mb-4">
                            Get in Touch
                        </h1>
                        <p className="homepage-body text-text-secondary max-w-2xl mx-auto">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Your name"
                                    className="mt-2 bg-cream-100 border-cream-200"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    className="mt-2 bg-cream-100 border-cream-200"
                                />
                            </div>
                            <div>
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="How can we help?"
                                    className="mt-2 bg-cream-100 border-cream-200"
                                />
                            </div>
                            <div>
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Tell us more..."
                                    rows={6}
                                    className="mt-2 bg-cream-100 border-cream-200"
                                />
                            </div>
                            <Button className="w-full bg-brand hover:bg-brand-dark text-white">
                                Send Message
                            </Button>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="homepage-h2 text-text-primary mb-6">Contact Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <Mail className="h-6 w-6 text-brand mt-1" />
                                        <div>
                                            <h3 className="homepage-h4 text-text-primary mb-1">Email</h3>
                                            <p className="homepage-body text-text-secondary">support@computehub.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Phone className="h-6 w-6 text-brand mt-1" />
                                        <div>
                                            <h3 className="homepage-h4 text-text-primary mb-1">Phone</h3>
                                            <p className="homepage-body text-text-secondary">+1 (555) 123-4567</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <MapPin className="h-6 w-6 text-brand mt-1" />
                                        <div>
                                            <h3 className="homepage-h4 text-text-primary mb-1">Office</h3>
                                            <p className="homepage-body text-text-secondary">
                                                123 Tech Street<br />
                                                San Francisco, CA 94105<br />
                                                United States
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-cream-100 rounded-lg border border-cream-200">
                                <h3 className="homepage-h4 text-text-primary mb-2">Support Hours</h3>
                                <p className="homepage-small text-text-secondary">
                                    Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                                    Saturday - Sunday: Closed
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
