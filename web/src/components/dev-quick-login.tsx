// Quick login component for development
"use client";

import { useState } from "react";
import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, CheckCircle } from "lucide-react";
import { useRole } from "@/hooks/useRole";

export function DevQuickLogin() {
    const [show, setShow] = useState(false);
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const { role, isAdmin } = useRole();

    // Only show in development
    if (process.env.NODE_ENV !== "development") {
        return null;
    }

    if (!isLoaded) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {!show ? (
                <Button
                    onClick={() => setShow(true)}
                    size="sm"
                    variant="outline"
                    className={
                        isSignedIn
                            ? "bg-green-500/10 border-green-500/50 text-green-500 hover:bg-green-500/20"
                            : "bg-yellow-500/10 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/20"
                    }
                >
                    {isSignedIn ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                        <UserCircle className="h-4 w-4 mr-2" />
                    )}
                    Dev {isSignedIn ? "Info" : "Login"}
                </Button>
            ) : (
                <Card className="w-80 bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm">
                            {isSignedIn ? "User Info (Dev)" : "Quick Login (Dev)"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Development mode {isSignedIn ? "information" : "shortcut"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {!isSignedIn ? (
                            <>
                                <SignInButton mode="modal">
                                    <Button className="w-full" size="sm">
                                        Sign In / Sign Up
                                    </Button>
                                </SignInButton>
                                <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                                    Admin: gujian8@gmail.com
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Email:</span>
                                        <span className="text-zinc-300">{user?.primaryEmailAddress?.emailAddress}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Role:</span>
                                        <span className={isAdmin ? "text-green-400" : "text-zinc-300"}>
                                            {role || "user"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Admin:</span>
                                        <span className={isAdmin ? "text-green-400" : "text-zinc-500"}>
                                            {isAdmin ? "Yes ✓" : "No"}
                                        </span>
                                    </div>
                                </div>
                                {!isAdmin && (
                                    <div className="text-xs text-yellow-500 pt-2 border-t border-zinc-800">
                                        ⚠️ Not admin - cannot access /admin
                                    </div>
                                )}
                            </>
                        )}
                        <Button
                            onClick={() => setShow(false)}
                            variant="ghost"
                            size="sm"
                            className="w-full"
                        >
                            Close
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
