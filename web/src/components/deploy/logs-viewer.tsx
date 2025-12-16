import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollText, Copy, Download, RefreshCw, Activity } from "lucide-react";
import { getDeploymentLogs, getDeploymentActivity, ActivityLog } from "@/lib/api";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function LogsViewer() {
    const params = useParams();
    const id = params?.id as string;
    const [logs, setLogs] = useState<string[]>([]);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchLogs = async () => {
        if (!id) return;
        try {
            const data = await getDeploymentLogs(parseInt(id));
            if (data.logs) {
                setLogs(data.logs.split('\n'));
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        }
    };

    const fetchActivity = async () => {
        if (!id) return;
        try {
            const data = await getDeploymentActivity(parseInt(id));
            setActivities(data);
        } catch (error) {
            console.error("Failed to fetch activity:", error);
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchActivity();

        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchLogs();
                fetchActivity();
            }, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [id, autoRefresh]);

    // Auto-scroll to bottom only if already near bottom or on first load
    useEffect(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

            if (isNearBottom || logs.length < 20) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [logs]);

    const handleCopy = () => {
        navigator.clipboard.writeText(logs.join('\n'));
    };

    const handleDownload = () => {
        const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deployment-${id}-logs.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Card className="bg-black border-zinc-800">
            <CardHeader className="py-3 border-b border-zinc-800">
                <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-mono text-zinc-400 flex items-center gap-2">
                        <ScrollText className="h-4 w-4" /> System Logs
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 ${autoRefresh ? 'text-green-500' : 'text-zinc-400'} hover:text-white`}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                        >
                            <RefreshCw className={`h-3 w-3 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                            {autoRefresh ? 'Auto' : 'Pause'}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="console" className="w-full">
                    <div className="border-b border-zinc-800 px-4">
                        <TabsList className="bg-transparent h-10 p-0">
                            <TabsTrigger
                                value="console"
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4"
                            >
                                Console
                            </TabsTrigger>
                            <TabsTrigger
                                value="events"
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4"
                            >
                                Events
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="console" className="m-0 relative">
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                            <Button variant="ghost" size="sm" className="h-6 text-zinc-500 hover:text-white bg-zinc-900/50" onClick={handleCopy}>
                                <Copy className="h-3 w-3 mr-2" /> Copy
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-zinc-500 hover:text-white bg-zinc-900/50" onClick={handleDownload}>
                                <Download className="h-3 w-3 mr-2" /> Download
                            </Button>
                        </div>
                        <div
                            ref={scrollRef}
                            className="h-[500px] overflow-y-auto p-4 font-mono text-xs md:text-sm text-zinc-300 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
                        >
                            {logs.length === 0 ? (
                                <div className="text-zinc-500 italic">Waiting for logs...</div>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="break-all hover:bg-zinc-900/50 px-1 rounded flex">
                                        <span className="text-zinc-600 mr-3 select-none w-8 text-right shrink-0">{i + 1}</span>
                                        <span>{log}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="events" className="m-0">
                        <div className="h-[500px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                            {activities.length === 0 ? (
                                <div className="text-zinc-500 italic text-center py-10">No activity recorded yet.</div>
                            ) : (
                                <div className="relative border-l border-zinc-800 ml-3 space-y-6">
                                    {activities.map((activity) => (
                                        <div key={activity.id} className="ml-6 relative">
                                            <span className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-black ${activity.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'
                                                }`} />
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-zinc-200">{activity.action}</span>
                                                    <Badge variant={activity.status === 'SUCCESS' ? 'default' : 'destructive'} className="text-[10px] h-5 px-1.5">
                                                        {activity.status}
                                                    </Badge>
                                                    <span className="text-xs text-zinc-500 ml-auto">
                                                        {new Date(activity.created_at + 'Z').toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-zinc-400">{activity.details}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
