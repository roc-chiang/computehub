"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit, Rocket } from "lucide-react";
import { getTemplates, deleteTemplate, type DeploymentTemplate } from "@/lib/templates-api";
import { useAuth } from "@clerk/nextjs";
import { setAuthToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<DeploymentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { toast } = useToast();

    const fetchTemplates = async () => {
        if (!isLoaded || !isSignedIn) {
            setLoading(false);
            return;
        }

        try {
            const token = await getToken();
            setAuthToken(token);
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error("Error fetching templates:", error);
            toast({
                title: "Error",
                description: "Failed to load templates",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [isLoaded, isSignedIn, getToken]);

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteTemplate(deleteId);
            toast({
                title: "Success",
                description: "Template deleted successfully",
            });
            fetchTemplates();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete template",
                variant: "destructive",
            });
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-3xl font-bold tracking-tight">Deployment Templates</h3>
                    <p className="text-muted-foreground">
                        Save and reuse deployment configurations
                    </p>
                </div>
                <Button onClick={() => window.location.href = "/deploy/new?create_template=true"}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                </Button>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create your first template to save time on future deployments
                        </p>
                        <Button onClick={() => window.location.href = "/deploy/new?create_template=true"}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <Card key={template.id} className="hover:border-primary transition-colors">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <Rocket className="h-5 w-5" />
                                            {template.name}
                                        </CardTitle>
                                        {template.description && (
                                            <CardDescription className="mt-2">
                                                {template.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">GPU:</span>
                                        <span className="font-medium">{template.gpu_type} x{template.gpu_count}</span>
                                    </div>
                                    {template.provider && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Provider:</span>
                                            <span className="font-medium capitalize">{template.provider}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Image:</span>
                                        <span className="font-medium truncate max-w-[150px]" title={template.image}>
                                            {template.image.split("/").pop()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => window.location.href = `/deploy/new?template=${template.id}`}
                                    >
                                        <Rocket className="h-4 w-4 mr-2" />
                                        Use
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDeleteId(template.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the template.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
