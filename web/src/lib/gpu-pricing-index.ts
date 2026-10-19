export type PricingIndexEntry = {
  provider: "RunPod" | "Lambda";
  product: string;
  gpu: string;
  vramGb: number;
  priceUsdPerGpuHour: number;
  billing: string;
  sourceUrl: string;
  sourceUpdated: string;
};

export const PRICING_INDEX_AS_OF = "2026-10-19";

export const GPU_PRICING_INDEX: PricingIndexEntry[] = [
  { provider: "RunPod", product: "Pod · Community Cloud", gpu: "H100 PCIe", vramGb: 80, priceUsdPerGpuHour: 2.89, billing: "On demand", sourceUrl: "https://www.runpod.io/pricing", sourceUpdated: "2026-10-08" },
  { provider: "RunPod", product: "Pod · Community Cloud", gpu: "A100 PCIe", vramGb: 80, priceUsdPerGpuHour: 1.79, billing: "On demand", sourceUrl: "https://www.runpod.io/pricing", sourceUpdated: "2026-10-08" },
  { provider: "RunPod", product: "Pod · Community Cloud", gpu: "L40S", vramGb: 48, priceUsdPerGpuHour: 1.09, billing: "On demand", sourceUrl: "https://www.runpod.io/pricing", sourceUpdated: "2026-10-08" },
  { provider: "RunPod", product: "Pod · Community Cloud", gpu: "RTX A6000", vramGb: 48, priceUsdPerGpuHour: 0.59, billing: "On demand", sourceUrl: "https://www.runpod.io/pricing", sourceUpdated: "2026-10-08" },
  { provider: "RunPod", product: "Pod · Community Cloud", gpu: "RTX 4090", vramGb: 24, priceUsdPerGpuHour: 0.89, billing: "On demand", sourceUrl: "https://www.runpod.io/pricing", sourceUpdated: "2026-10-08" },
  { provider: "RunPod", product: "Pod · Community Cloud", gpu: "RTX 3090", vramGb: 24, priceUsdPerGpuHour: 0.5, billing: "On demand", sourceUrl: "https://www.runpod.io/pricing", sourceUpdated: "2026-10-08" },
  { provider: "Lambda", product: "1× GPU instance", gpu: "H100 PCIe", vramGb: 80, priceUsdPerGpuHour: 3.29, billing: "Pay by the minute", sourceUrl: "https://lambda.ai/instances", sourceUpdated: "2026-10-19" },
  { provider: "Lambda", product: "1× GPU instance", gpu: "A100 PCIe", vramGb: 40, priceUsdPerGpuHour: 1.99, billing: "Pay by the minute", sourceUrl: "https://lambda.ai/instances", sourceUpdated: "2026-10-19" },
  { provider: "Lambda", product: "1× GPU instance", gpu: "RTX A6000", vramGb: 48, priceUsdPerGpuHour: 1.09, billing: "Pay by the minute", sourceUrl: "https://lambda.ai/instances", sourceUpdated: "2026-10-19" },
];

export const cheapestEntry = GPU_PRICING_INDEX.reduce((best, entry) =>
  entry.priceUsdPerGpuHour < best.priceUsdPerGpuHour ? entry : best
);
