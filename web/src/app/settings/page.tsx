"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ApiKeys } from "@/components/settings/api-keys";
import { ProviderBindings } from "@/components/settings/provider-bindings";
import { Bell, Cloud, Key, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, updateUserPreferences, type UserProfile, type UserPreferences } from "@/lib/user-profile-api";

export default function SettingsPage() {
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

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h3 className="text-3xl font-bold tracking-tight">Settings</h3>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>
            <Separator />

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="providers">Providers</TabsTrigger>
                    <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-brand" />
                        </div>
                    ) : (
                        <>
                            {/* Profile Information Card */}
                            <Card className="bg-cream-100 border-cream-200">
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
                                            <AvatarFallback className="bg-brand text-white text-xl">
                                                {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-text-primary">
                                                {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                                            </p>
                                            <p className="text-sm text-text-secondary">
                                                {user?.primaryEmailAddress?.emailAddress}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Account Details */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-text-secondary">User ID</Label>
                                            <p className="text-sm text-text-primary">{user?.id}</p>
                                        </div>
                                        <div>
                                            <Label className="text-text-secondary">Account Created</Label>
                                            <p className="text-sm text-text-primary">
                                                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Subscription Card */}
                            <Card className="bg-cream-100 border-cream-200">
                                <CardHeader>
                                    <CardTitle>Subscription</CardTitle>
                                    <CardDescription>
                                        Your current plan and billing information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-text-primary capitalize">
                                                {profile?.plan || "Free"} Plan
                                            </p>
                                            <p className="text-sm text-text-secondary">
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
                            <Card className="bg-cream-100 border-cream-200">
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

                            {/* Quick Links Card */}
                            <Card className="bg-cream-100 border-cream-200">
                                <CardHeader>
                                    <CardTitle>Quick Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <Link href="/settings/notifications">
                                            <Bell className="mr-2 h-4 w-4" />
                                            Notification Preferences
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <Link href="/settings/providers">
                                            <Cloud className="mr-2 h-4 w-4" />
                                            Cloud Providers
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <Link href="/settings/api-keys">
                                            <Key className="mr-2 h-4 w-4" />
                                            API Keys
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="providers" className="space-y-4">
                    <ProviderBindings />
                </TabsContent>

                <TabsContent value="api-keys" className="space-y-4">
                    <ApiKeys />
                </TabsContent>
            </Tabs>
        </div>
    );
}
