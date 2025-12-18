"use client";

import { LandingHeader } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { About } from "@/components/landing/about";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col bg-cream-50 text-text-primary selection:bg-brand/20">
            <LandingHeader />

            <main className="flex-1">
                <Hero />
                <About />
                <Features />
                <Pricing />
            </main>

            <Footer />
        </div>
    );
}
