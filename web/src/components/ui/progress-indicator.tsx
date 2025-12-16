import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProgressIndicatorProps {
    status: "loading" | "success" | "error";
    message: string;
}

export function ProgressIndicator({ status, message }: ProgressIndicatorProps) {
    return (
        <Card className="border-2">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                    {status === "loading" && (
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    )}
                    {status === "success" && (
                        <div className="relative">
                            <CheckCircle2 className="h-12 w-12 text-green-500 animate-in zoom-in duration-300" />
                            <div className="absolute inset-0 h-12 w-12 rounded-full bg-green-500/20 animate-ping" />
                        </div>
                    )}
                    {status === "error" && (
                        <XCircle className="h-12 w-12 text-red-500 animate-in zoom-in duration-300" />
                    )}
                    <p className={`text-center font-medium ${status === "loading" ? "text-muted-foreground" :
                            status === "success" ? "text-green-600" :
                                "text-red-600"
                        }`}>
                        {message}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

interface LoadingOverlayProps {
    message?: string;
}

export function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="w-80">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">{message}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
