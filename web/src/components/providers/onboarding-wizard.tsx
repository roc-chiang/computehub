"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getProviderInstruction, type ProviderInstruction } from "@/lib/provider-instructions";
import { useToast } from "@/hooks/use-toast";

interface OnboardingWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    providerName: string;
    onSuccess: () => void;
}

type WizardStep = "instructions" | "input" | "verify" | "success";

export function OnboardingWizard({ open, onOpenChange, providerName, onSuccess }: OnboardingWizardProps) {
    const [step, setStep] = useState<WizardStep>("instructions");
    const [apiKey, setApiKey] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { getToken } = useAuth();

    const provider = getProviderInstruction(providerName);

    if (!provider) {
        return null;
    }

    const handleSubmit = async () => {
        if (!apiKey.trim()) {
            setError("Please enter your API key");
            return;
        }

        setVerifying(true);
        setError(null);

        try {
            // Get auth token
            const token = await getToken();
            if (!token) {
                throw new Error("Authentication required. Please log in.");
            }

            // Create provider binding
            const response = await fetch("http://localhost:8000/api/v1/user-providers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    provider_type: provider.name,
                    api_key: apiKey,
                    display_name: displayName || `${provider.displayName} Account`
                }),
            });

            if (!response.ok) {
                const responseText = await response.text();
                console.error("API Error Response:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: responseText
                });

                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(errorData.detail || `Server error: ${response.status}`);
                } catch (parseError) {
                    throw new Error(`Server error ${response.status}: ${responseText || response.statusText}`);
                }
            }

            const binding = await response.json();

            // Verify the API key
            setStep("verify");
            const verifyResponse = await fetch(`http://localhost:8000/api/v1/user-providers/${binding.id}/verify`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!verifyResponse.ok) {
                throw new Error("Failed to verify API key");
            }

            const verifyResult = await verifyResponse.json();

            if (verifyResult.verified) {
                setStep("success");
                setTimeout(() => {
                    onSuccess();
                    handleClose();
                }, 2000);
            } else {
                setError(verifyResult.message || "API key verification failed");
                setStep("input");
            }
        } catch (err) {
            console.error("Provider binding error:", err);
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
            setError(errorMessage);
            setStep("input");
        } finally {
            setVerifying(false);
        }
    };

    const handleClose = () => {
        setStep("instructions");
        setApiKey("");
        setDisplayName("");
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-2xl">{provider.icon}</span>
                        Connect {provider.displayName}
                    </DialogTitle>
                    <DialogDescription>
                        {provider.description}
                    </DialogDescription>
                </DialogHeader>

                {/* Step Indicators */}
                <div className="flex items-center justify-center gap-2 py-4">
                    <Badge variant={step === "instructions" ? "default" : "outline"}>1. Instructions</Badge>
                    <div className="w-8 h-px bg-border" />
                    <Badge variant={step === "input" ? "default" : "outline"}>2. API Key</Badge>
                    <div className="w-8 h-px bg-border" />
                    <Badge variant={step === "verify" || step === "success" ? "default" : "outline"}>3. Verify</Badge>
                </div>

                {/* Step: Instructions */}
                {step === "instructions" && (
                    <div className="space-y-4">
                        <Alert>
                            <AlertDescription>
                                Follow these steps to get your {provider.displayName} API key:
                            </AlertDescription>
                        </Alert>

                        <ol className="space-y-3">
                            {provider.steps.map((stepText, index) => (
                                <li key={index} className="flex gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm text-muted-foreground pt-0.5">{stepText}</span>
                                </li>
                            ))}
                        </ol>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => window.open(provider.apiKeyUrl, "_blank")}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open {provider.displayName}
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => setStep("input")}
                            >
                                I Have My API Key
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step: Input API Key */}
                {step === "input" && (
                    <div className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key *</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                placeholder="Enter your API key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                disabled={verifying}
                            />
                            <p className="text-xs text-muted-foreground">
                                Your API key is encrypted and stored securely
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name (Optional)</Label>
                            <Input
                                id="displayName"
                                placeholder={`${provider.displayName} Account`}
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={verifying}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setStep("instructions")}
                                disabled={verifying}
                            >
                                Back
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleSubmit}
                                disabled={verifying || !apiKey.trim()}
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Connect & Verify"
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step: Verifying */}
                {step === "verify" && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div className="text-center">
                            <h3 className="font-semibold">Verifying API Key...</h3>
                            <p className="text-sm text-muted-foreground">
                                Testing connection to {provider.displayName}
                            </p>
                        </div>
                    </div>
                )}

                {/* Step: Success */}
                {step === "success" && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">Successfully Connected!</h3>
                            <p className="text-sm text-muted-foreground">
                                {provider.displayName} is now ready to use
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
