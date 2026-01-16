"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganization } from "@/lib/organization-api";
import { useToast } from "@/hooks/use-toast";

interface CreateOrganizationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateOrganizationDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateOrganizationDialogProps) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: "Error",
                description: "Organization name is required",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const org = await createOrganization({
                name: name.trim(),
                slug: slug.trim() || undefined,
            });

            toast({
                title: "Success",
                description: "Organization created successfully",
            });

            setName("");
            setSlug("");
            onSuccess?.();
            router.push(`/organizations/${org.id}`);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create organization",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Organization</DialogTitle>
                        <DialogDescription>
                            Create a new organization to collaborate with your team
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name *</Label>
                            <Input
                                id="name"
                                placeholder="My Team"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">
                                Slug (optional)
                                <span className="text-xs text-muted-foreground ml-2">
                                    Auto-generated if not provided
                                </span>
                            </Label>
                            <Input
                                id="slug"
                                placeholder="my-team"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                URL-friendly identifier for your organization
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Organization"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
