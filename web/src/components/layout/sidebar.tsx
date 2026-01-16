"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Rocket,
    Settings,
    Shield,
    Menu,
    Users,
    Server,
    FileText,
    Ticket,
    DollarSign,
    BookTemplate,
    CreditCard,
    Bell,
    ChevronDown,
    ChevronRight,
    User,
    Cloud,
    Key,
    Zap,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { UserButton } from "@clerk/nextjs";
import { useSettings } from "@/contexts/settings-context";

interface SubmenuItem {
    name: string;
    href: string;
    icon: any;
    badge?: string;
}

interface NavigationItem {
    name: string;
    href: string;
    icon: any;
    submenu?: SubmenuItem[];
}

const settingsSubmenu: SubmenuItem[] = [
    { name: "General", href: "/settings", icon: User },
    { name: "Organizations", href: "/settings/organizations", icon: Users },
    { name: "Providers", href: "/settings/providers", icon: Cloud },
    { name: "API Keys", href: "/settings/api-keys", icon: Key },
    { name: "Automation", href: "/settings/automation", icon: Zap },
    { name: "Advanced Automation", href: "/settings/advanced-automation", icon: Sparkles, badge: "New" },
    { name: "Notifications", href: "/settings/notifications", icon: Bell },
    { name: "Templates", href: "/settings/templates", icon: BookTemplate },
    // Subscription removed - migrating to License system
];

const navigation: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Deployments", href: "/deploy", icon: Server },
    { name: "New Deployment", href: "/deploy/new", icon: Rocket },
    { name: "Costs", href: "/costs", icon: DollarSign },
    { name: "Support", href: "/tickets", icon: Ticket },
    { name: "Settings", href: "/settings", icon: Settings, submenu: settingsSubmenu },
];

const adminNavigation: NavigationItem[] = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Deployments", href: "/admin/deployments", icon: Server },
    { name: "Tickets", href: "/admin/tickets", icon: Ticket },
    { name: "Audit Logs", href: "/admin/audit", icon: FileText },
    { name: "Providers", href: "/admin/providers", icon: Shield },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
    className?: string;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith("/admin");
    const { getSetting } = useSettings();
    const platformName = getSetting("platform_name", "ComputeHub");
    const [mounted, setMounted] = useState(false);
    const [settingsExpanded, setSettingsExpanded] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Auto-expand Settings if we're on a settings page
        if (pathname?.startsWith("/settings")) {
            setSettingsExpanded(true);
        }
    }, [pathname]);

    const currentNav = isAdminRoute ? adminNavigation : navigation;

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/deploy" className="flex items-center gap-2" onClick={onNavigate}>
                    <Rocket className="h-6 w-6 text-brand" />
                    <span className="text-xl font-bold">{platformName}</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {currentNav.map((item) => {
                    const isActive = pathname === item.href;
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isSettingsSection = pathname?.startsWith("/settings") && item.name === "Settings";

                    if (hasSubmenu) {
                        return (
                            <div key={item.name}>
                                {/* Main Settings Item */}
                                <button
                                    onClick={() => setSettingsExpanded(!settingsExpanded)}
                                    className={cn(
                                        "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        isSettingsSection
                                            ? "bg-cream-100 text-text-primary"
                                            : "text-text-secondary hover:bg-cream-50 hover:text-text-primary"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className="h-5 w-5" />
                                        {item.name}
                                    </div>
                                    {settingsExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </button>

                                {/* Submenu */}
                                {settingsExpanded && item.submenu && (
                                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-cream-200 pl-2">
                                        {item.submenu.map((subItem) => {
                                            const isSubActive = pathname === subItem.href;
                                            const SubIcon = subItem.icon;

                                            return (
                                                <Link
                                                    key={subItem.name}
                                                    href={subItem.href}
                                                    onClick={onNavigate}
                                                    className={cn(
                                                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors relative",
                                                        isSubActive
                                                            ? "bg-cream-100 text-text-primary font-medium"
                                                            : "text-text-secondary hover:bg-cream-50 hover:text-text-primary"
                                                    )}
                                                >
                                                    <SubIcon className="h-4 w-4" />
                                                    <span className="flex-1">{subItem.name}</span>
                                                    {subItem.badge && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-500 text-white rounded">
                                                            {subItem.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-cream-100 text-text-primary"
                                    : "text-text-secondary hover:bg-cream-50 hover:text-text-primary"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
                <div className="flex items-center gap-3">
                    {mounted && <UserButton afterSignOutUrl="/" />}
                    <div className="flex-1 text-sm text-text-secondary">
                        © 2024 {platformName}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Sidebar({ className }: SidebarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { getSetting } = useSettings();
    const platformName = getSetting("platform_name", "ComputeHub");

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={cn("hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col", className)}>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6">
                    <SidebarContent />
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-background px-4 py-4 shadow-sm sm:px-6 lg:hidden border-b">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="-m-2.5">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Open sidebar</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <VisuallyHidden>
                            <SheetTitle>Navigation Menu</SheetTitle>
                        </VisuallyHidden>
                        <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
                    </SheetContent>
                </Sheet>
                <div className="flex-1 text-sm font-semibold leading-6">
                    {platformName}
                </div>
                {mounted && <UserButton afterSignOutUrl="/" />}
            </div>
        </>
    );
}
