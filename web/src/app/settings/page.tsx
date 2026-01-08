"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, updateUserPreferences, type UserProfile, type UserPreferences } from "@/lib/user-profile-api";

export default function GeneralSettingsPage() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences>({
        language: "en",
        timezone: "UTC",
        default_gpu_type: null,
        default_provider: null,
        theme: "light",
    });

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchProfile();
        }
    }, [isLoaded, isSignedIn]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const data = await getUserProfile(token);
            setProfile(data);
            setPreferences(data.preferences);
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            toast({
                title: "Error",
                description: "Failed to load profile",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            const updated = await updateUserPreferences(token, preferences);
            setPreferences(updated);
            toast({
                title: "Success",
                description: "Preferences saved successfully",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save preferences",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                        Your account information from Clerk Auth
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user?.imageUrl} alt={user?.fullName || user?.primaryEmailAddress?.emailAddress || ""} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">
                                {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {user?.primaryEmailAddress?.emailAddress}
                            </p>
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground">User ID</Label>
                            <p className="text-sm">{user?.id}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Account Created</Label>
                            <p className="text-sm">
                                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Subscription Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription</CardTitle>
                    <CardDescription>
                        Your current plan and billing information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium capitalize">
                                {profile?.plan || "Free"} Plan
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {profile?.plan === "free" ? "1 Provider binding" : "Unlimited providers"}
                            </p>
                        </div>
                        <Button asChild>
                            <Link href="/settings/subscription">Upgrade</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* User Preferences Card */}
            <Card>
                <CardHeader>
                    <CardTitle>User Preferences</CardTitle>
                    <CardDescription>
                        Customize your experience
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Language */}
                    <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select
                            value={preferences.language}
                            onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                        >
                            <SelectTrigger id="language">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="zh">中文</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                            value={preferences.timezone}
                            onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                        >
                            <SelectTrigger id="timezone">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                <SelectItem value="Asia/Shanghai">China Standard Time (CST)</SelectItem>
                                <SelectItem value="Europe/London">British Time (GMT)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Default GPU Type */}
                    <div className="space-y-2">
                        <Label htmlFor="default-gpu">Default GPU Type</Label>
                        <Select
                            value={preferences.default_gpu_type || "none"}
                            onValueChange={(value) => setPreferences({ ...preferences, default_gpu_type: value === "none" ? null : value })}
                        >
                            <SelectTrigger id="default-gpu">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No default</SelectItem>
                                <SelectItem value="RTX 4090">RTX 4090</SelectItem>
                                <SelectItem value="A100">A100</SelectItem>
                                <SelectItem value="H100">H100</SelectItem>
                                <SelectItem value="A6000">A6000</SelectItem>
                                <SelectItem value="L40S">L40S</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Default Provider */}
                    <div className="space-y-2">
                        <Label htmlFor="default-provider">Default Cloud Provider</Label>
                        <Select
                            value={preferences.default_provider || "none"}
                            onValueChange={(value) => setPreferences({ ...preferences, default_provider: value === "none" ? null : value })}
                        >
                            <SelectTrigger id="default-provider">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No default</SelectItem>
                                <SelectItem value="runpod">RunPod</SelectItem>
                                <SelectItem value="vast">Vast.ai</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Theme */}
                    <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select
                            value={preferences.theme}
                            onValueChange={(value) => setPreferences({ ...preferences, theme: value })}
                        >
                            <SelectTrigger id="theme">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="auto">Auto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Save Button */}
                    <Button onClick={handleSavePreferences} disabled={saving} className="w-full">
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Preferences
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
