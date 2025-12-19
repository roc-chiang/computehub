import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface CommonImage {
    name: string;
    image: string;
    description: string;
}

// Only for Custom Docker template
const customDockerPresets: CommonImage[] = [
    {
        name: "Base CUDA 11.8",
        image: "runpod/base:0.4.0-cuda11.8.0",
        description: "Minimal CUDA environment"
    },
    {
        name: "PyTorch 2.x",
        image: "runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel",
        description: "PyTorch with CUDA 11.8"
    },
    {
        name: "TensorFlow GPU",
        image: "runpod/tensorflow",
        description: "Official TensorFlow GPU"
    }
];

interface ImageSelectorProps {
    value: string;
    onChange: (value: string) => void;
    provider: "auto" | "local" | "runpod" | "vast";
    selectedTemplate?: string | null;
}

export function ImageSelector({ value, onChange, provider, selectedTemplate }: ImageSelectorProps) {
    // Only show presets for Custom Docker template
    const showPresets = selectedTemplate === "custom-docker";
    const isCustomDocker = selectedTemplate === "custom-docker";

    return (
        <div className="space-y-3">
            <div>
                <Label htmlFor="image">
                    Docker Image <span className="text-destructive">*</span>
                </Label>
                {isCustomDocker && (
                    <p className="text-xs text-text-secondary/60 mt-1 font-medium">
                        Advanced Users Only
                        <br />
                        Full control over your runtime environment.
                    </p>
                )}
                {!isCustomDocker && (
                    <p className="text-xs text-text-secondary mt-1">
                        Pre-configured image for this template
                    </p>
                )}
            </div>

            {showPresets && (
                <div className="space-y-2">
                    <p className="text-sm text-text-secondary">
                        Choose a base image:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {customDockerPresets.map((img) => (
                            <Button
                                key={img.image}
                                type="button"
                                variant={value === img.image ? "default" : "outline"}
                                className={`h-auto py-3 px-3 justify-start text-left ${value === img.image
                                        ? "bg-brand text-white"
                                        : "bg-cream-100 border-cream-200 hover:border-brand"
                                    }`}
                                onClick={() => onChange(img.image)}
                            >
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="font-medium text-sm">{img.name}</div>
                                    <div className={`text-xs ${value === img.image ? "text-white/70" : "text-text-secondary"
                                        }`}>
                                        {img.description}
                                    </div>
                                    {value === img.image && (
                                        <Check className="h-3 w-3 absolute top-2 right-2" />
                                    )}
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <div>
                {showPresets && (
                    <Label htmlFor="image" className="text-sm text-text-secondary mb-2 block">
                        Or enter custom image:
                    </Label>
                )}
                <Input
                    id="image"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={
                        isCustomDocker
                            ? "e.g. your-registry/custom-image:latest"
                            : "Pre-configured for this template"
                    }
                    className="font-mono text-sm"
                    required
                    disabled={!isCustomDocker}
                />
            </div>
        </div>
    );
}
