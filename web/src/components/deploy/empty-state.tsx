import { Rocket, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function EmptyState() {
    return (
        <Card className="border-dashed animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="mb-6 p-4 rounded-full bg-primary/10 animate-scale-in">
                    <Rocket className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No deployments yet</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                    Get started by creating your first GPU deployment. Choose from our templates or configure a custom setup.
                </p>
                <Link href="/deploy/new">
                    <Button size="lg" className="gap-2 hover-lift">
                        <Plus className="h-4 w-4" />
                        Create Your First Deployment
                    </Button>
                </Link>
                <div className="mt-6 p-4 bg-muted/50 rounded-lg max-w-md animate-slide-in-bottom">
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
