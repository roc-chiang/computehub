"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListTodo, Plus, XCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { getHeaders } from "@/lib/api";

interface TaskQueueProps {
    userId: number;
}

interface BatchTask {
    id: number;
    task_type: string;
    status: string;
    priority: number;
    scheduled_at: string;
    started_at: string | null;
    completed_at: string | null;
    error_message: string | null;
    created_at: string;
}

export function TaskQueue({ userId }: TaskQueueProps) {
    const [tasks, setTasks] = useState<BatchTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [taskType, setTaskType] = useState<string>("");
    const [priority, setPriority] = useState(5);
    const [scheduledAt, setScheduledAt] = useState("");

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, [userId]);

    const fetchTasks = async () => {
        try {
            const response = await fetch(
                `/api/v1/advanced-automation/tasks?limit=50`,
                { headers: getHeaders() }
            );

            if (response.ok) {
                const data = await response.json();
                setTasks(data.tasks || []);
            }
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const createTask = async () => {
        if (!taskType) return;

        try {
            const response = await fetch(
                `/api/v1/advanced-automation/tasks`,
                {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        task_type: taskType,
                        task_config: {
                            // This should be dynamic based on task type
                            deployment_ids: [1, 2, 3]
                        },
                        priority: priority,
                        scheduled_at: scheduledAt || new Date().toISOString(),
                    }),
                }
            );

            if (response.ok) {
                await fetchTasks();
                setIsDialogOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error("Failed to create task:", error);
        }
    };

    const cancelTask = async (taskId: number) => {
        try {
            const response = await fetch(
                `/api/v1/advanced-automation/tasks/${taskId}/cancel`,
                {
                    method: "POST",
                    headers: getHeaders(),
                }
            );

            if (response.ok) {
                await fetchTasks();
            }
        } catch (error) {
            console.error("Failed to cancel task:", error);
        }
    };

    const resetForm = () => {
        setTaskType("");
        setPriority(5);
        setScheduledAt("");
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "failed":
            case "cancelled":
                return <XCircle className="h-5 w-5 text-red-500" />;
            case "running":
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            completed: "default",
            failed: "destructive",
            running: "secondary",
            queued: "outline",
            cancelled: "destructive",
        };
        return variants[status] || "outline";
    };

    const getTaskTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            batch_deploy: "Batch Deploy",
            batch_stop: "Batch Stop",
            batch_delete: "Batch Delete",
            scheduled_migration: "Scheduled Migration",
        };
        return labels[type] || type;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Task Queue</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Task Queue</CardTitle>
                        <CardDescription>
                            Manage batch and scheduled tasks
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Batch Task</DialogTitle>
                                <DialogDescription>
                                    Schedule a batch operation or migration
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Task Type</Label>
                                    <Select value={taskType} onValueChange={setTaskType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select task type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="batch_deploy">Batch Deploy</SelectItem>
                                            <SelectItem value="batch_stop">Batch Stop</SelectItem>
                                            <SelectItem value="batch_delete">Batch Delete</SelectItem>
                                            <SelectItem value="scheduled_migration">Scheduled Migration</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority (1-10)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={priority}
                                        onChange={(e) => setPriority(parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Scheduled Time (Optional)</Label>
                                    <Input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty to execute immediately
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={createTask} disabled={!taskType}>
                                    Create Task
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No tasks in queue. Create your first task above.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    {getStatusIcon(task.status)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">
                                                {getTaskTypeLabel(task.task_type)}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                Priority: {task.priority}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Scheduled: {new Date(task.scheduled_at).toLocaleString()}
                                        </div>
                                        {task.started_at && (
                                            <div className="text-sm text-muted-foreground">
                                                Started: {new Date(task.started_at).toLocaleString()}
                                            </div>
                                        )}
                                        {task.error_message && (
                                            <div className="text-sm text-red-500 mt-1">
                                                Error: {task.error_message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={getStatusBadge(task.status)}>
                                        {task.status.toUpperCase()}
                                    </Badge>
                                    {task.status === "queued" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => cancelTask(task.id)}
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
