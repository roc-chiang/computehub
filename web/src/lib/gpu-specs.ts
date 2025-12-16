/**
 * GPU Specifications Database
 * Static data for GPU performance comparison
 */

export interface GPUSpec {
    model: string;
    displayName: string;
    vram: number; // GB
    cudaCores?: number;
    tensorCores?: number;
    fp32Tflops: number;
    fp16Tflops: number;
    memoryBandwidth: number; // GB/s
    tdp: number; // Watts
    architecture: string;
    releaseYear: number;
    useCases: string[];
    icon: string;
    description: string;
}

export const GPU_SPECS: GPUSpec[] = [
    {
        model: "H100",
        displayName: "NVIDIA H100",
        vram: 80,
        tensorCores: 456,
        fp32Tflops: 51,
        fp16Tflops: 1979,
        memoryBandwidth: 3350,
        tdp: 700,
        architecture: "Hopper",
        releaseYear: 2022,
        useCases: ["llm-training", "large-inference", "research"],
        icon: "🚀",
        description: "Flagship GPU for large-scale AI training and inference"
    },
    {
        model: "A100",
        displayName: "NVIDIA A100 80GB",
        vram: 80,
        tensorCores: 432,
        fp32Tflops: 19.5,
        fp16Tflops: 312,
        memoryBandwidth: 2039,
        tdp: 400,
        architecture: "Ampere",
        releaseYear: 2020,
        useCases: ["llm-training", "inference", "research"],
        icon: "⚡",
        description: "Versatile datacenter GPU for AI workloads"
    },
    {
        model: "RTX 4090",
        displayName: "NVIDIA RTX 4090",
        vram: 24,
        cudaCores: 16384,
        tensorCores: 512,
        fp32Tflops: 82.6,
        fp16Tflops: 165.2,
        memoryBandwidth: 1008,
        tdp: 450,
        architecture: "Ada Lovelace",
        releaseYear: 2022,
        useCases: ["inference", "image-gen", "fine-tuning"],
        icon: "🎮",
        description: "High-performance consumer GPU for AI inference and generation"
    },
    {
        model: "RTX 3090",
        displayName: "NVIDIA RTX 3090",
        vram: 24,
        cudaCores: 10496,
        tensorCores: 328,
        fp32Tflops: 35.6,
        fp16Tflops: 71,
        memoryBandwidth: 936,
        tdp: 350,
        architecture: "Ampere",
        releaseYear: 2020,
        useCases: ["inference", "image-gen", "budget"],
        icon: "💎",
        description: "Budget-friendly option for AI development and experimentation"
    },
    {
        model: "A6000",
        displayName: "NVIDIA RTX A6000",
        vram: 48,
        cudaCores: 10752,
        tensorCores: 336,
        fp32Tflops: 38.7,
        fp16Tflops: 77.4,
        memoryBandwidth: 768,
        tdp: 300,
        architecture: "Ampere",
        releaseYear: 2020,
        useCases: ["inference", "fine-tuning", "professional"],
        icon: "🏢",
        description: "Professional workstation GPU with large VRAM"
    },
    {
        model: "L40S",
        displayName: "NVIDIA L40S",
        vram: 48,
        cudaCores: 18176,
        tensorCores: 568,
        fp32Tflops: 91.6,
        fp16Tflops: 183.2,
        memoryBandwidth: 864,
        tdp: 350,
        architecture: "Ada Lovelace",
        releaseYear: 2023,
        useCases: ["inference", "fine-tuning", "professional"],
        icon: "🔧",
        description: "Latest professional GPU for AI and graphics workloads"
    }
];

export const USE_CASES = {
    "llm-training": {
        label: "LLM Training",
        description: "Training large language models (70B+ parameters)",
        icon: "🧠",
        recommendedGPUs: ["H100", "A100"]
    },
    "large-inference": {
        label: "Large Model Inference",
        description: "Running inference on 70B+ parameter models",
        icon: "🤖",
        recommendedGPUs: ["H100", "A100"]
    },
    "inference": {
        label: "Standard Inference",
        description: "Running 7B-13B models for inference",
        icon: "💬",
        recommendedGPUs: ["RTX 4090", "A6000", "L40S"]
    },
    "image-gen": {
        label: "Image Generation",
        description: "Stable Diffusion, DALL-E, and other image models",
        icon: "🎨",
        recommendedGPUs: ["RTX 4090", "RTX 3090"]
    },
    "fine-tuning": {
        label: "Fine-tuning",
        description: "LoRA, QLoRA, and parameter-efficient fine-tuning",
        icon: "⚙️",
        recommendedGPUs: ["RTX 4090", "A6000", "L40S"]
    },
    "budget": {
        label: "Budget/Learning",
        description: "Experimentation and learning on a budget",
        icon: "💰",
        recommendedGPUs: ["RTX 3090"]
    },
    "professional": {
        label: "Professional",
        description: "Enterprise and production workloads",
        icon: "🏢",
        recommendedGPUs: ["A6000", "L40S", "A100"]
    },
    "research": {
        label: "Research",
        description: "Academic and research projects",
        icon: "🔬",
        recommendedGPUs: ["H100", "A100"]
    }
};

// Helper functions
export function getGPUByModel(model: string): GPUSpec | undefined {
    return GPU_SPECS.find(gpu => gpu.model === model);
}

export function getGPUsByUseCase(useCase: string): GPUSpec[] {
    return GPU_SPECS.filter(gpu => gpu.useCases.includes(useCase));
}

export function sortGPUsByMetric(gpus: GPUSpec[], metric: keyof GPUSpec, ascending = false): GPUSpec[] {
    return [...gpus].sort((a, b) => {
        const aVal = a[metric];
        const bVal = b[metric];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return ascending ? aVal - bVal : bVal - aVal;
        }
        return 0;
    });
}

export function calculatePricePerformance(gpu: GPUSpec, pricePerHour: number): {
    tflopsPerDollar: number;
    vramPerDollar: number;
} {
    const monthlyPrice = pricePerHour * 24 * 30;
    return {
        tflopsPerDollar: gpu.fp16Tflops / monthlyPrice,
        vramPerDollar: gpu.vram / monthlyPrice
    };
}
