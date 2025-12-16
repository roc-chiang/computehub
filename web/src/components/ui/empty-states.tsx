import { FileQuestion, FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    const DefaultIcon = icon || <FolderOpen className="h-16 w-16 text-muted-foreground/50" />;

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="mb-4 opacity-50">
                {DefaultIcon}
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
                {description}
            </p>
            {action && (
                action.href ? (
                    <Link href={action.href}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {action.label}
                        </Button>
                    </Link>
                ) : (
                    <Button onClick={action.onClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {action.label}
                    </Button>
                )
            )}
        </div>
    );
}

export function NoDeploymentsEmpty() {
    return (
        <EmptyState
            title="No deployments yet"
            description="Get started by creating your first GPU deployment. Choose from our templates or configure a custom setup."
            action={{
                label: "Create Deployment",
                href: "/deploy/new"
            }}
        />
    );
}

export function NoProvidersEmpty() {
    return (
        <EmptyState
            title="No providers configured"
            description="Add a compute provider to start deploying GPU instances. Configure RunPod, Vast.ai, or local providers."
            action={{
                label: "Add Provider",
                href: "/admin/providers"
            }}
        />
    );
}

export function NoResultsEmpty({ searchTerm }: { searchTerm?: string }) {
    return (
        <EmptyState
            icon={<FileQuestion className="h-16 w-16 text-muted-foreground/50" />}
            title="No results found"
            description={searchTerm ? `No results found for "${searchTerm}". Try adjusting your search.` : "No results found. Try adjusting your filters."}
        />
    );
}
