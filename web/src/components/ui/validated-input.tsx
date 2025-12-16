import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    touched?: boolean;
    required?: boolean;
    helperText?: string;
}

export function ValidatedInput({
    label,
    error,
    touched,
    required,
    helperText,
    className,
    ...props
}: ValidatedInputProps) {
    const showError = touched && error;

    return (
        <div className="space-y-2">
            <Label htmlFor={props.id} className="flex items-center gap-1">
                {label}
                {required && <span className="text-destructive">*</span>}
            </Label>
            <Input
                {...props}
                className={cn(
                    className,
                    showError && "border-destructive focus-visible:ring-destructive"
                )}
                aria-invalid={showError}
                aria-describedby={showError ? `${props.id}-error` : undefined}
            />
            {showError ? (
                <div
                    id={`${props.id}-error`}
                    className="flex items-center gap-1 text-sm text-destructive animate-in slide-in-from-top-1"
                >
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </div>
            ) : helperText ? (
                <p className="text-xs text-muted-foreground">{helperText}</p>
            ) : null}
        </div>
    );
}
