import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export interface ApiError {
    message: string;
    code?: string;
    details?: string;
    statusCode?: number;
}

export class AppError extends Error {
    code?: string;
    details?: string;
    statusCode?: number;

    constructor(message: string, code?: string, details?: string, statusCode?: number) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.details = details;
        this.statusCode = statusCode;
    }
}

export function parseApiError(error: any): ApiError {
    // Handle fetch errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
        return {
            message: "Network error. Please check your internet connection.",
            code: "NETWORK_ERROR",
        };
    }

    // Handle API errors
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
            return {
                message: "Authentication failed. Please sign in again.",
                code: "AUTH_ERROR",
                statusCode: 401,
            };
        }

        if (status === 403) {
            return {
                message: "You don't have permission to perform this action.",
                code: "PERMISSION_ERROR",
                statusCode: 403,
            };
        }

        if (status === 404) {
            return {
                message: "The requested resource was not found.",
                code: "NOT_FOUND",
                statusCode: 404,
            };
        }

        if (status === 429) {
            return {
                message: "Too many requests. Please try again later.",
                code: "RATE_LIMIT",
                statusCode: 429,
            };
        }

        if (status >= 500) {
            return {
                message: "Server error. Please try again later.",
                code: "SERVER_ERROR",
                statusCode: status,
                details: data?.message || data?.error,
            };
        }

        return {
            message: data?.message || "An error occurred",
            code: data?.code || "API_ERROR",
            details: data?.details,
            statusCode: status,
        };
    }

    // Handle AppError
    if (error instanceof AppError) {
        return {
            message: error.message,
            code: error.code,
            details: error.details,
            statusCode: error.statusCode,
        };
    }

    // Generic error
    return {
        message: error.message || "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
    };
}

export function useErrorHandler() {
    const { toast } = useToast();

    const handleError = (error: any, customMessage?: string) => {
        const apiError = parseApiError(error);

        toast({
            variant: "destructive",
            title: customMessage || apiError.message,
            description: apiError.details,
        });
    };

    return { handleError };
}

export async function retryAsync<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) {
            throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryAsync(fn, retries - 1, delay * 2);
    }
}
