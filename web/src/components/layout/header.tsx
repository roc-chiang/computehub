"use client";

import dynamic from "next/dynamic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { OrganizationSwitcher } from "@/components/organizations/organization-switcher";

// Dynamically import UserButton with SSR disabled to prevent hydration errors
const UserButtonWrapper = dynamic(
    () => import("@/components/layout/user-button-wrapper").then(mod => mod.UserButtonWrapper),
    { ssr: false }
);

export function Header() {
    return (
        <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-6">
            <div className="flex-1 flex items-center gap-4">
                <h2 className="text-sm font-medium text-muted-foreground">Console</h2>
                <OrganizationSwitcher />
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Bell className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-4">
                    <UserButtonWrapper />
                </div>
            </div>
        </header>
    );
}
