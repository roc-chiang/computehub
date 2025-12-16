"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeys } from "@/components/settings/api-keys";
import { ProviderBindings } from "@/components/settings/provider-bindings";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
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
                    <div className="p-4 border rounded-lg bg-muted/10">
                        <h4 className="font-medium mb-2">Profile Information</h4>
                        <p className="text-sm text-muted-foreground">
                            This is a demo environment. Profile settings are read-only.
                        </p>
                    </div>
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
