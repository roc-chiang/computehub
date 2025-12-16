import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SortDirection } from "@/hooks/use-table";

interface SortableHeaderProps {
    label: string;
    sortKey: string;
    currentSortKey?: string;
    sortDirection?: SortDirection;
    onSort: (key: string) => void;
    className?: string;
}

export function SortableHeader({
    label,
    sortKey,
    currentSortKey,
    sortDirection,
    onSort,
    className,
}: SortableHeaderProps) {
    const isActive = currentSortKey === sortKey;

    return (
        <Button
            variant="ghost"
            size="sm"
            className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
            onClick={() => onSort(sortKey)}
        >
            <span>{label}</span>
            {isActive && sortDirection === "asc" && (
                <ArrowUp className="ml-2 h-4 w-4" />
            )}
            {isActive && sortDirection === "desc" && (
                <ArrowDown className="ml-2 h-4 w-4" />
            )}
            {(!isActive || !sortDirection) && (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
        </Button>
    );
}
