"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Rocket, AlertCircle, BookTemplate, Save } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { createDeployment } from "@/lib/api";
import { getTemplates, createTemplate, type DeploymentTemplate } from "@/lib/templates-api";
import { setAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TemplateGallery, Template } from "@/components/deploy/template-gallery";
import { GPUSelector } from "@/components/deploy/gpu-selector";
import { CostEstimator } from "@/components/deploy/cost-estimator";
import { ImageSelector } from "@/components/deploy/image-selector";

interface ProviderBinding {
    id: number;
    provider_type: string;
    is_active: boolean;
}

export default function NewDeployment() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { getToken } = useAuth();

    // Form State - start with local to trigger auto-selection to paid provider
    const [provider, setProvider] = useState<"local" | "runpod" | "vast">("local");
    const [name, setName] = useState("");
    const [image, setImage] = useState("");
    const [gpuType, setGpuType] = useState("RTX4090");
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    // Provider bindings state
    const [bindings, setBindings] = useState<ProviderBinding[]>([]);
    const [bindingsLoading, setBindingsLoading] = useState(true);

    // Templates state
    const [templates, setTemplates] = useState<DeploymentTemplate[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateDescription, setTemplateDescription] = useState("");

    // Fetch user's templates
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setTemplatesLoading(true);
                const token = await getToken();
                if (!token) return;
                setAuthToken(token);
                const data = await getTemplates();
                setTemplates(data);

                // Check if loading from template via URL
                const templateId = searchParams?.get("template");
                if (templateId) {
                    const template = data.find(t => t.id === parseInt(templateId));
                    if (template) {
                        loadFromTemplate(template);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch templates:", error);
            } finally {
                setTemplatesLoading(false);
            }
        };
        fetchTemplates();
    }, [getToken, searchParams]);

    // Fetch user's provider bindings
    useEffect(() => {
        const fetchBindings = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const response = await fetch("http://localhost:8000/api/v1/user-providers", {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setBindings(data);
                }
            } catch (error) {
                console.error("Failed to fetch bindings:", error);
            } finally {
                setBindingsLoading(false);
            }
        };
        fetchBindings();
    }, [getToken]);

    const loadFromTemplate = (template: DeploymentTemplate) => {
        setName(template.name);
        setImage(template.image);
        setGpuType(template.gpu_type);
        setProvider(template.provider as "local" | "runpod" | "vast");
        setSelectedTemplate(template.id.toString());
    };

    const handleTemplateSelect = (template: Template) => {
        setImage(template.image);
        setGpuType(template.recommendedGpu);
        setSelectedTemplate(template.id);
        // Don't reset provider - let PriceComparisonDrawer handle it

        // Auto-generate deployment name based on template
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
        const templateName = template.id.toLowerCase();
        setName(`${templateName}-${timestamp}`);
    };

    const handleSaveAsTemplate = async () => {
        if (!templateName) {
            toast({
                title: "Template name required",
                description: "Please enter a name for your template",
                variant: "destructive"
            });
            return;
        }

        try {
            const token = await getToken();
            if (!token) return;

            setAuthToken(token);
            await createTemplate({
                name: templateName,
                description: templateDescription,
                provider,
                gpu_type: gpuType,
                image,
                env: {}
            });

            toast({
                title: "Template saved!",
                description: `${templateName} has been saved to your templates`
            });

            setShowSaveTemplate(false);
            setTemplateName("");
            setTemplateDescription("");

            // Refresh templates
            const data = await getTemplates();
            setTemplates(data);
        } catch (error: any) {
            toast({
                title: "Failed to save template",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error("Not authenticated");
            }

            setAuthToken(token);

            await createDeployment({
                name,
                provider,
                gpu_type: gpuType,
                image,
                env: {}
            });

            toast({
                title: "Deployment created!",
                description: `${name} is being provisioned...`
            });

            router.push("/deploy");
        } catch (error: any) {
            toast({
                title: "Failed to create deployment",
                description: error.message || "An error occurred",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <Link href="/deploy" className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">New Deployment</h1>
                        <p className="text-text-secondary mt-2">Configure and launch your GPU instance</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/deploy/quick">
                            <Button variant="outline">Quick Deploy</Button>
                        </Link>
                        {!showSaveTemplate && (
                            <Button variant="outline" onClick={() => setShowSaveTemplate(true)}>
                                <Save className="h-4 w-4 mr-2" />
                                Save as Template
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Template Form */}
            <div className="mb-6">
                {showSaveTemplate && (
                    <div className="p-6 border rounded-lg bg-card space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <BookTemplate className="h-5 w-5" />
                            <h3 className="font-semibold">Save Current Configuration as Template</h3>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="template-name">Template Name</Label>
                            <Input
                                id="template-name"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="e.g., PyTorch Training"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="template-description">Description (Optional)</Label>
                            <Input
                                id="template-description"
                                value={templateDescription}
                                onChange={(e) => setTemplateDescription(e.target.value)}
                                placeholder="e.g., Standard setup for PyTorch model training"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSaveAsTemplate}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Template
                            </Button>
                            <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Configuration Form */}
                <div className="lg:col-span-2 space-y-8">

                    {/* 1. Templates */}
                    <section className="space-y-4">
                        <div>
                            <Label className="text-lg font-semibold">1. Choose a Template <span className="text-sm font-normal text-text-secondary">(Optional)</span></Label>
                            <p className="text-sm text-text-secondary mt-1">Quick start with pre-configured environments, or skip to configure manually</p>
                        </div>
                        <TemplateGallery
                            selectedTemplate={selectedTemplate}
                            onSelect={handleTemplateSelect}
                        />
                    </section>

                    {/* 2. Hardware */}
                    <section className="space-y-4">
                        <div>
                            <Label className="text-lg font-semibold">2. Select Hardware</Label>
                            <p className="text-sm text-text-secondary mt-1">Choose GPU type and provider based on your requirements</p>
                        </div>
                        <GPUSelector
                            selectedGpu={gpuType}
                            onSelect={setGpuType}
                            onProviderSelect={(p) => setProvider(p as "local" | "runpod" | "vast")}
                            selectedProvider={provider}
                        />
                    </section>

                    {/* 3. Details */}
                    <section className="space-y-4">
                        <div>
                            <Label className="text-lg font-semibold">3. Configuration Details</Label>
                            <p className="text-sm text-text-secondary mt-1">Specify deployment name and Docker image</p>
                        </div>
                        <div className="grid gap-4 p-6 border rounded-lg bg-card">
                            <div className="space-y-2">
                                <Label htmlFor="name">Deployment Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. my-llama-instance"
                                    required
                                />
                            </div>

                            <ImageSelector
                                value={image}
                                onChange={setImage}
                                provider={provider}
                            />
                        </div>
                    </section>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <Button variant="outline" onClick={() => router.push("/deploy")}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !name || !image}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Rocket className="mr-2 h-4 w-4" />
                                    Deploy Instance
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Right Column: Cost Estimator */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        <CostEstimator
                            provider={provider}
                            gpuType={gpuType}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
