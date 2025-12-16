import { useState, useCallback } from "react";
import { ValidationRules, ValidationErrors, validateField, validateForm, hasErrors } from "@/lib/validation";

export function useFormValidation<T extends Record<string, any>>(
    initialValues: T,
    validationRules: ValidationRules
) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateSingleField = useCallback(
        (name: string, value: any) => {
            if (validationRules[name]) {
                const error = validateField(value, validationRules[name]);
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    if (error) {
                        newErrors[name] = error;
                    } else {
                        delete newErrors[name];
                    }
                    return newErrors;
                });
            }
        },
        [validationRules]
    );

    const handleChange = useCallback(
        (name: string, value: any) => {
            setValues((prev) => ({ ...prev, [name]: value }));

            // Validate on change if field has been touched
            if (touched[name]) {
                validateSingleField(name, value);
            }
        },
        [touched, validateSingleField]
    );

    const handleBlur = useCallback(
        (name: string) => {
            setTouched((prev) => ({ ...prev, [name]: true }));
            validateSingleField(name, values[name]);
        },
        [values, validateSingleField]
    );

    const validateAll = useCallback(() => {
        const newErrors = validateForm(values, validationRules);
        setErrors(newErrors);

        // Mark all fields as touched
        const allTouched = Object.keys(validationRules).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {}
        );
        setTouched(allTouched);

        return !hasErrors(newErrors);
    }, [values, validationRules]);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    const setFieldValue = useCallback((name: string, value: any) => {
        handleChange(name, value);
    }, [handleChange]);

    const setFieldError = useCallback((name: string, error: string) => {
        setErrors((prev) => ({ ...prev, [name]: error }));
    }, []);

    return {
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        validateAll,
        resetForm,
        setFieldValue,
        setFieldError,
        isValid: !hasErrors(errors),
    };
}
