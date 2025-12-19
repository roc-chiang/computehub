"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ImageIcon, Bot, Workflow, Settings } from "lucide-react";
import { TemplateCardSkeleton } from "@/components/skeletons/card-skeletons";

export interface Template {
    id: string;
    name: string;
    description: string;
    image: string;
    recommendedGpu: string;
    category: "image" | "llm" | "workflow" | "custom";
    isAdvanced?: boolean;
}

const templates: Template[] = [
    {
        id: "image-generation",
        name: "Image Generation",
        description: "Generate images instantly in your browser",
        image: "runpod/stable-diffusion:web-ui-10.2.1",
        recommendedGpu: "RTX4090",
        category: "image",
    },
    {
        id: "llm-inference",
        name: "LLM Inference",
        description: "Deploy an inference endpoint in minutes",
        image: "runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel", // Will be vLLM in future
        recommendedGpu: "A100",
        category: "llm",
    },
    {
        id: "comfyui",
        name: "ComfyUI",
        description: "Build complex pipelines without code",
        image: "runpod/base:0.4.0-cuda11.8.0", // Will be ComfyUI official image
        recommendedGpu: "RTX4090",
        category: "workflow",
    },
    {
        id: "custom-docker",
        name: "Custom Docker",
        description: "For advanced users and experiments",
        image: "runpod/base:0.4.0-cuda11.8.0",
        recommendedGpu: "A100",
        category: "custom",
        isAdvanced: true,
    },
];

interface TemplateGalleryProps {
    selectedTemplate: string | null;
    onSelect: (template: Template) => void;
}

const categoryConfig = {
    image: {
        icon: ImageIcon,
        subtitle: "Stable Diffusion WebUI",
        buttonText: "Launch",
    },
    llm: {
        icon: Bot,
        subtitle: "OpenAI-compatible API",
        buttonText: "Launch",
    },
    workflow: {
        icon: Workflow,
        subtitle: "Visual workflow for generative models",
        buttonText: "Launch",
    },
    custom: {
        icon: Settings,
        subtitle: "Full control over your environment",
        buttonText: "Advanced",
    },
};

export function TemplateGallery({ selectedTemplate, onSelect }: TemplateGalleryProps) {
    const [loading, setLoading] = useState(false);

    if (loading) {
        return <TemplateCardSkeleton />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => {
                const config = categoryConfig[template.category];
                const Icon = config.icon;
                const isSelected = selectedTemplate === template.id;
                const isAdvanced = template.isAdvanced;

                return (
                    <Card
                        key={template.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${isAdvanced
                                ? "bg-cream-100/50 border-cream-200 hover:border-brand/30"
                                : "bg-cream-100 border-cream-200 hover:border-brand"
                            } ${isSelected ? "border-brand shadow-md ring-2 ring-brand/20" : ""
                            }`}
                        onClick={() => onSelect(template)}
                    >
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-3 rounded-lg ${isAdvanced ? "bg-cream-200/50" : "bg-brand/10"
                                    }`}>
                                    <Icon className={`h-8 w-8 ${isAdvanced ? "text-text-secondary" : "text-brand"
                                        }`} />
                                </div>
                                {isSelected && (
                                    <div className="p-1.5 rounded-full bg-brand">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <CardTitle className={`text-2xl ${isAdvanced ? "text-text-secondary" : "text-text-primary"
                                    }`}>
                                    {template.name}
                                </CardTitle>
                                <p className={`text-sm font-medium ${isAdvanced ? "text-text-secondary/70" : "text-brand"
                                    }`}>
                                    {config.subtitle}
                                </p>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <CardDescription className={`text-base ${isAdvanced ? "text-text-secondary/60" : "text-text-secondary"
                                }`}>
                                {template.description}
                            </CardDescription>

                            <Button
                                className={`w-full ${isAdvanced
                                        ? "bg-cream-200 text-text-secondary hover:bg-cream-300 border border-cream-300"
                                        : "bg-brand hover:bg-brand-dark text-white"
                                    }`}
                                variant={isAdvanced ? "outline" : "default"}
                            >
                                {config.buttonText}
                            </Button>

                            {template.category === "llm" && (
                                <p className="text-xs text-text-secondary text-center">
                                    Pre-configured with OpenAI-compatible API
                                    <br />
                                    No setup required
                                </p>
                            )}

                            {isAdvanced && (
                                <p className="text-xs text-text-secondary/60 text-center font-medium">
                                    Advanced Users Only
                                    <br />
                                    Full control over your runtime environment.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
