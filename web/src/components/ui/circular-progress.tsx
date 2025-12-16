import React from "react";

interface CircularProgressProps {
    value: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
    subLabel?: string;
    color?: string;
}

export function CircularProgress({
    value,
    size = 120,
    strokeWidth = 10,
    label,
    subLabel,
    color = "text-primary",
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
            >
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-muted/20"
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`transition-all duration-500 ease-in-out ${color}`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${color}`}>{Math.round(value)}%</span>
                {label && <span className="text-xs text-muted-foreground mt-1">{label}</span>}
            </div>
            {subLabel && (
                <div className="absolute -bottom-8 text-center w-full">
                    <span className="text-xs text-muted-foreground">{subLabel}</span>
                </div>
            )}
        </div>
    );
}
