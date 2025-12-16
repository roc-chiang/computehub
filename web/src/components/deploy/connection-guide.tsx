"use client";

import { useState } from "react";
import { Deployment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Eye, EyeOff, Terminal, ExternalLink, Check, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConnectionGuideProps {
    deployment: Deployment;
}

export function ConnectionGuide({ deployment }: ConnectionGuideProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    if (deployment.status.toLowerCase() !== "running") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Connection Guide</CardTitle>
                    <CardDescription>Instance is not running. Please wait for it to start.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Connection Guide</CardTitle>
                <CardDescription>
                    Connect to your service using HTTP or SSH.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* HTTP Services Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">HTTP Services</h3>

                    {deployment.endpoint_url ? (
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-md">
                                    <ExternalLink className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        JupyterLab
                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Ready</Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">Port 8888</div>
                                </div>
                            </div>
                            <Button
                                onClick={() => window.open(deployment.endpoint_url, "_blank")}
                            >
                                Open JupyterLab
                            </Button>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">No HTTP services available.</div>
                    )}

                    {/* RunPod Console Link */}
                    <div className="pt-2">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => window.open(`https://runpod.io/console/pods/${deployment.instance_id}`, "_blank")}
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in RunPod Console (Web Terminal)
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Access the full web terminal and advanced settings on RunPod.
                        </p>
                    </div>
                </div>

                {/* SSH Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">SSH Connection</h3>

                    {/* SSH Key Alert (Mocked for now) */}
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                        <AlertCircle className="h-4 w-4 text-blue-800" />
                        <AlertTitle>SSH Access</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            You can connect via SSH using the command below. Ensure your public key is configured if required by the image.
                        </AlertDescription>
                    </Alert>

                    {deployment.ssh_connection_string && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>SSH Command</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Terminal className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            readOnly
                                            value={deployment.ssh_connection_string}
                                            className="pl-9 font-mono bg-muted"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleCopy(deployment.ssh_connection_string!, "ssh")}
                                    >
                                        {copiedField === "ssh" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {deployment.ssh_password && (
                                <div className="space-y-2">
                                    <Label>Root Password</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                readOnly
                                                type={showPassword ? "text" : "password"}
                                                value={deployment.ssh_password}
                                                className="font-mono bg-muted"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleCopy(deployment.ssh_password!, "password")}
                                        >
                                            {copiedField === "password" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* VS Code Config Snippet */}
                {deployment.ssh_connection_string && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">VS Code Integration</h3>
                        <div className="relative rounded-md bg-muted p-4 font-mono text-sm">
                            <pre className="overflow-x-auto">
                                {`Host ${deployment.name.replace(/\s+/g, '-').toLowerCase()}
    HostName ${deployment.ssh_connection_string.split('@')[1].split(' ')[0]}
    User root
    Port ${deployment.ssh_connection_string.split('-p ')[1]}`}
                            </pre>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-2 h-8 w-8 p-0"
                                onClick={() => {
                                    const host = deployment.ssh_connection_string!.split('@')[1].split(' ')[0];
                                    const port = deployment.ssh_connection_string!.split('-p ')[1];
                                    const config = `Host ${deployment.name.replace(/\s+/g, '-').toLowerCase()}\n    HostName ${host}\n    User root\n    Port ${port}`;
                                    handleCopy(config, "vscode");
                                }}
                            >
                                {copiedField === "vscode" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
