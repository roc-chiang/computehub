export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    min?: number;
    max?: number;
    custom?: (value: any) => boolean;
    message?: string;
}

export interface ValidationRules {
    [key: string]: ValidationRule;
}

export interface ValidationErrors {
    [key: string]: string;
}

export function validateField(value: any, rules: ValidationRule): string | null {
    if (rules.required && (!value || value.toString().trim() === "")) {
        return rules.message || "This field is required";
    }

    if (!value) return null; // Skip other validations if field is empty and not required

    if (rules.minLength && value.toString().length < rules.minLength) {
        return rules.message || `Minimum length is ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.toString().length > rules.maxLength) {
        return rules.message || `Maximum length is ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value.toString())) {
        return rules.message || "Invalid format";
    }

    if (rules.min !== undefined && Number(value) < rules.min) {
        return rules.message || `Minimum value is ${rules.min}`;
    }

    if (rules.max !== undefined && Number(value) > rules.max) {
        return rules.message || `Maximum value is ${rules.max}`;
    }

    if (rules.custom && !rules.custom(value)) {
        return rules.message || "Invalid value";
    }

    return null;
}

export function validateForm(values: any, rules: ValidationRules): ValidationErrors {
    const errors: ValidationErrors = {};

    Object.keys(rules).forEach((field) => {
        const error = validateField(values[field], rules[field]);
        if (error) {
            errors[field] = error;
        }
    });

    return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
    return Object.keys(errors).length > 0;
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/.+/,
    dockerImage: /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[a-z0-9]+(?:[._-][a-z0-9]+)*)?$/i,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    alphanumericWithDash: /^[a-zA-Z0-9-_]+$/,
};

// Common validation rules
export const COMMON_RULES = {
    deploymentName: {
        required: true,
        minLength: 3,
        maxLength: 50,
        pattern: VALIDATION_PATTERNS.alphanumericWithDash,
        message: "Name must be 3-50 characters, alphanumeric with dashes/underscores only",
    },
    dockerImage: {
        required: true,
        pattern: VALIDATION_PATTERNS.dockerImage,
        message: "Invalid Docker image format (e.g., runpod/pytorch:latest)",
    },
    gpuCount: {
        required: true,
        min: 1,
        max: 8,
        message: "GPU count must be between 1 and 8",
    },
    diskSize: {
        required: true,
        min: 10,
        max: 1000,
        message: "Disk size must be between 10GB and 1000GB",
    },
};
