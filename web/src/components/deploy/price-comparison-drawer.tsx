"use client";

import { useState, useEffect } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { comparePrices, type ProviderPrice } from "@/lib/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface PriceComparisonDrawerProps {
    gpuType: string;
    onProviderSelect: (provider: string) => void;
    selectedProvider?: string;
}

export function PriceComparisonDrawer({
    gpuType,
    onProviderSelect,
    selectedProvider
}: PriceComparisonDrawerProps) {
    const [providers, setProviders] = useState<ProviderPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [recommended, setRecommended] = useState<string | null>(null);

    useEffect(() => {
        const fetchPrices = async () => {
            setLoading(true);
            try {
                const data = await comparePrices(gpuType);
                setProviders(data.providers);
                setRecommended(data.recommended);

                // Auto-select cheapest PAID provider if:
                // 1. No provider selected yet, OR
                // 2. Currently selected provider is "local", OR
                // 3. Currently selected provider is not available for this GPU
                const currentProviderAvailable = selectedProvider &&
                    data.providers.find(p => p.name === selectedProvider && p.available);

                const shouldAutoSelect = !selectedProvider ||
                    selectedProvider === "local" ||
                    !currentProviderAvailable;

                if (shouldAutoSelect && data.providers.length > 0) {
                    // Find cheapest paid provider (exclude local/free)
                    const paidProviders = data.providers
                        .filter(p => p.available && p.name !== "local" && (p.price_per_hour !== null && p.price_per_hour > 0))
                        .sort((a, b) => (a.price_per_hour || 0) - (b.price_per_hour || 0));

                    if (paidProviders.length > 0) {
                        // Select cheapest paid provider
                        onProviderSelect(paidProviders[0].name);
                    } else if (data.recommended && data.recommended !== "local") {
                        // Fallback to recommended if no paid providers (but not local)
                        onProviderSelect(data.recommended);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch prices:", error);
            } finally {
                setLoading(false);
            }
        };

        if (gpuType) {
            fetchPrices();
        }
    }, [gpuType]);

    if (loading) {
        return (
            <div className="p-4 border rounded-lg bg-muted/30 mt-3">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading prices...</span>
                </div>
            </div>
        );
    }

    if (providers.length === 0) {
        return (
            <div className="p-4 border rounded-lg bg-yellow-500/10 border-yellow-500/20 mt-3">
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                    No providers available for {gpuType}
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded-lg bg-card mt-3">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">💰 Available Providers</h4>
                <span className="text-xs text-muted-foreground">
                    {providers.filter(p => p.available).length} available
                </span>
            </div>

            <RadioGroup
                value={selectedProvider}
                onValueChange={onProviderSelect}
                className="space-y-2"
            >
                {providers.map((provider) => {
                    const isRecommended = provider.name === recommended;
                    const isFree = provider.price_per_hour === 0;

                    return (
                        <div
                            key={provider.name}
                            className={`flex items-center space-x-3 p-3 rounded-md border transition-colors ${selectedProvider === provider.name
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-accent/50"
                                } ${!provider.available ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            onClick={() => provider.available && onProviderSelect(provider.name)}
                        >
                            <RadioGroupItem
                                value={provider.name}
                                id={provider.name}
                                disabled={!provider.available}
                            />
                            <Label
                                htmlFor={provider.name}
                                className="flex-1 flex items-center justify-between cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    {isRecommended && (
                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                    )}
                                    <span className="font-medium capitalize">
                                        {provider.display_name || provider.name}
                                    </span>
                                    {provider.is_test && (
                                        <Badge variant="outline" className="text-xs">
                                            Test
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-right">
                                    {provider.available ? (
                                        <div>
                                            <span className="font-semibold">
                                                {isFree ? (
                                                    <span className="text-green-500">Free</span>
                                                ) : (
                                                    `$${provider.price_per_hour?.toFixed(2)}/hr`
                                                )}
                                            </span>
                                            {isRecommended && !isFree && (
                                                <span className="ml-2 text-xs text-primary">
                                                    Best Price
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            Unavailable
                                        </span>
                                    )}
                                </div>
                            </Label>
                        </div>
                    );
                })}
            </RadioGroup>
        </div>
    );
}
