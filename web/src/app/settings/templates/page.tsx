"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Rocket, Cpu, Image as ImageIcon, Code, Database, Zap, Star, TrendingUp } from "lucide-react";
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

interface OfficialTemplate {
    id: number;
    name: string;
    description: string;
    category: string;
    image: string;
    gpu_type: string;
    gpu_count: number;
    exposed_port: number | null;
    is_official: boolean;
    usage_count: number;
}

const CATEGORY_ICONS: Record<string, any> = {
    "ai-inference": Cpu,
    "image-generation": ImageIcon,
    "dev-environment": Code,
    "data-science": Database,
    "other": Zap
};

const CATEGORY_LABELS: Record<string, string> = {
    "ai-inference": "AI Inference",
    "image-generation": "Image Generation",
    "dev-environment": "Development",
    "data-science": "Data Science",
    "training": "Training",
    "other": "Other"
};

export default function TemplatesPage() {
    const [userTemplates, setUserTemplates] = useState<DeploymentTemplate[]>([]);
    const [officialTemplates, setOfficialTemplates] = useState<OfficialTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { toast } = useToast();

    const fetchUserTemplates = async () => {
        if (!isLoaded || !isSignedIn) {
            setLoading(false);
            return;
        }

        try {
            const token = await getToken();
            setAuthToken(token);
            const data = await getTemplates();
            setUserTemplates(data);
        } catch (error) {
            console.error("Error fetching user templates:", error);
        }
    };

    const fetchOfficialTemplates = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const response = await fetch(`${API_URL}/api/v1/templates/official`);
            if (response.ok) {
                const data = await response.json();
                setOfficialTemplates(data);
            }
        } catch (error) {
            console.error("Error fetching official templates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserTemplates();
        fetchOfficialTemplates();
    }, [isLoaded, isSignedIn, getToken]);

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteTemplate(deleteId);
            toast({
                title: "Success",
                description: "Template deleted successfully",
            });
            fetchUserTemplates();
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

    const filteredOfficialTemplates = officialTemplates.filter(t => {
        const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h3 className="text-3xl font-bold tracking-tight">Deployment Templates</h3>
                <p className="text-muted-foreground">
                    Deploy from official templates or create your own
                </p>
            </div>

            <Tabs defaultValue="official" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="official">Official Templates</TabsTrigger>
                    <TabsTrigger value="my-templates">My Templates</TabsTrigger>
                </TabsList>

                {/* Official Templates Tab */}
                <TabsContent value="official" className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-4">
                        <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-xs"
                        />
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="ai-inference">AI Inference</SelectItem>
                                <SelectItem value="image-generation">Image Generation</SelectItem>
                                <SelectItem value="dev-environment">Development</SelectItem>
                                <SelectItem value="data-science">Data Science</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Templates Grid */}
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-64" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredOfficialTemplates.map((template) => {
                                const Icon = CATEGORY_ICONS[template.category] || Zap;

                                return (
                                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Icon className="h-6 w-6 text-primary" />
                                                    <div>
                                                        <CardTitle className="text-lg">{template.name}</CardTitle>
                                                        <Badge variant="secondary" className="mt-1">
                                                            {CATEGORY_LABELS[template.category]}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Badge className="bg-blue-500">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Official
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {template.description}
                                            </p>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">GPU:</span>
                                                    <span className="font-medium">{template.gpu_type} x{template.gpu_count}</span>
                                                </div>
                                                {template.exposed_port && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">Port:</span>
                                                        <span className="font-medium">{template.exposed_port}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <TrendingUp className="h-3 w-3" />
                                                    <span className="text-xs">{template.usage_count} deployments</span>
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full"
                                                onClick={() => {
                                                    // Redirect to /deploy/new with template info pre-filled
                                                    const params = new URLSearchParams({
                                                        from_template: 'official',
                                                        template_name: template.name,
                                                        image: template.image,
                                                        gpu_type: template.gpu_type,
                                                        gpu_count: template.gpu_count.toString()
                                                    });
                                                    if (template.exposed_port) {
                                                        params.append('port', template.exposed_port.toString());
                                                    }
                                                    window.location.href = `/deploy/new?${params.toString()}`;
                                                }}
                                            >
                                                <Rocket className="h-4 w-4 mr-2" />
                                                Deploy Now
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {filteredOfficialTemplates.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No templates found</p>
                        </div>
                    )}
                </TabsContent>

                {/* My Templates Tab */}
                <TabsContent value="my-templates" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Save and reuse your deployment configurations
                        </p>
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
                    ) : userTemplates.length === 0 ? (
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
                            {userTemplates.map((template) => (
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
                </TabsContent>
            </Tabs>

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
