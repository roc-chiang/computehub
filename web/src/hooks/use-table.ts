import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig<T> {
    key: keyof T;
    direction: SortDirection;
}

export function useTableSort<T>(data: T[], initialSort?: SortConfig<T>) {
    const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(initialSort || null);

    const sortedData = useMemo(() => {
        if (!sortConfig || !sortConfig.direction) {
            return data;
        }

        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === bValue) return 0;

            const comparison = aValue < bValue ? -1 : 1;
            return sortConfig.direction === "asc" ? comparison : -comparison;
        });
    }, [data, sortConfig]);

    const requestSort = (key: keyof T) => {
        let direction: SortDirection = "asc";

        if (sortConfig && sortConfig.key === key) {
            if (sortConfig.direction === "asc") {
                direction = "desc";
            } else if (sortConfig.direction === "desc") {
                direction = null;
            }
        }

        setSortConfig(direction ? { key, direction } : null);
    };

    return { sortedData, sortConfig, requestSort };
}

export function useTableFilter<T>(data: T[], filterFn: (item: T, query: string) => boolean) {
    const [filterQuery, setFilterQuery] = useState("");

    const filteredData = useMemo(() => {
        if (!filterQuery.trim()) {
            return data;
        }
        return data.filter((item) => filterFn(item, filterQuery));
    }, [data, filterQuery, filterFn]);

    return { filteredData, filterQuery, setFilterQuery };
}

export function useTablePagination<T>(data: T[], itemsPerPage: number = 10) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(data.length / itemsPerPage);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    }, [data, currentPage, itemsPerPage]);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const nextPage = () => goToPage(currentPage + 1);
    const prevPage = () => goToPage(currentPage - 1);

    return {
        paginatedData,
        currentPage,
        totalPages,
        goToPage,
        nextPage,
        prevPage,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
    };
}

export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    columns?: (keyof T)[]
) {
    if (data.length === 0) return;

    const keys = columns || (Object.keys(data[0]) as (keyof T)[]);
    const csvContent = [
        // Header
        keys.join(","),
        // Rows
        ...data.map((row) =>
            keys
                .map((key) => {
                    const value = row[key];
                    // Escape quotes and wrap in quotes if contains comma
                    const stringValue = String(value || "");
                    return stringValue.includes(",") || stringValue.includes('"')
                        ? `"${stringValue.replace(/"/g, '""')}"`
                        : stringValue;
                })
                .join(",")
        ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
