"use client";

import { useState, useEffect } from "react";
import { Check, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PriceComparisonDrawer } from "./price-comparison-drawer";
import { comparePrices } from "@/lib/api";

export interface GPUOption {
    id: string;
    name: string;
    vram: string;
    description: string;
    providers: ("local" | "runpod" | "vast")[];
}

const gpuOptions: GPUOption[] = [
    {
        id: "RTX4090",
        name: "NVIDIA RTX 4090",
        vram: "24GB",
        description: "Best value for inference and fine-tuning small models.",
        providers: ["local", "runpod", "vast"]
    },
    {
        id: "RTX3090",
        name: "NVIDIA RTX 3090",
        vram: "24GB",
        description: "Cost-effective option for medium workloads.",
        providers: ["local", "runpod", "vast"]
    },
    {
        id: "A100",
        name: "NVIDIA A100",
        vram: "80GB",
        description: "Industry standard for large scale training and inference.",
        providers: ["local", "runpod"]
    },
    {
        id: "H100",
        name: "NVIDIA H100",
        vram: "80GB",
        description: "Maximum performance for massive workloads.",
        providers: ["local", "runpod"]
    },
    {
        id: "A6000",
        name: "NVIDIA RTX A6000",
        vram: "48GB",
        description: "Professional GPU for creative and AI workloads.",
        providers: ["local", "runpod"]
    },
];

interface GPUSelectorProps {
    selectedGpu: string;
    onSelect: (gpuId: string) => void;
    onProviderSelect: (provider: string) => void;
    selectedProvider?: string;
}

export function GPUSelector({
    selectedGpu,
    onSelect,
    onProviderSelect,
    selectedProvider
}: GPUSelectorProps) {
    const [priceInfo, setPriceInfo] = useState<Record<string, { price: number | null; provider: string }>>({});
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [allProviderData, setAllProviderData] = useState<Record<string, any>>({});

    // Fetch prices for all GPUs on mount and when selectedProvider changes
    useEffect(() => {
        const fetchAllPrices = async () => {
            setLoadingPrices(true);
            const prices: Record<string, { price: number | null; provider: string }> = {};
            const providerData: Record<string, any> = {};

            for (const gpu of gpuOptions) {
                try {
                    const data = await comparePrices(gpu.id);
                    providerData[gpu.id] = data.providers;

                    // If a provider is selected, show that provider's price
                    // Otherwise, show the cheapest paid provider (exclude local)
                    if (selectedProvider) {
                        const selectedProviderData = data.providers.find(p => p.name === selectedProvider);
                        if (selectedProviderData) {
                            prices[gpu.id] = {
                                price: selectedProviderData.price_per_hour,
                                provider: selectedProviderData.display_name || selectedProviderData.name
                            };
                        }
                    } else {
                        // Show cheapest paid provider (exclude local)
                        const cheapest = data.providers
                            .filter(p => p.available && p.price_per_hour !== null && p.name !== "local" && p.price_per_hour > 0)
                            .sort((a, b) => (a.price_per_hour || 0) - (b.price_per_hour || 0))[0];

                        if (cheapest) {
                            prices[gpu.id] = {
                                price: cheapest.price_per_hour,
                                provider: cheapest.display_name || cheapest.name
                            };
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch price for ${gpu.id}:`, error);
                }
            }

            setAllProviderData(providerData);
            setPriceInfo(prices);
            setLoadingPrices(false);
        };

        fetchAllPrices();
    }, [selectedProvider]); // Re-fetch when selectedProvider changes

    return (
        <div className="space-y-3">
            {gpuOptions.map((gpu) => {
                const isSelected = selectedGpu === gpu.id;
                const price = priceInfo[gpu.id];

                return (
                    <div key={gpu.id}>
                        {/* GPU Card */}
                        <div
                            className={`relative flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border bg-card"
                                }`}
                            onClick={() => onSelect(gpu.id)}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`p-2 rounded-full ${isSelected
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground"
                                    }`}>
                                    <Cpu className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium leading-none">{gpu.name}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {gpu.vram} VRAM • {gpu.description}
                                    </p>
                                    {price && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {price.price === 0 ? (
                                                <span className="text-green-600 dark:text-green-500">
                                                    Free via {price.provider}
                                                </span>
                                            ) : (
                                                <span>
                                                    From ${price.price?.toFixed(2)}/hr via {price.provider}
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {isSelected && (
                                <div className="absolute top-4 right-4 text-primary">
                                    <Check className="h-4 w-4" />
                                </div>
                            )}
                        </div>

                        {/* Price Comparison Drawer - Auto-expand when selected */}
                        {isSelected && (
                            <PriceComparisonDrawer
                                gpuType={gpu.id}
                                onProviderSelect={onProviderSelect}
                                selectedProvider={selectedProvider}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function getGpuPrice(gpuId: string): number {
    // This is now deprecated - prices come from the API
    return 0;
}
