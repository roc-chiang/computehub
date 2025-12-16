"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProviderResponse, updateProvider } from "@/lib/provider-crud-api";
import { useToast } from "@/hooks/use-toast";

interface EditProviderDialogProps {
    provider: ProviderResponse | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditProviderDialog({
    provider,
    open,
    onOpenChange,
    onSuccess
}: EditProviderDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState(provider?.name || "");
    const [apiKey, setApiKey] = useState(provider?.api_key || "");
    const [weight, setWeight] = useState(provider?.weight || 100);
    const [isEnabled, setIsEnabled] = useState(provider?.is_enabled ?? true);

    // Update form when provider changes
    useEffect(() => {
        if (provider) {
            setName(provider.name);
            setApiKey(provider.api_key || "");
            setWeight(provider.weight || 100);
            setIsEnabled(provider.is_enabled);
        }
    }, [provider]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider) return;

        setLoading(true);
        try {
            const result = await updateProvider(provider.id, {
                name,
                api_key: apiKey || undefined,
                weight,
                is_enabled: isEnabled
            });

            // Check if we got a valid response
            if (result && result.id) {
                toast({
                    title: "Success",
                    description: "Provider updated successfully",
                });

                onSuccess();
                onOpenChange(false);
            } else {
                // Response exists but might be unexpected format
                console.warn("Unexpected response format:", result);
                toast({
                    title: "Warning",
                    description: "Provider may have been updated. Please refresh to verify.",
                    variant: "default",
                });
                onSuccess();
                onOpenChange(false);
            }
        } catch (error) {
            console.error("Update error:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update provider",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!provider) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Provider</DialogTitle>
                        <DialogDescription>
                            Update provider configuration and API credentials.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Provider Type (Read-only) */}
                        <div className="space-y-2">
                            <Label>Provider Type</Label>
                            <Input
                                value={provider.type}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Provider type cannot be changed
                            </p>
                        </div>

                        {/* Display Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., RunPod Main"
                                required
                            />
                        </div>

                        {/* API Key */}
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter API key (leave empty to keep current)"
                            />
                            <p className="text-xs text-muted-foreground">
                                {apiKey ? "New API key will be saved" : "Leave empty to keep existing key"}
                            </p>
                        </div>

                        {/* Weight */}
                        <div className="space-y-2">
                            <Label htmlFor="weight">
                                Weight (Priority)
                            </Label>
                            <Input
                                id="weight"
                                type="number"
                                min="0"
                                max="1000"
                                value={weight}
                                onChange={(e) => setWeight(Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Higher weight = higher priority for AUTO selection
                            </p>
                        </div>

                        {/* Enabled Toggle */}
                        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="enabled" className="text-base">
                                    Enabled
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow this provider to be used for deployments
                                </p>
                            </div>
                            <Switch
                                id="enabled"
                                checked={isEnabled}
                                onCheckedChange={setIsEnabled}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
