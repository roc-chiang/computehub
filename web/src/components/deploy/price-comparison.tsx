"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Trophy, AlertCircle } from "lucide-react";
import { comparePrices, type PriceComparison } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PriceComparisonProps {
    gpuType: string;
    onRecommendedProviderChange?: (provider: string) => void;
}

export function PriceComparison({ gpuType, onRecommendedProviderChange }: PriceComparisonProps) {
    const [comparison, setComparison] = useState<PriceComparison | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPrices = async () => {
        if (!gpuType) return;

        setLoading(true);
        setError(null);

        try {
            const data = await comparePrices(gpuType);
            setComparison(data);

            // Auto-select recommended provider
            if (data.recommended && onRecommendedProviderChange) {
                onRecommendedProviderChange(data.recommended);
            }
        } catch (err) {
            setError("Failed to fetch price comparison");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();
    }, [gpuType]);

    if (loading && !comparison) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading prices...</span>
                </div>
            </Card>
        );
    }

    if (error || comparison?.error) {
        return (
            <Card className="p-6 border-yellow-500/50 bg-yellow-500/5">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">Price comparison unavailable</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {error || comparison?.error || "Unable to fetch pricing data"}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={fetchPrices}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </Card>
        );
    }

    if (!comparison || comparison.providers.length === 0) {
        return null;
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        💰 Price Comparison
                        <span className="text-sm font-normal text-muted-foreground">
                            for {comparison.gpu_type}
                        </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Updated {new Date(comparison.cached_at).toLocaleTimeString()}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchPrices} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <div className="space-y-2">
                {comparison.providers.map((provider, index) => {
                    const isRecommended = provider.name === comparison.recommended;
                    const isFree = provider.price_per_hour === 0;

                    return (
                        <div
                            key={provider.name}
                            className={`flex items-center justify-between p-3 rounded-lg border ${isRecommended
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-card"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {isRecommended && (
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                )}
                                <div>
                                    <p className="font-medium capitalize">
                                        {provider.name}
                                        {isRecommended && (
                                            <span className="ml-2 text-xs text-primary">
                                                Best Price
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                {provider.available ? (
                                    <div>
                                        <p className="font-semibold">
                                            {isFree ? (
                                                <span className="text-green-500">Free</span>
                                            ) : (
                                                `$${provider.price_per_hour?.toFixed(2)}/hr`
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {provider.currency}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Unavailable</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {comparison.providers.filter(p => p.available).length === 0 && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">
                        No providers currently available for {comparison.gpu_type}
                    </p>
                </div>
            )}
        </Card>
    );
}
