import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Plus, Trash2 } from "lucide-react";

interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    created: string;
    lastUsed: string;
}

export function ApiKeys() {
    const [keys, setKeys] = useState<ApiKey[]>([
        {
            id: "1",
            name: "CLI Access",
            prefix: "ch_live_...",
            created: "2023-10-01",
            lastUsed: "2 hours ago",
        },
        {
            id: "2",
            name: "CI/CD Pipeline",
            prefix: "ch_live_...",
            created: "2023-11-15",
            lastUsed: "1 day ago",
        },
    ]);

    const [newKeyName, setNewKeyName] = useState("");

    const handleCreate = () => {
        if (!newKeyName) return;
        const newKey: ApiKey = {
            id: Math.random().toString(),
            name: newKeyName,
            prefix: "ch_live_...",
            created: "Just now",
            lastUsed: "Never",
        };
        setKeys([...keys, newKey]);
        setNewKeyName("");
    };

    const handleDelete = (id: string) => {
        setKeys(keys.filter((k) => k.id !== id));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create New API Key</CardTitle>
                    <CardDescription>
                        Generate a new key for accessing the ComputeHub API programmatically.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Key Name (e.g. Production App)"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            className="max-w-md"
                        />
                        <Button onClick={handleCreate} disabled={!newKeyName}>
                            <Plus className="mr-2 h-4 w-4" /> Generate Key
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Active API Keys</CardTitle>
                    <CardDescription>
                        Manage your existing API keys. Revoking a key will immediately block access.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Token Prefix</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Last Used</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {keys.map((key) => (
                                <TableRow key={key.id}>
                                    <TableCell className="font-medium">{key.name}</TableCell>
                                    <TableCell className="font-mono text-muted-foreground">{key.prefix}</TableCell>
                                    <TableCell>{key.created}</TableCell>
                                    <TableCell>{key.lastUsed}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon">
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(key.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
