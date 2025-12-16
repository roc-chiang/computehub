import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeploymentStatusProps {
    status: string;
}

export function StatusBadge({ status }: DeploymentStatusProps) {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "creating" || normalizedStatus === "pending") {
        return (
            <div className="flex items-center gap-2 text-yellow-500">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                </span>
                <span className="text-sm font-medium capitalize">{status}</span>
            </div>
        );
    }

    if (normalizedStatus === "running") {
        return (
            <div className="flex items-center gap-2 text-green-500">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                </span>
                <span className="text-sm font-medium capitalize">{status}</span>
            </div>
        );
    }

    if (normalizedStatus === "error" || normalizedStatus === "failed") {
        return (
            <div className="flex items-center gap-2 text-destructive">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive"></span>
                <span className="text-sm font-medium capitalize">{status}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"></span>
            <span className="text-sm font-medium capitalize">{status}</span>
        </div>
    );
}
