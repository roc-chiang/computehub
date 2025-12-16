import { Card } from "@/components/ui/card";
import { Check, Cloud, Laptop, Sparkles } from "lucide-react"; // Added Sparkles

export interface Provider {
    id: "auto" | "local" | "runpod" | "vast";
    name: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
}

const providers: Provider[] = [
    {
        id: "auto",
        name: "Smart Auto-Select",
        description: "Best available GPU (Lowest Price & Best Availability)",
        icon: <Sparkles className="h-6 w-6" />,
        badge: "Recommended"
    },
    {
        id: "runpod",
        name: "RunPod",
        description: "Direct RunPod instance",
        icon: <Cloud className="h-6 w-6" />,
        badge: "Production"
    },
    {
        id: "vast",
        name: "Vast.ai",
        description: "Decentralized GPU marketplace (Cheapest)",
        icon: <Cloud className="h-6 w-6 text-blue-400" />,
        badge: "Beta"
    },
    {
        id: "local",
        name: "Local (Mock)",
        description: "Dev/Test environment",
        icon: <Laptop className="h-6 w-6" />,
        badge: "Dev"
    }
];

interface ProviderSelectorProps {
    selectedProvider: "auto" | "local" | "runpod" | "vast";
    onSelect: (providerId: "auto" | "local" | "runpod" | "vast") => void;
}

export function ProviderSelector({ selectedProvider, onSelect }: ProviderSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => (
                <Card
                    key={provider.id}
                    className={`relative cursor-pointer transition-all hover:border-primary/50 ${selectedProvider === provider.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border"
                        }`}
                    onClick={() => onSelect(provider.id)}
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg ${selectedProvider === provider.id
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground"
                                    }`}>
                                    {provider.icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{provider.name}</h3>
                                        {provider.badge && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                {provider.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {provider.description}
                                    </p>
                                </div>
                            </div>
                            {selectedProvider === provider.id && (
                                <Check className="h-5 w-5 text-primary" />
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
