"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, DollarSign, MapPin, Zap, AlertCircle, RefreshCw } from "lucide-react";
import { checkGPUAvailability, type ProviderAvailability, type GPUAlternative } from "@/lib/availability-api";
import { Button } from "@/components/ui/button";

interface AvailabilityCheckerProps {
    gpuType: string;
    providers?: string[];
    onProviderSelect?: (provider: string) => void;
}

export function AvailabilityChecker({ gpuType, providers, onProviderSelect }: AvailabilityCheckerProps) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [availability, setAvailability] = useState<Record<string, ProviderAvailability>>({});
    const [alternatives, setAlternatives] = useState<GPUAlternative[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (gpuType) {
            fetchAvailability();
        }
    }, [gpuType]);

    const fetchAvailability = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await getToken();
            if (!token) return;

            const data = await checkGPUAvailability(token, gpuType, providers);
            setAvailability(data.availability);
            setAlternatives(data.alternatives);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to check availability");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>GPU Availability: {gpuType}</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAvailability}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3">
                    {Object.entries(availability).map(([provider, data]) => (
                        <ProviderCard
                            key={provider}
                            provider={provider}
                            data={data}
                            onSelect={onProviderSelect}
                        />
                    ))}
                </div>

                {alternatives.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Alternative GPUs
                        </h4>
                        <div className="space-y-2">
                            {alternatives.map((alt, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    <div>
                                        <span className="font-medium">{alt.gpu}</span>
                                        <p className="text-sm text-muted-foreground">
                                            {alt.use_case}
                                        </p>
                                    </div>
                                    <Badge variant="outline">
                                        {(alt.performance_ratio * 100).toFixed(0)}% perf
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface ProviderCardProps {
    provider: string;
    data: ProviderAvailability;
    onSelect?: (provider: string) => void;
}

function ProviderCard({ provider, data, onSelect }: ProviderCardProps) {
    return (
        <div
            className={`border rounded-lg p-4 transition-all ${onSelect && data.available
                    ? 'hover:border-primary cursor-pointer hover:shadow-md'
                    : ''
                }`}
            onClick={() => onSelect && data.available && onSelect(provider)}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{provider}</span>
                    {data.cached && (
                        <Badge variant="secondary" className="text-xs">
                            Cached
                        </Badge>
                    )}
                </div>
                {data.available ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Available
                    </Badge>
                ) : (
                    <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unavailable
                    </Badge>
                )}
            </div>

            {data.available && (
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>{data.count} available</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${data.price_per_hour.toFixed(2)}/hr</span>
                    </div>
                    {data.regions.length > 0 && (
                        <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{data.regions.length} regions</span>
                        </div>
                    )}
                </div>
            )}

            {data.error && (
                <p className="text-sm text-destructive mt-2">{data.error}</p>
            )}

            <p className="text-xs text-muted-foreground mt-2">
                Checked: {new Date(data.checked_at).toLocaleString()}
            </p>
        </div>
    );
}
