import { Rocket, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function NoDeploymentsEmpty() {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="mb-6 p-4 rounded-full bg-primary/10">
                    <Rocket className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No deployments yet</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                    Get started by creating your first GPU deployment. Choose from our templates or configure a custom setup.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Link href="/deploy/new">
                        <Button size="lg" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Your First Deployment
                        </Button>
                    </Link>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg max-w-md">
                    <p className="text-sm font-medium mb-2">💡 Quick Start Tips:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 text-left">
                        <li>• Choose a template to get started quickly</li>
                        <li>• Select the GPU that fits your budget</li>
                        <li>• We'll automatically pick the cheapest provider</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}

export function NoProvidersEmpty() {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="mb-6 p-4 rounded-full bg-primary/10">
                    <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No providers configured</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                    Add a compute provider to start deploying GPU instances. Configure RunPod, Vast.ai, or use local resources.
                </p>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg max-w-md">
                    <p className="text-sm font-medium mb-2">🔧 Supported Providers:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 text-left">
                        <li>• <strong>RunPod</strong> - Easy setup, great for beginners</li>
                        <li>• <strong>Vast.ai</strong> - Competitive pricing</li>
                        <li>• <strong>Local</strong> - Use your own infrastructure</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}

export function NoSearchResultsEmpty({ searchTerm }: { searchTerm: string }) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="mb-4 p-3 rounded-full bg-muted">
                    <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground max-w-sm mb-4">
                    No results found for <strong>"{searchTerm}"</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter to find what you're looking for.
                </p>
            </CardContent>
        </Card>
    );
}

export function NoLogsEmpty() {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="mb-4 p-3 rounded-full bg-muted">
                    <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No logs available</h3>
                <p className="text-muted-foreground max-w-sm">
                    Logs will appear here once the deployment starts generating output.
                </p>
            </CardContent>
        </Card>
    );
}

export function NoFilesEmpty() {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="mb-4 p-3 rounded-full bg-muted">
                    <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Directory is empty</h3>
                <p className="text-muted-foreground max-w-sm">
                    This directory doesn't contain any files yet.
                </p>
            </CardContent>
        </Card>
    );
}

export function ErrorStateEmpty({
    title = "Something went wrong",
    message = "We encountered an error. Please try again.",
    onRetry
}: {
    title?: string;
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="mb-4 p-3 rounded-full bg-destructive/10">
                    <svg className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground max-w-sm mb-4">{message}</p>
                {onRetry && (
                    <Button onClick={onRetry} variant="outline">
                        Try Again
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
