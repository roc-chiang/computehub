"use client";

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

import { UserButton } from "@clerk/nextjs";

export function Header() {
    return (
        <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-6">
            <div className="flex-1">
                {/* Breadcrumbs or Page Title could go here */}
                <h2 className="text-sm font-medium text-muted-foreground">Console</h2>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Bell className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-4">
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </header>
    );
}
