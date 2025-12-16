import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    status: string;
    className?: string;
}

const statusConfig = {
    running: {
        label: "Running",
        className: "bg-green-500/10 text-green-600 border-green-500/20 status-running",
    },
    stopped: {
        label: "Stopped",
        className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    },
    pending: {
        label: "Pending",
        className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 status-pending",
    },
    error: {
        label: "Error",
        className: "bg-red-500/10 text-red-600 border-red-500/20",
    },
    creating: {
        label: "Creating",
        className: "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse-slow",
    },
    deleting: {
        label: "Deleting",
        className: "bg-orange-500/10 text-orange-600 border-orange-500/20 animate-pulse-slow",
    },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.stopped;

    return (
        <Badge
            variant="outline"
            className={cn(
                "font-medium transition-smooth",
                config.className,
                className
            )}
        >
            {config.label}
        </Badge>
    );
}
