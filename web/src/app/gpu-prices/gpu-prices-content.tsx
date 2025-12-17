"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Clock, TrendingUp, TrendingDown, Minus, Rocket, Filter, ArrowUpDown, Download } from "lucide-react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { GPUSpecsTable } from "@/components/gpu-comparison/gpu-specs-table";

interface ProviderPrice {
    provider: string;
    price_per_hour: number | null;
    available: boolean;
    is_best: boolean;
}

interface GPUPriceData {
    gpu_type: string;
    prices: ProviderPrice[];
    best_provider: string | null;
    best_price: number | null;
    trend_percentage: number | null;
}

export default function GPUPricesDashboard() {
    const [prices, setPrices] = useState<GPUPriceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Filter and sort state
    const [selectedGPU, setSelectedGPU] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"name" | "price-low" | "price-high">("name");

    const fetchPrices = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/v1/public/gpu-prices");
            if (response.ok) {
                const data = await response.json();
                setPrices(data);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error("Error fetching prices:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchPrices();
    }, []);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(fetchPrices, 60000); // 60 seconds
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const TrendIndicator = ({ trend }: { trend: number | null }) => {
        if (trend === null || trend === 0) {
            return (
                <div className="flex items-center text-text-secondary">
                    <Minus className="h-4 w-4 mr-1" />
                    <span className="text-sm">0%</span>
                </div>
            );
        }

        if (trend > 0) {
            return (
                <div className="flex items-center text-accent-error">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">+{trend.toFixed(1)}%</span>
                </div>
            );
        }

        return (
            <div className="flex items-center text-accent-success">
                <TrendingDown className="h-4 w-4 mr-1" />
                <span className="text-sm">{trend.toFixed(1)}%</span>
            </div>
        );
    };

    // Get unique GPU types for filter
    const gpuTypes = ["all", ...Array.from(new Set(prices.map(p => p.gpu_type)))];

    // Get all unique providers from the data
    const allProviders = Array.from(
        new Set(
            prices.flatMap(gpu => gpu.prices.map(p => p.provider))
        )
    ).sort();

    // Provider display names
    const providerDisplayNames: Record<string, string> = {
        "runpod": "RunPod",
        "vast": "Vast.ai",
        "lambda": "Lambda Labs",
        "tensordock": "TensorDock",
    };

    // Filter and sort prices
    const filteredAndSortedPrices = prices
        .filter(gpu => selectedGPU === "all" || gpu.gpu_type === selectedGPU)
        .sort((a, b) => {
            if (sortBy === "name") {
                return a.gpu_type.localeCompare(b.gpu_type);
            } else if (sortBy === "price-low") {
                const priceA = a.best_price || Infinity;
                const priceB = b.best_price || Infinity;
                return priceA - priceB;
            } else { // price-high
                const priceA = a.best_price || -Infinity;
                const priceB = b.best_price || -Infinity;
                return priceB - priceA;
            }
        });

    // Export to CSV
    const exportToCSV = () => {
        const csvRows = [
            ["GPU Type", "Provider", "Price ($/hour)", "Available"],
            ...filteredAndSortedPrices.flatMap(gpu =>
                gpu.prices.map(p => [
                    gpu.gpu_type,
                    p.provider,
                    p.price_per_hour?.toFixed(4) || "N/A",
                    p.available ? "Yes" : "No"
                ])
            )
        ];
        const csvContent = csvRows.map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gpu-prices-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    return (
        <div className="flex min-h-screen flex-col bg-cream-50 text-text-primary selection:bg-brand/20">
            <LandingHeader />

            <main className="flex-1 pt-16">
                <div className="container mx-auto py-12 px-4">
                    {/* Hero Section */}
                    <section className="text-center mb-12">
                        <h1 className="homepage-h1 md:homepage-h1 homepage-h1-mobile mb-4 bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-transparent">
                            Real-Time GPU Cloud Prices
                        </h1>
                        <p className="homepage-h3 md:homepage-h3 homepage-h3-mobile text-text-secondary mb-2">
                            A100 · H100 · RTX 4090 · L40S · A6000 · RTX 3090
                        </p>
                        <p className="homepage-body text-text-secondary mb-6">
                            Compare GPU prices across RunPod, Vast.ai, TensorDock, and more. Updated every 60 seconds.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4 mt-6">
                            {mounted && lastUpdate && (
                                <Badge variant="outline" className="text-sm py-2 px-4">
                                    <Clock className="h-3 w-3 mr-2" />
                                    Last updated: {lastUpdate.toLocaleTimeString()}
                                </Badge>
                            )}
                            <Button
                                onClick={fetchPrices}
                                variant="outline"
                                size="sm"
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                                Refresh Now
                            </Button>
                            <Button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                variant={autoRefresh ? "default" : "outline"}
                                size="sm"
                            >
                                Auto-refresh: {autoRefresh ? "ON" : "OFF"}
                            </Button>
                        </div>
                    </section>

                    {/* Price Comparison Table */}
                    <Card className="bg-cream-100">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <CardTitle>GPU Price Comparison</CardTitle>
                                    <CardDescription>
                                        Find the best prices for your AI workloads
                                    </CardDescription>
                                </div>

                                {/* Filter and Sort Controls */}
                                <div className="flex flex-wrap gap-2">
                                    <Select value={selectedGPU} onValueChange={setSelectedGPU}>
                                        <SelectTrigger className="w-[180px]">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder="Filter GPU" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gpuTypes.map(gpu => (
                                                <SelectItem key={gpu} value={gpu}>
                                                    {gpu === "all" ? "All GPUs" : gpu}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                        <SelectTrigger className="w-[180px]">
                                            <ArrowUpDown className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name">Name (A-Z)</SelectItem>
                                            <SelectItem value="price-low">Price (Low to High)</SelectItem>
                                            <SelectItem value="price-high">Price (High to Low)</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={exportToCSV}
                                        disabled={prices.length === 0}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-bold">GPU Model</TableHead>
                                            {allProviders.map(provider => (
                                                <TableHead key={provider}>
                                                    {providerDisplayNames[provider] || provider}
                                                </TableHead>
                                            ))}
                                            <TableHead>Trend (24h)</TableHead>
                                            <TableHead>Best Price</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={allProviders.length + 4} className="text-center py-8">
                                                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                                    <p className="text-text-secondary">Loading prices...</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : prices.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={allProviders.length + 4} className="text-center py-8 text-text-secondary">
                                                    No pricing data available
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredAndSortedPrices.map((gpu) => (
                                                <TableRow key={gpu.gpu_type}>
                                                    <TableCell className="font-medium">{gpu.gpu_type}</TableCell>

                                                    {/* Dynamic Provider Columns */}
                                                    {allProviders.map(providerName => {
                                                        const providerPrice = gpu.prices.find(p => p.provider === providerName);
                                                        return (
                                                            <TableCell key={providerName}>
                                                                {providerPrice?.available && providerPrice.price_per_hour ? (
                                                                    <span className={providerPrice.is_best ? "text-accent-success font-bold" : "text-text-primary"}>
                                                                        {providerPrice.is_best && "✅ "}
                                                                        ${providerPrice.price_per_hour.toFixed(2)}/h
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-text-secondary">N/A</span>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}

                                                    {/* Trend */}
                                                    <TableCell>
                                                        <TrendIndicator trend={gpu.trend_percentage} />
                                                    </TableCell>

                                                    {/* Best Price */}
                                                    <TableCell>
                                                        {gpu.best_price ? (
                                                            <div>
                                                                <div className="font-bold text-accent-success">
                                                                    ${gpu.best_price.toFixed(2)}/h
                                                                </div>
                                                                <div className="text-xs text-text-secondary">
                                                                    {gpu.best_provider}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-text-secondary">N/A</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Action */}
                                                    <TableCell>
                                                        <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white">
                                                            <Link href={`/deploy/new?gpu=${encodeURIComponent(gpu.gpu_type)}&provider=${gpu.best_provider || ""}`}>
                                                                <Rocket className="h-4 w-4 mr-2" />
                                                                Launch
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* GPU Performance Specifications */}
                    <section className="mt-12">
                        <GPUSpecsTable />
                    </section>

                    {/* SEO Content Section */}
                    <section className="mt-12 prose prose-slate max-w-none">
                        <Card className="bg-cream-100">
                            <CardContent className="pt-6">
                                <h2 className="homepage-h2 text-text-primary mb-4">What is the cheapest GPU cloud today?</h2>
                                <p className="homepage-body text-text-secondary mb-4">
                                    Based on real-time data from multiple providers, our dashboard shows you the most competitive GPU prices across the market.
                                    Whether you're training large language models, running AI inference, or rendering graphics, finding the right GPU at the best price is crucial for your budget.
                                </p>

                                <h2 className="homepage-h2 text-text-primary mb-4 mt-8">Why are GPU prices different across providers?</h2>
                                <p className="homepage-body text-text-secondary mb-4">
                                    GPU cloud pricing varies based on several factors including datacenter location, availability, demand, and provider overhead.
                                    RunPod, Vast.ai, and TensorDock each have different pricing strategies and infrastructure costs. Our platform aggregates these prices in real-time so you can make informed decisions.
                                </p>

                                <h2 className="homepage-h2 text-text-primary mb-4 mt-8">How to choose the best GPU for AI training?</h2>
                                <p className="homepage-body text-text-secondary mb-4">
                                    Consider these factors when selecting a GPU:
                                </p>
                                <ul className="list-disc list-inside homepage-body text-text-secondary space-y-2 mb-4">
                                    <li><strong className="text-text-primary">Model size and memory requirements</strong> - Larger models need GPUs with more VRAM (A100 80GB, H100)</li>
                                    <li><strong className="text-text-primary">Training duration and budget</strong> - Balance performance with cost per hour</li>
                                    <li><strong className="text-text-primary">Provider reliability</strong> - Check uptime and support quality</li>
                                    <li><strong className="text-text-primary">Availability</strong> - Popular GPUs may have limited availability during peak times</li>
                                </ul>

                                <p className="homepage-body text-text-secondary">
                                    Use our comparison dashboard to find the perfect balance between performance and cost for your specific workload.
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Schema.org JSON-LD */}
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                "@context": "https://schema.org",
                                "@type": "Product",
                                "name": "GPU Cloud Hosting",
                                "description": "Real-time GPU cloud price comparison",
                                "offers": {
                                    "@type": "AggregateOffer",
                                    "lowPrice": prices.length > 0 ? Math.min(...prices.filter(p => p.best_price).map(p => p.best_price!)) : "0.34",
                                    "highPrice": prices.length > 0 ? Math.max(...prices.filter(p => p.best_price).map(p => p.best_price!)) : "3.20",
                                    "priceCurrency": "USD"
                                }
                            })
                        }}
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
}
