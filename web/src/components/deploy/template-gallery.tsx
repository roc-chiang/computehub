"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Code2, ImageIcon, Terminal } from "lucide-react";
import { TemplateCardSkeleton } from "@/components/skeletons/card-skeletons";

export interface Template {
    id: string;
    name: string;
    description: string;
    image: string;
    recommendedGpu: string;
    category: "LLM" | "Image" | "General";
}

const templates: Template[] = [
    {
        id: "pytorch",
        name: "PyTorch 2.0",
        description: "PyTorch 2.0.1 with Python 3.10 and CUDA 11.8 development environment.",
        image: "runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel",
        recommendedGpu: "RTX4090",
        category: "General",
    },
    {
        id: "tensorflow",
        name: "TensorFlow",
        description: "Official TensorFlow image with GPU support and Jupyter.",
        image: "runpod/tensorflow",
        recommendedGpu: "RTX4090",
        category: "General",
    },
    {
        id: "sdxl",
        name: "Stable Diffusion",
        description: "Stable Diffusion with automatic1111 WebUI pre-installed.",
        image: "runpod/stable-diffusion:web-ui-10.2.1",
        recommendedGpu: "RTX4090",
        category: "Image",
    },
    {
        id: "base",
        name: "Base CUDA",
        description: "Minimal CUDA 11.8 environment for custom setups.",
        image: "runpod/base:0.4.0-cuda11.8.0",
        recommendedGpu: "A100",
        category: "General",
    },
];

interface TemplateGalleryProps {
    selectedTemplate: string | null;
    onSelect: (template: Template) => void;
}

const categoryIcons = {
    LLM: Code2,
    Image: ImageIcon,
    General: Terminal,
};

export function TemplateGallery({ selectedTemplate, onSelect }: TemplateGalleryProps) {
    const [loading, setLoading] = useState(false);

    // Simulate loading for demo purposes
    // In real app, this would fetch templates from API
    if (loading) {
        return <TemplateCardSkeleton />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
                const Icon = categoryIcons[template.category];
                const isSelected = selectedTemplate === template.id;

                return (
                    <Card
                        key={template.id}
                        className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${isSelected ? "border-primary shadow-md" : ""
                            }`}
                        onClick={() => onSelect(template)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-md bg-primary/10">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{template.name}</CardTitle>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="p-1 rounded-full bg-primary">
                                        <Check className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                            <CardDescription className="mt-2">{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Badge variant="outline">{template.category}</Badge>
                                <Badge variant="secondary">{template.recommendedGpu}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
