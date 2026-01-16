"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getOrganizations, OrganizationWithStats } from "@/lib/organization-api";
import { setAuthToken } from "@/lib/api";
import { useRouter } from "next/navigation";

interface OrganizationSwitcherProps {
    currentOrgId?: number;
}

export function OrganizationSwitcher({ currentOrgId }: OrganizationSwitcherProps) {
    const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { getToken } = useAuth();

    useEffect(() => {
        const initAuth = async () => {
            const token = await getToken();
            if (token) {
                setAuthToken(token);
                loadOrganizations();
            } else {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const loadOrganizations = async () => {
        try {
            const orgs = await getOrganizations();
            setOrganizations(orgs);
        } catch (error) {
            console.error("Failed to load organizations:", error);
        } finally {
            setLoading(false);
        }
    };

    const currentOrg = organizations.find((org) => org.id === currentOrgId);

    if (loading) {
        return (
            <Button variant="outline" size="sm" disabled>
                <Building2 className="mr-2 h-4 w-4" />
                Loading...
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Building2 className="mr-2 h-4 w-4" />
                    {currentOrg ? currentOrg.name : "Select Organization"}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizations.map((org) => (
                    <DropdownMenuItem
                        key={org.id}
                        onClick={() => router.push(`/organizations/${org.id}`)}
                    >
                        {org.name}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings/organizations")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
