"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/settings-context";
import { useAuth } from "@clerk/nextjs";

const navigation = [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/#pricing" },
    { name: "GPU Prices", href: "/gpu-prices" },
    { name: "Docs", href: "/docs" },
    { name: "About", href: "/about" },
];

export function LandingHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const { getSetting } = useSettings();
    const platformName = getSetting("platform_name", "ComputeHub");
    const { isSignedIn, isLoaded } = useAuth();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        // If clicking on a link to the current page (except home), go to home instead
        if (pathname === href && href !== "/") {
            e.preventDefault();
            window.location.href = "/";
            setMobileMenuOpen(false);
            return;
        }

        // Handle smooth scroll for anchor links on home page
        if (href.startsWith("/#")) {
            // If not on home page, let the link navigate normally
            if (pathname !== "/") {
                return;
            }

            e.preventDefault();
            const id = href.substring(2);
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
                setMobileMenuOpen(false);
            }
        }
    };

    return (
        <header className="fixed top-0 w-full z-50 border-b border-cream-200 bg-cream-50/80 backdrop-blur-xl">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter text-text-primary">
                    <Cpu className="h-6 w-6 text-brand" />
                    <span>{platformName}</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex gap-6 text-sm font-medium text-text-secondary">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={(e) => handleSmoothScroll(e, item.href)}
                            className={cn(
                                "hover:text-brand transition-colors",
                                pathname === item.href && "text-brand font-semibold"
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {mounted && isLoaded && (
                        <>
                            {!isSignedIn ? (
                                <>
                                    <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-brand">
                                        Log in
                                    </Link>
                                    <Link href="/login">
                                        <Button size="sm" className="bg-brand text-white hover:bg-brand-dark">
                                            Get Started
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <Link href="/deploy">
                                    <Button size="sm" className="bg-brand text-white hover:bg-brand-dark">
                                        Dashboard
                                    </Button>
                                </Link>
                            )}
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild className="md:hidden">
                        <Button variant="ghost" size="icon" className="text-text-primary">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] bg-cream-100 border-cream-200">
                        <VisuallyHidden>
                            <SheetTitle>Navigation Menu</SheetTitle>
                        </VisuallyHidden>
                        <div className="flex flex-col gap-6 mt-8">
                            {/* Mobile Navigation Links */}
                            <nav className="flex flex-col gap-4">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => handleSmoothScroll(e, item.href)}
                                        className={cn(
                                            "text-lg font-medium text-text-secondary hover:text-brand transition-colors",
                                            pathname === item.href && "text-brand font-semibold"
                                        )}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>

                            {/* Mobile Actions */}
                            <div className="flex flex-col gap-3 pt-6 border-t border-cream-200">
                                {mounted && isLoaded && (
                                    <>
                                        {!isSignedIn ? (
                                            <>
                                                <Link href="/login">
                                                    <Button variant="outline" className="w-full border-cream-200 hover:bg-cream-50">
                                                        Log in
                                                    </Button>
                                                </Link>
                                                <Link href="/login">
                                                    <Button className="w-full bg-brand text-white hover:bg-brand-dark">
                                                        Get Started
                                                    </Button>
                                                </Link>
                                            </>
                                        ) : (
                                            <Link href="/deploy">
                                                <Button className="w-full bg-brand text-white hover:bg-brand-dark">
                                                    Dashboard
                                                </Button>
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
