import { AlertCircle, KeyRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ApiKeys() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <KeyRound className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <CardTitle>ComputeHub API Keys</CardTitle>
                            <CardDescription>Programmatic access credentials for the ComputeHub API.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                            <p className="font-medium">API key issuance is not enabled</p>
                            <p className="mt-1 text-sm">
                                No keys have been created. Key generation and revocation will become available after the server-side credential service is configured.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
