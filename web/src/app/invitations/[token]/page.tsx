"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setAuthToken } from "@/lib/api";
import { acceptInvitation } from "@/lib/organization-api";

export default function AcceptInvitationPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const invitationToken = params.token as string;
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Accepting invitation...");
    const [organizationId, setOrganizationId] = useState<number | undefined>();

    const accept = useCallback(async () => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            setStatus("error");
            setMessage("Sign in with the invited email address before accepting this invitation.");
            return;
        }

        try {
            const authToken = await getToken();
            if (!authToken) throw new Error("Authentication required");
            setAuthToken(authToken);
            const membership = await acceptInvitation(invitationToken);
            setOrganizationId(membership.organization_id);
            setStatus("success");
            setMessage("Invitation accepted. You now have access to the organization.");
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Unable to accept invitation");
        }
    }, [getToken, invitationToken, isLoaded, isSignedIn]);

    useEffect(() => {
        accept();
    }, [accept]);

    return (
        <div className="container mx-auto flex min-h-[60vh] max-w-xl items-center py-12">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Organization invitation</CardTitle>
                    <CardDescription>ComputeHub team access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 text-center">
                    {status === "loading" && <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />}
                    {status === "success" && <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />}
                    {status === "error" && <XCircle className="mx-auto h-10 w-10 text-destructive" />}
                    <p className="text-sm text-muted-foreground">{message}</p>
                    {status === "success" && (
                        <Button onClick={() => router.push(organizationId ? `/organizations/${organizationId}` : "/settings/organizations")}>
                            Open organization
                        </Button>
                    )}
                    {status === "error" && <Button variant="outline" onClick={() => router.push("/login")}>Sign in</Button>}
                </CardContent>
            </Card>
        </div>
    );
}
