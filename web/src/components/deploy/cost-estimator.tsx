"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Info, DollarSign } from "lucide-react";
import { comparePrices } from "@/lib/api";

interface CostEstimatorProps {
    gpuType: string;
    provider: string;
}

export function CostEstimator({ gpuType, provider }: CostEstimatorProps) {
    const [pricePerHour, setPricePerHour] = useState<number | null>(null);
    const [providerDisplayName, setProviderDisplayName] = useState<string>("");
    const [loading, setLoading] = useState(true);

    // Service fee configuration (TODO: get from user settings)
    const SERVICE_FEE_RATE = 0.07; // 7%
    const SERVICE_FEE_ENABLED = true;

    useEffect(() => {
        const fetchPrice = async () => {
            setLoading(true);
            try {
                const data = await comparePrices(gpuType);
                const selectedProvider = data.providers.find(p => p.name === provider);

                if (selectedProvider) {
                    setPricePerHour(selectedProvider.price_per_hour);
                    setProviderDisplayName(selectedProvider.display_name || selectedProvider.name);
                }
            } catch (error) {
                console.error("Failed to fetch price:", error);
            } finally {
                setLoading(false);
            }
        };

        if (gpuType && provider) {
            fetchPrice();
        }
    }, [gpuType, provider]);

    if (loading) {
        return (
            <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Estimated Cost
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!pricePerHour) {
        return (
            <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Estimated Cost
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert className="border-blue-500/20 bg-blue-500/10">
                        <Info className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-sm">
                            <p className="font-medium text-blue-600 mb-1">Select GPU and Provider</p>
                            <p className="text-xs text-muted-foreground">
                                Choose a GPU type and provider above to see pricing estimates.
                            </p>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    // Calculate costs
    const baseCost = pricePerHour;
    const serviceFee = SERVICE_FEE_ENABLED ? baseCost * SERVICE_FEE_RATE : 0;
    const totalCostPerHour = baseCost + serviceFee;

    const dailyCost = totalCostPerHour * 24;
    const monthlyCost = totalCostPerHour * 24 * 30;

    return (
        <Card className="bg-muted/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Estimated Cost
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Provider Badge */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Provider</span>
                    <Badge variant="outline" className="text-xs">
                        {providerDisplayName}
                    </Badge>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">GPU Cost</span>
                        <span className="font-mono">${baseCost.toFixed(4)}/h</span>
                    </div>

                    {SERVICE_FEE_ENABLED && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Service Fee ({(SERVICE_FEE_RATE * 100).toFixed(0)}%)
                            </span>
                            <span className="font-mono text-blue-500">
                                +${serviceFee.toFixed(4)}/h
                            </span>
                        </div>
                    )}

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between font-semibold">
                        <span>Hourly Total</span>
                        <span className="font-mono text-lg">
                            ${totalCostPerHour.toFixed(4)}/h
                        </span>
                    </div>
                </div>

                {/* Time Projections */}
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Daily (24h)</span>
                        <span className="font-mono">${dailyCost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Monthly (30d)</span>
                        <span className="font-mono">${monthlyCost.toFixed(2)}</span>
                    </div>
                </div>

                {/* Service Fee Notice */}
                {SERVICE_FEE_ENABLED && (
                    <Alert className="border-blue-500/20 bg-blue-500/10">
                        <Info className="h-3 w-3 text-blue-500" />
                        <AlertDescription className="text-xs">
                            Service fee covers smart scheduling & auto-recovery.
                            Can be disabled in settings.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
