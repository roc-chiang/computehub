import { Skeleton } from "@/components/ui/skeleton";

export function DeploymentDetailsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Overview Card Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-6 border rounded-lg bg-card space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                ))}
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-4">
                <div className="flex gap-4 border-b">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-24" />
                    ))}
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    );
}

export function MetricsChartSkeleton() {
    return (
        <div className="p-6 border rounded-lg bg-card space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    );
}

export function LogViewerSkeleton() {
    return (
        <div className="p-4 border rounded-lg bg-card font-mono text-sm space-y-2">
            {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" style={{ width: `${60 + Math.random() * 40}%` }} />
            ))}
        </div>
    );
}

export function FileBrowserSkeleton() {
    return (
        <div className="border rounded-lg bg-card">
            <div className="p-4 border-b">
                <Skeleton className="h-8 w-64" />
            </div>
            <div className="p-4 space-y-2">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-4 flex-1" style={{ width: `${40 + Math.random() * 40}%` }} />
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
            </div>
        </div>
    );
}
