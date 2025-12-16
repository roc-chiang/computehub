"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Rocket, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { createDeployment, comparePrices } from "@/lib/api";
import { setAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

type WorkloadType = "training" | "inference" | "general";

const WORKLOAD_CONFIGS = {
    training: {
        label: "AI Model Training",
        description: "Deep learning model training with high-performance GPUs",
        icon: "🧠",
        recommendedGPU: "RTX 4090",
        defaultImage: "pytorch/pytorch:2.0.1-cuda11.8-cudnn8-runtime"
    },
    inference: {
        label: "Inference Service",
        description: "Model inference and API serving, balanced performance and cost",
        icon: "⚡",
        recommendedGPU: "RTX 4080",
        defaultImage: "tensorflow/tensorflow:latest-gpu"
    },
    general: {
        label: "General Computing",
        description: "Data processing, experiments, and general tasks",
        icon: "🔧",
        recommendedGPU: "RTX 3090",
        defaultImage: "nvidia/cuda:11.8.0-base-ubuntu22.04"
    }
};

export default function QuickDeploy() {
    const router = useRouter();
    const { toast } = useToast();
    const { getToken } = useAuth();

    // Form state
    const [workloadType, setWorkloadType] = useState<WorkloadType | null>(null);
    const [name, setName] = useState("");
    const [image, setImage] = useState("");

    // Provider selection
    const [loading, setLoading] = useState(false);
    const [availability, setAvailability] = useState<any>(null);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [showProviderOptions, setShowProviderOptions] = useState(false);
    const [creating, setCreating] = useState(false);

    // Auto-fill image when workload type changes
    useEffect(() => {
        if (workloadType) {
            setImage(WORKLOAD_CONFIGS[workloadType].defaultImage);
            fetchAvailability();

            // Auto-generate deployment name based on workload type
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
            const workloadName = workloadType.toLowerCase();
            setName(`${workloadName}-${timestamp}`);
        }
    }, [workloadType]);

    // Fetch availability
    const fetchAvailability = async () => {
        if (!workloadType) return;

        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            const gpuType = WORKLOAD_CONFIGS[workloadType].recommendedGPU;
            // Use comparePrices API (same as professional version)
            const data = await comparePrices(gpuType);

            // Convert to availability format
            const availabilityData = {
                gpu_type: gpuType,
                availability: {} as Record<string, any>
            };

            data.providers.forEach(provider => {
                availabilityData.availability[provider.name] = {
                    available: provider.available,
                    count: provider.available ? 999 : 0,
                    price_per_hour: provider.price_per_hour || 0,
                    regions: []
                };
            });

            setAvailability(availabilityData);

            // Auto-select cheapest PAID provider (exclude local/free)
            const paidProviders = data.providers
                .filter(p => p.available && p.name !== "local" && p.price_per_hour !== null && p.price_per_hour > 0)
                .sort((a, b) => (a.price_per_hour || 0) - (b.price_per_hour || 0));

            if (paidProviders.length > 0) {
                setSelectedProvider(paidProviders[0].name);
            }
        } catch (error) {
            console.error("Failed to fetch availability:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!selectedProvider || !name || !image || !workloadType) return;

        setCreating(true);
        try {
            const token = await getToken();
            if (!token) return;

            setAuthToken(token);

            await createDeployment({
                name,
                provider: selectedProvider,
                gpu_type: WORKLOAD_CONFIGS[workloadType].recommendedGPU,
                image,
                env: {}
            });

            toast({
                title: "Deployment created successfully!",
                description: `${name} is starting up...`
            });

            router.push("/deploy");
        } catch (error: any) {
            toast({
                title: "Creation failed",
                description: error.message || "Unable to create deployment",
                variant: "destructive"
            });
        } finally {
            setCreating(false);
        }
    };

    const canCreate = name && image && selectedProvider && workloadType;
    const recommendedProvider = availability && Object.entries(availability.availability)
        .filter(([provider, data]: [string, any]) =>
            data.available &&
            provider !== "local" &&
            data.price_per_hour > 0
        )
        .sort((a: any, b: any) => a[1].price_per_hour - b[1].price_per_hour)[0];

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <Link href="/deploy" className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Deployments
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Quick Deploy</h1>
                        <p className="text-text-secondary mt-2">Create GPU deployment in one page</p>
                    </div>
                    <Link href="/deploy/new">
                        <Button variant="outline">Advanced Mode</Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Step 1: Workload Type */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. What do you want to do?</CardTitle>
                        <CardDescription>Choose your workload type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup value={workloadType || ""} onValueChange={(v) => setWorkloadType(v as WorkloadType)}>
                            {Object.entries(WORKLOAD_CONFIGS).map(([key, config]) => (
                                <div key={key} className="flex items-center space-x-3 p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors">
                                    <RadioGroupItem value={key} id={key} />
                                    <Label htmlFor={key} className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{config.icon}</span>
                                            <div>
                                                <div className="font-medium">{config.label}</div>
                                                <div className="text-sm text-text-secondary">{config.description}</div>
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>

                {/* Step 2: Configuration */}
                {workloadType && (
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Basic Configuration</CardTitle>
                            <CardDescription>Just 2 fields to fill</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Deployment Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., my-training-job"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">
                                    Docker Image <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="image"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    placeholder="e.g., pytorch/pytorch:latest"
                                />
                                <p className="text-xs text-text-secondary">
                                    Pre-filled with recommended image
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Provider Selection */}
                {workloadType && availability && (
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Provider Selection</CardTitle>
                            <CardDescription>Auto-selected based on best price</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <span className="ml-3 text-text-secondary">Checking availability...</span>
                                </div>
                            ) : recommendedProvider ? (
                                <div className="space-y-4">
                                    {/* Selected Provider (or recommended if none selected) */}
                                    {(() => {
                                        const displayProvider = selectedProvider
                                            ? [selectedProvider, availability.availability[selectedProvider]]
                                            : recommendedProvider;

                                        if (!displayProvider) return null;

                                        const [providerName, providerData] = displayProvider;
                                        const isRecommended = providerName === recommendedProvider[0];

                                        return (
                                            <div className="p-4 border-2 border-brand rounded-lg bg-brand-light">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="h-5 w-5 text-brand" />
                                                        <span className="font-semibold">
                                                            {isRecommended ? "Recommended" : "Selected"}
                                                        </span>
                                                        {isRecommended && <Badge variant="secondary">Auto-selected</Badge>}
                                                    </div>
                                                    <Badge className="bg-green-500">Available</Badge>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 mt-3">
                                                    <div>
                                                        <div className="text-sm text-text-secondary">Provider</div>
                                                        <div className="font-medium capitalize">{providerName}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-text-secondary">Price</div>
                                                        <div className="font-medium text-brand">
                                                            ${providerData.price_per_hour.toFixed(2)}/hr
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-text-secondary">Available</div>
                                                        <div className="font-medium">{providerData.count} GPUs</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Show other options */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowProviderOptions(!showProviderOptions)}
                                        className="w-full"
                                    >
                                        {showProviderOptions ? (
                                            <>
                                                <ChevronUp className="mr-2 h-4 w-4" />
                                                Hide other options
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="mr-2 h-4 w-4" />
                                                Show other options
                                            </>
                                        )}
                                    </Button>

                                    {/* Other providers */}
                                    {showProviderOptions && (
                                        <RadioGroup value={selectedProvider || ""} onValueChange={setSelectedProvider}>
                                            <div className="space-y-2">
                                                {Object.entries(availability.availability)
                                                    .filter(([_, data]: [string, any]) => data.available)
                                                    .map(([provider, data]: [string, any]) => (
                                                        <div key={provider} className="flex items-center space-x-3 p-3 border rounded-lg">
                                                            <RadioGroupItem value={provider} id={provider} />
                                                            <Label htmlFor={provider} className="flex-1 cursor-pointer">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div className="font-medium capitalize">{provider}</div>
                                                                        <div className="text-sm text-text-secondary">
                                                                            {data.count} GPUs available
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-medium">${data.price_per_hour.toFixed(2)}/hr</div>
                                                                        {provider === recommendedProvider[0] && (
                                                                            <Badge variant="secondary" className="text-xs">Cheapest</Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Label>
                                                        </div>
                                                    ))}
                                            </div>
                                        </RadioGroup>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-text-secondary">
                                    No GPUs available for this workload
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Create Button */}
                {workloadType && (
                    <div className="flex justify-end">
                        <Button
                            onClick={handleCreate}
                            disabled={!canCreate || creating}
                            size="lg"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Rocket className="mr-2 h-4 w-4" />
                                    Create Deployment
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
