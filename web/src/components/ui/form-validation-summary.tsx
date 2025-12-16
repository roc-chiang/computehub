import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ValidationErrors } from "@/lib/validation";

interface FormValidationSummaryProps {
    errors: ValidationErrors;
    touched: Record<string, boolean>;
    showSuccess?: boolean;
}

export function FormValidationSummary({ errors, touched, showSuccess }: FormValidationSummaryProps) {
    const touchedErrors = Object.keys(errors).filter((key) => touched[key]);
    const hasErrors = touchedErrors.length > 0;

    if (!hasErrors && !showSuccess) return null;

    if (hasErrors) {
        return (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Please fix the following errors:</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        {touchedErrors.map((key) => (
                            <li key={key} className="text-sm">
                                {errors[key]}
                            </li>
                        ))}
                    </ul>
                </AlertDescription>
            </Alert>
        );
    }

    if (showSuccess) {
        return (
            <Alert className="border-green-500 bg-green-500/10 text-green-600 animate-in slide-in-from-top-2">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Form is valid</AlertTitle>
                <AlertDescription>All fields are correctly filled.</AlertDescription>
            </Alert>
        );
    }

    return null;
}
