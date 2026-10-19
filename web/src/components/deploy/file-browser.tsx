"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, File, Folder, Loader2, RefreshCw } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileItem, getDeploymentFiles } from "@/lib/api";

interface FileBrowserProps {
    deploymentId: number;
}

function formatSize(value: string) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes)) return value;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileBrowser({ deploymentId }: FileBrowserProps) {
    const [path, setPath] = useState("/workspace");
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setFiles(await getDeploymentFiles(deploymentId, path));
        } catch (loadError) {
            setFiles([]);
            setError(loadError instanceof Error ? loadError.message : "Unable to load files");
        } finally {
            setLoading(false);
        }
    }, [deploymentId, path]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const openDirectory = (name: string) => {
        setPath(`${path.replace(/\/$/, "")}/${name}`);
    };

    const goUp = () => {
        if (path === "/workspace") return;
        const parent = path.slice(0, path.lastIndexOf("/")) || "/workspace";
        setPath(parent.startsWith("/workspace") ? parent : "/workspace");
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <CardTitle>File Browser</CardTitle>
                        <CardDescription>Read-only SFTP view of the deployment workspace</CardDescription>
                    </div>
                    <Button variant="outline" size="icon" onClick={loadFiles} disabled={loading} aria-label="Refresh files">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center gap-2 rounded-md border bg-muted/40 p-2">
                    <Button variant="ghost" size="icon" onClick={goUp} disabled={path === "/workspace" || loading} aria-label="Parent directory">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="truncate font-mono text-sm">{path}</span>
                </div>

                {error && (
                    <div className="mb-4 flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading files...
                    </div>
                ) : files.length === 0 && !error ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">This directory is empty.</p>
                ) : (
                    <div className="divide-y rounded-md border">
                        {files.map((file) => (
                            <button
                                key={file.name}
                                type="button"
                                disabled={file.type !== "directory"}
                                onClick={() => file.type === "directory" && openDirectory(file.name)}
                                className="flex w-full items-center justify-between gap-4 p-3 text-left enabled:hover:bg-muted disabled:cursor-default"
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    {file.type === "directory"
                                        ? <Folder className="h-4 w-4 shrink-0 text-blue-500" />
                                        : <File className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                    <span className="truncate text-sm">{file.name}</span>
                                </span>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {file.type === "directory" ? "Directory" : formatSize(file.size)}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <p className="mt-4 text-xs text-muted-foreground">
                    File modification and downloads remain disabled. Use the authenticated terminal for write operations.
                </p>
            </CardContent>
        </Card>
    );
}
