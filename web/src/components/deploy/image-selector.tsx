import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface CommonImage {
    name: string;
    image: string;
    description: string;
}

const commonImages: CommonImage[] = [
    {
        name: "PyTorch 2.0",
        image: "runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel",
        description: "PyTorch with CUDA 11.8"
    },
    {
        name: "TensorFlow",
        image: "runpod/tensorflow",
        description: "Official TensorFlow GPU"
    },
    {
        name: "Stable Diffusion",
        image: "runpod/stable-diffusion:web-ui-10.2.1",
        description: "SD WebUI"
    },
    {
        name: "Base CUDA",
        image: "runpod/base:0.4.0-cuda11.8.0",
        description: "Minimal CUDA environment"
    }
];

interface ImageSelectorProps {
    value: string;
    onChange: (value: string) => void;
    provider: "auto" | "local" | "runpod" | "vast";
}

export function ImageSelector({ value, onChange, provider }: ImageSelectorProps) {
    const showCommonImages = provider === "runpod" || provider === "vast" || provider === "auto";

    return (
        <div className="space-y-3">
            <div>
                <Label htmlFor="image">Docker Image <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground mt-1">
                    {showCommonImages
                        ? "Select a common image or enter a custom Docker image name"
                        : "Enter any Docker image name"}
                </p>
            </div>

            {showCommonImages && (
                <div className="grid grid-cols-2 gap-2">
                    {commonImages.map((img) => (
                        <Button
                            key={img.image}
                            type="button"
                            variant={value === img.image ? "default" : "outline"}
                            className="h-auto py-2 px-3 justify-start text-left"
                            onClick={() => onChange(img.image)}
                        >
                            <div className="flex items-start gap-2 w-full">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{img.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {img.description}
                                    </div>
                                </div>
                                {value === img.image && (
                                    <Check className="h-4 w-4 flex-shrink-0" />
                                )}
                            </div>
                        </Button>
                    ))}
                </div>
            )}

            <div>
                <Input
                    id="image"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={showCommonImages
                        ? "Or enter custom image (e.g. runpod/pytorch:latest)"
                        : "e.g. pytorch/pytorch:latest"}
                    className="font-mono text-sm"
                    required
                />
            </div>
        </div>
    );
}
