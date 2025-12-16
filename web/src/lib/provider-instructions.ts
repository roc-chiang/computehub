/**
 * Provider-specific instructions for obtaining API keys
 */

export interface ProviderInstruction {
    name: string;
    displayName: string;
    description: string;
    steps: string[];
    apiKeyUrl: string;
    docsUrl: string;
    icon: string;
    color: string;
}

export const providerInstructions: Record<string, ProviderInstruction> = {
    runpod: {
        name: "runpod",
        displayName: "RunPod",
        description: "High-performance GPU cloud with instant deployment",
        steps: [
            "Sign in to your RunPod account",
            "Navigate to Settings → API Keys",
            "Click 'Create API Key' button",
            "Give your key a descriptive name (e.g., 'ComputeHub')",
            "Copy the generated API key immediately (it won't be shown again)",
            "Paste the key in the field below"
        ],
        apiKeyUrl: "https://www.runpod.io/console/user/settings",
        docsUrl: "https://docs.runpod.io/docs/api-keys",
        icon: "🚀",
        color: "#7C3AED"
    },
    vast: {
        name: "vast",
        displayName: "Vast.ai",
        description: "Affordable GPU rentals from a distributed network",
        steps: [
            "Log in to your Vast.ai account",
            "Go to Account → API Keys",
            "Click 'Show API Key' or 'Generate New Key'",
            "Copy your API key",
            "Paste the key in the field below"
        ],
        apiKeyUrl: "https://cloud.vast.ai/api/",
        docsUrl: "https://vast.ai/docs/api/overview",
        icon: "⚡",
        color: "#10B981"
    },
    lambda: {
        name: "lambda",
        displayName: "Lambda Labs",
        description: "Enterprise-grade GPU cloud infrastructure",
        steps: [
            "Sign in to Lambda Cloud",
            "Navigate to API Keys section",
            "Click 'Generate API Key'",
            "Name your key (e.g., 'ComputeHub Integration')",
            "Copy the generated API key",
            "Paste the key in the field below"
        ],
        apiKeyUrl: "https://cloud.lambdalabs.com/api-keys",
        docsUrl: "https://docs.lambdalabs.com/cloud/api-keys",
        icon: "λ",
        color: "#F59E0B"
    },
    tensordock: {
        name: "tensordock",
        displayName: "TensorDock",
        description: "Flexible GPU cloud with competitive pricing",
        steps: [
            "Access your TensorDock dashboard",
            "Go to Settings → API",
            "Click 'Create New API Key'",
            "Set permissions (read/write for deployments)",
            "Copy the generated key",
            "Paste the key in the field below"
        ],
        apiKeyUrl: "https://marketplace.tensordock.com/api",
        docsUrl: "https://tensordock.com/api-docs",
        icon: "🔷",
        color: "#3B82F6"
    }
};

export const getSupportedProviders = (): ProviderInstruction[] => {
    return Object.values(providerInstructions);
};

export const getProviderInstruction = (providerName: string): ProviderInstruction | undefined => {
    return providerInstructions[providerName.toLowerCase()];
};
