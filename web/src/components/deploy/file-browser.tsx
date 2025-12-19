"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, File, Download, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileBrowserProps {
    deploymentId: number;
}

export function FileBrowser({ deploymentId }: FileBrowserProps) {
    // Mock file structure
    const files = [
        { name: "workspace", type: "folder", size: "-" },
        { name: "models", type: "folder", size: "-" },
        { name: "config.yaml", type: "file", size: "2.4 KB" },
        { name: "requirements.txt", type: "file", size: "1.2 KB" },
        { name: "app.py", type: "file", size: "8.5 KB" },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle>File Browser</CardTitle>
                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md">
                        🚧 Under Development
                    </span>
                </div>
                <CardDescription>
                    Browse and manage deployment files
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Info Alert */}
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">File Access via SSH</p>
                        <p>
                            To browse and manage files, use the SSH connection string from the Overview tab.
                            Full file browser functionality requires direct SSH/SFTP access to the instance.
                        </p>
                    </div>
                </div>

                {/* Mock File List */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-2">
                        <span>Name</span>
                        <span>Size</span>
                    </div>

                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                {file.type === "folder" ? (
                                    <Folder className="h-4 w-4 text-blue-500" />
                                ) : (
                                    <File className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="text-sm">{file.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{file.size}</span>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                    Note: File operations are currently view-only. Use SSH for full file management.
                </p>
            </CardContent>
        </Card>
    );
}
