import { AlertCircle, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type AlertType = "info" | "success" | "warning" | "error";

interface EnhancedAlertProps {
    type: AlertType;
    title: string;
    description: string;
    action?: React.ReactNode;
}

const alertConfig = {
    info: {
        icon: Info,
        className: "border-blue-500/50 bg-blue-500/10 text-blue-600",
    },
    success: {
        icon: CheckCircle,
        className: "border-green-500/50 bg-green-500/10 text-green-600",
    },
    warning: {
        icon: AlertTriangle,
        className: "border-yellow-500/50 bg-yellow-500/10 text-yellow-600",
    },
    error: {
        icon: XCircle,
        className: "border-red-500/50 bg-red-500/10 text-red-600",
    },
};

export function EnhancedAlert({ type, title, description, action }: EnhancedAlertProps) {
    const config = alertConfig[type];
    const Icon = config.icon;

    return (
        <Alert className={config.className}>
            <Icon className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="mt-2">
                {description}
                {action && <div className="mt-3">{action}</div>}
            </AlertDescription>
        </Alert>
    );
}
