import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, File, ArrowLeft, RefreshCw, FileText, Download, ChevronRight } from "lucide-react";
import { getDeploymentFiles, getDeploymentFileContent, FileItem } from "@/lib/api";
import { useParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function FileBrowser() {
    const params = useParams();
    const id = params?.id as string;
    const [currentPath, setCurrentPath] = useState("/workspace");
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<{ name: string, content: string } | null>(null);
    const [viewingFile, setViewingFile] = useState(false);

    const fetchFiles = async (path: string) => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getDeploymentFiles(parseInt(id), path);
            setFiles(data);
        } catch (err) {
            setError("Failed to load files");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles(currentPath);
    }, [id, currentPath]);

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
    };

    const handleUp = () => {
        const parts = currentPath.split('/').filter(p => p);
        if (parts.length > 0) {
            parts.pop();
            const newPath = '/' + parts.join('/');
            setCurrentPath(newPath || '/');
        }
    };

    const handleItemClick = async (item: FileItem) => {
        if (item.type === 'directory') {
            const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
            setCurrentPath(newPath);
        } else {
            // View file
            try {
                const filePath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
                const data = await getDeploymentFileContent(parseInt(id), filePath);
                setSelectedFile({ name: item.name, content: data.content });
                setViewingFile(true);
            } catch (err) {
                console.error("Failed to read file", err);
                alert("Failed to read file content");
            }
        }
    };

    const breadcrumbs = currentPath.split('/').filter(p => p);

    return (
        <Card className="bg-black border-zinc-800 h-[600px] flex flex-col">
            <CardHeader className="py-3 border-b border-zinc-800 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={handleUp}
                            disabled={currentPath === '/' || currentPath === '/workspace'} // Limit to workspace for safety if needed, or allow root
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center text-sm text-zinc-400 font-mono overflow-hidden whitespace-nowrap">
                            <span
                                className="cursor-pointer hover:text-white"
                                onClick={() => setCurrentPath('/')}
                            >
                                root
                            </span>
                            {breadcrumbs.map((part, i) => {
                                const path = '/' + breadcrumbs.slice(0, i + 1).join('/');
                                return (
                                    <div key={i} className="flex items-center">
                                        <ChevronRight className="h-3 w-3 mx-1 text-zinc-600" />
                                        <span
                                            className="cursor-pointer hover:text-white"
                                            onClick={() => setCurrentPath(path)}
                                        >
                                            {part}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-zinc-400 hover:text-white"
                        onClick={() => fetchFiles(currentPath)}
                    >
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
                {error ? (
                    <div className="p-8 text-center text-red-400">{error}</div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {files.map((file) => (
                            <div
                                key={file.name}
                                className="flex items-center justify-between p-3 hover:bg-zinc-900/50 cursor-pointer group transition-colors"
                                onDoubleClick={() => handleItemClick(file)}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {file.type === 'directory' ? (
                                        <Folder className="h-5 w-5 text-blue-400 shrink-0" />
                                    ) : (
                                        <File className="h-5 w-5 text-zinc-500 shrink-0" />
                                    )}
                                    <span className="text-sm text-zinc-300 truncate font-medium group-hover:text-white">
                                        {file.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-6 text-xs text-zinc-500 shrink-0">
                                    <span className="w-20 text-right">{file.size}</span>
                                    <span className="w-32 text-right font-mono">{file.modified}</span>
                                    <span className="w-24 text-right font-mono hidden md:block">{file.permissions}</span>
                                </div>
                            </div>
                        ))}
                        {files.length === 0 && !loading && (
                            <div className="p-8 text-center text-zinc-500 italic">Empty directory</div>
                        )}
                    </div>
                )}
            </CardContent>

            <Dialog open={viewingFile} onOpenChange={setViewingFile}>
                <DialogContent className="max-w-4xl h-[80vh] bg-zinc-950 border-zinc-800 flex flex-col p-0 gap-0">
                    <DialogHeader className="p-4 border-b border-zinc-800 shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-zinc-200">
                            <FileText className="h-4 w-4" />
                            {selectedFile?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto p-4 bg-black">
                        <pre className="text-xs md:text-sm font-mono text-zinc-300 whitespace-pre-wrap break-all">
                            {selectedFile?.content || "No content"}
                        </pre>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
