"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Plus, Settings2, Trash2, RefreshCw } from "lucide-react";
import { getSupportedProviders } from "@/lib/provider-instructions";
import { OnboardingWizard } from "@/components/providers/onboarding-wizard";
import { useToast } from "@/hooks/use-toast";

interface ProviderBinding {
    id: number;
    provider_type: string;
    display_name: string | null;
    is_active: boolean;
    last_verified: string | null;
    created_at: string;
    updated_at: string;
}

export default function ProvidersPage() {
    const [bindings, setBindings] = useState<ProviderBinding[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [wizardOpen, setWizardOpen] = useState(false);
    const { toast } = useToast();

    const supportedProviders = getSupportedProviders();

    const fetchBindings = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/v1/user-providers");
            if (response.ok) {
                const data = await response.json();
                setBindings(data);
            }
        } catch (error) {
            console.error("Error fetching bindings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBindings();
    }, []);

    const handleConnect = (providerName: string) => {
        setSelectedProvider(providerName);
        setWizardOpen(true);
    };

    const handleWizardSuccess = () => {
        fetchBindings();
        toast({
            title: "Success",
            description: "Provider connected successfully",
        });
    };

    const handleDelete = async (bindingId: number, providerName: string) => {
        if (!confirm(`Are you sure you want to remove ${providerName}?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/api/v1/user-providers/${bindingId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Provider removed successfully",
                });
                fetchBindings();
            } else {
                throw new Error("Failed to delete binding");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to remove provider",
                variant: "destructive",
            });
        }
    };

    const getBindingForProvider = (providerName: string) => {
        return bindings.find(b => b.provider_type === providerName);
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Provider Connections</h1>
                <p className="text-muted-foreground">
                    Connect your GPU provider accounts to deploy workloads using your own API keys.
                </p>
            </div>

            <Alert className="mb-6">
                <AlertDescription>
                    <strong>Why connect providers?</strong> ComputeHub uses your own API keys to deploy on your behalf.
                    You pay providers directly for compute costs. We only charge for platform features via credits.
                </AlertDescription>
            </Alert>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {supportedProviders.map((provider) => {
                        const binding = getBindingForProvider(provider.name);
                        const isConnected = !!binding;

                        return (
                            <Card key={provider.name} className="relative">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{provider.icon}</span>
                                            <div>
                                                <CardTitle>{provider.displayName}</CardTitle>
                                                <CardDescription className="text-xs">
                                                    {provider.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        {isConnected && (
                                            <Badge variant="default" className="flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Connected
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isConnected ? (
                                        <div className="space-y-3">
                                            <div className="text-sm">
                                                <p className="text-muted-foreground">
                                                    {binding.display_name || `${provider.displayName} Account`}
                                                </p>
                                                {binding.last_verified && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Last verified: {new Date(binding.last_verified).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => handleConnect(provider.name)}
                                                >
                                                    <Settings2 className="h-4 w-4 mr-2" />
                                                    Update
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(binding.id, provider.displayName)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            className="w-full"
                                            onClick={() => handleConnect(provider.name)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Connect {provider.displayName}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {selectedProvider && (
                <OnboardingWizard
                    open={wizardOpen}
                    onOpenChange={setWizardOpen}
                    providerName={selectedProvider}
                    onSuccess={handleWizardSuccess}
                />
            )}
        </div>
    );
}
