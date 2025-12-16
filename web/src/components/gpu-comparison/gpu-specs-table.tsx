"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { GPU_SPECS, GPUSpec, USE_CASES, sortGPUsByMetric } from "@/lib/gpu-specs";

type SortMetric = "model" | "vram" | "fp16Tflops" | "memoryBandwidth" | "tdp";

export function GPUSpecsTable() {
    const [sortBy, setSortBy] = useState<SortMetric>("fp16Tflops");
    const [sortAscending, setSortAscending] = useState(false);
    const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);

    // Filter by use case if selected
    const filteredGPUs = selectedUseCase
        ? GPU_SPECS.filter(gpu => gpu.useCases.includes(selectedUseCase))
        : GPU_SPECS;

    // Sort GPUs
    const sortedGPUs = sortGPUsByMetric(filteredGPUs, sortBy, sortAscending);

    // Find best values for highlighting
    const bestVRAM = Math.max(...sortedGPUs.map(g => g.vram));
    const bestFP16 = Math.max(...sortedGPUs.map(g => g.fp16Tflops));
    const bestBandwidth = Math.max(...sortedGPUs.map(g => g.memoryBandwidth));
    const lowestTDP = Math.min(...sortedGPUs.map(g => g.tdp));

    const handleSort = (metric: SortMetric) => {
        if (sortBy === metric) {
            setSortAscending(!sortAscending);
        } else {
            setSortBy(metric);
            setSortAscending(false);
        }
    };

    const SortIcon = ({ metric }: { metric: SortMetric }) => {
        if (sortBy !== metric) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
        return sortAscending ?
            <ArrowUp className="h-4 w-4 ml-1" /> :
            <ArrowDown className="h-4 w-4 ml-1" />;
    };

    return (
        <Card className="bg-cream-100">
            <CardHeader>
                <CardTitle>GPU Performance Specifications</CardTitle>
                <CardDescription>
                    Compare technical specifications and performance metrics
                </CardDescription>

                {/* Use Case Filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                        variant={selectedUseCase === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedUseCase(null)}
                    >
                        All GPUs
                    </Button>
                    {Object.entries(USE_CASES).map(([key, useCase]) => (
                        <Button
                            key={key}
                            variant={selectedUseCase === key ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedUseCase(key)}
                        >
                            {useCase.icon} {useCase.label}
                        </Button>
                    ))}
                </div>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="font-bold"
                                        onClick={() => handleSort("model")}
                                    >
                                        GPU Model
                                        <SortIcon metric="model" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSort("vram")}
                                    >
                                        VRAM
                                        <SortIcon metric="vram" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSort("fp16Tflops")}
                                    >
                                        FP16 TFLOPS
                                        <SortIcon metric="fp16Tflops" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSort("memoryBandwidth")}
                                    >
                                        Bandwidth
                                        <SortIcon metric="memoryBandwidth" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSort("tdp")}
                                    >
                                        TDP
                                        <SortIcon metric="tdp" />
                                    </Button>
                                </TableHead>
                                <TableHead>Architecture</TableHead>
                                <TableHead>Use Cases</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedGPUs.map((gpu) => (
                                <TableRow key={gpu.model}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{gpu.icon}</span>
                                            <div>
                                                <div>{gpu.displayName}</div>
                                                <div className="text-xs text-text-secondary">
                                                    {gpu.description}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={gpu.vram === bestVRAM ? "font-bold text-accent-success" : ""}>
                                                {gpu.vram} GB
                                            </span>
                                            {gpu.vram === bestVRAM && (
                                                <Badge variant="default" className="text-xs">Best</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={gpu.fp16Tflops === bestFP16 ? "font-bold text-accent-success" : ""}>
                                                {gpu.fp16Tflops.toFixed(1)}
                                            </span>
                                            {gpu.fp16Tflops === bestFP16 && (
                                                <Badge variant="default" className="text-xs">Fastest</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={gpu.memoryBandwidth === bestBandwidth ? "font-bold text-accent-success" : ""}>
                                                {gpu.memoryBandwidth} GB/s
                                            </span>
                                            {gpu.memoryBandwidth === bestBandwidth && (
                                                <Badge variant="default" className="text-xs">Best</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={gpu.tdp === lowestTDP ? "font-bold text-accent-success" : ""}>
                                                {gpu.tdp}W
                                            </span>
                                            {gpu.tdp === lowestTDP && (
                                                <Badge variant="default" className="text-xs">Efficient</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div>{gpu.architecture}</div>
                                            <div className="text-xs text-text-secondary">
                                                {gpu.releaseYear}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {gpu.useCases.slice(0, 3).map(useCase => (
                                                <Badge key={useCase} variant="outline" className="text-xs">
                                                    {USE_CASES[useCase as keyof typeof USE_CASES]?.icon}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Legend */}
                <div className="mt-4 p-4 bg-cream-50 rounded-lg">
                    <p className="text-sm text-text-secondary">
                        <strong>Performance Metrics:</strong> FP16 TFLOPS = Half-precision floating-point performance (higher is better for AI workloads).
                        Memory Bandwidth = Data transfer speed between GPU and VRAM (higher is better for large models).
                        TDP = Thermal Design Power, power consumption in watts (lower is more efficient).
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
