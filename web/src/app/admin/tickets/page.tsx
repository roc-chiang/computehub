"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react";
import {
    getTicketStats,
    getTickets,
    getTicketDetail,
    updateTicket,
    replyToTicket,
    TicketListItem,
    TicketDetail,
    TicketStats,
    TicketStatus,
    TicketPriority,
    TicketCategory,
} from "@/lib/admin-tickets-api";

export default function TicketsPage() {
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [replyMessage, setReplyMessage] = useState("");
    const [replying, setReplying] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, [statusFilter, priorityFilter, categoryFilter, searchQuery]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, ticketsData] = await Promise.all([
                getTicketStats(),
                getTickets({
                    status: statusFilter !== "all" ? (statusFilter as TicketStatus) : undefined,
                    priority: priorityFilter !== "all" ? (priorityFilter as TicketPriority) : undefined,
                    category: categoryFilter !== "all" ? (categoryFilter as TicketCategory) : undefined,
                    search: searchQuery || undefined,
                }),
            ]);
            setStats(statsData);
            setTickets(ticketsData);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load tickets",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTicketClick = async (ticketId: number) => {
        setDetailLoading(true);
        try {
            const detail = await getTicketDetail(ticketId);
            setSelectedTicket(detail);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load ticket details",
                variant: "destructive",
            });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: TicketStatus) => {
        if (!selectedTicket) return;

        try {
            const updated = await updateTicket(selectedTicket.id, { status: newStatus });
            setSelectedTicket(updated);
            fetchData(); // Refresh list
            toast({
                title: "Success",
                description: "Ticket status updated",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update ticket",
                variant: "destructive",
            });
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyMessage.trim()) return;

        setReplying(true);
        try {
            const newReply = await replyToTicket(selectedTicket.id, replyMessage);
            setSelectedTicket({
                ...selectedTicket,
                replies: [...selectedTicket.replies, newReply],
            });
            setReplyMessage("");
            toast({
                title: "Success",
                description: "Reply sent",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send reply",
                variant: "destructive",
            });
        } finally {
            setReplying(false);
        }
    };

    const getStatusBadge = (status: TicketStatus) => {
        const variants: Record<TicketStatus, { variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
            [TicketStatus.OPEN]: { variant: "default", color: "bg-blue-500" },
            [TicketStatus.IN_PROGRESS]: { variant: "secondary", color: "bg-yellow-500" },
            [TicketStatus.RESOLVED]: { variant: "outline", color: "bg-green-500" },
            [TicketStatus.CLOSED]: { variant: "outline", color: "bg-gray-500" },
        };
        return <Badge variant={variants[status].variant}>{status.replace("_", " ").toUpperCase()}</Badge>;
    };

    const getPriorityBadge = (priority: TicketPriority) => {
        const colors: Record<TicketPriority, string> = {
            [TicketPriority.LOW]: "bg-gray-500",
            [TicketPriority.MEDIUM]: "bg-blue-500",
            [TicketPriority.HIGH]: "bg-orange-500",
            [TicketPriority.URGENT]: "bg-red-500",
        };
        return (
            <Badge className={colors[priority]}>
                {priority.toUpperCase()}
            </Badge>
        );
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                    Support Tickets
                </h2>
                <p className="text-text-secondary">Manage customer support requests.</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">Total Tickets</CardTitle>
                            <MessageSquare className="h-4 w-4 text-text-secondary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">Open</CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-text-primary">{stats.open}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">In Progress</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-text-primary">{stats.in_progress}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">Resolved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-text-primary">{stats.resolved}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">Closed</CardTitle>
                            <XCircle className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-text-primary">{stats.closed}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className="bg-cream-100 border-cream-200">
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Input
                            placeholder="Search by subject or user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border-cream-200"
                        />

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="border-cream-200">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="border-cream-200">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="border-cream-200">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="billing">Billing</SelectItem>
                                <SelectItem value="feature_request">Feature Request</SelectItem>
                                <SelectItem value="bug_report">Bug Report</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card className="bg-cream-100 border-cream-200">
                <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-cream-200">
                                    <th className="text-left p-3 text-text-secondary font-medium">ID</th>
                                    <th className="text-left p-3 text-text-secondary font-medium">Subject</th>
                                    <th className="text-left p-3 text-text-secondary font-medium">User</th>
                                    <th className="text-left p-3 text-text-secondary font-medium">Category</th>
                                    <th className="text-left p-3 text-text-secondary font-medium">Priority</th>
                                    <th className="text-left p-3 text-text-secondary font-medium">Status</th>
                                    <th className="text-left p-3 text-text-secondary font-medium">Replies</th>
                                    <th className="text-left p-3 text-text-secondary font-medium">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center p-8 text-text-secondary">
                                            No tickets found
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr
                                            key={ticket.id}
                                            className="border-b border-cream-200 hover:bg-cream-50 cursor-pointer"
                                            onClick={() => handleTicketClick(ticket.id)}
                                        >
                                            <td className="p-3 text-text-secondary">#{ticket.id}</td>
                                            <td className="p-3 text-text-primary">{ticket.subject}</td>
                                            <td className="p-3 text-text-secondary">{ticket.user_email}</td>
                                            <td className="p-3">
                                                <span className="text-text-secondary capitalize">
                                                    {ticket.category.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="p-3">{getPriorityBadge(ticket.priority)}</td>
                                            <td className="p-3">{getStatusBadge(ticket.status)}</td>
                                            <td className="p-3 text-text-secondary">{ticket.reply_count}</td>
                                            <td className="p-3 text-text-secondary">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Ticket Detail Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-cream-100 border-cream-200">
                    {detailLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : selectedTicket ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-text-primary">
                                    Ticket #{selectedTicket.id}: {selectedTicket.subject}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Ticket Info */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-cream-50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-text-secondary">User</p>
                                        <p className="text-text-primary">{selectedTicket.user_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-secondary">Category</p>
                                        <p className="text-text-primary capitalize">
                                            {selectedTicket.category.replace("_", " ")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-secondary">Priority</p>
                                        {getPriorityBadge(selectedTicket.priority)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-secondary">Status</p>
                                        <Select
                                            value={selectedTicket.status}
                                            onValueChange={(value) => handleStatusChange(value as TicketStatus)}
                                        >
                                            <SelectTrigger className="w-full border-cream-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="open">Open</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="resolved">Resolved</SelectItem>
                                                <SelectItem value="closed">Closed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Conversation */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-text-primary">Conversation</h3>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {selectedTicket.replies.map((reply) => (
                                            <div
                                                key={reply.id}
                                                className={`p-4 rounded-lg ${reply.is_admin
                                                    ? "bg-blue-100 border border-brand"
                                                    : "bg-cream-50 border border-cream-200"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-text-primary">
                                                        {reply.is_admin ? "馃懆鈥嶐煉?Admin" : "馃懁 User"} ({reply.author_email})
                                                    </span>
                                                    <span className="text-sm text-text-secondary">
                                                        {new Date(reply.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-text-primary whitespace-pre-wrap">{reply.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Reply Form */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-text-primary">Reply</h3>
                                    <Textarea
                                        placeholder="Type your reply..."
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        className="border-cream-200 min-h-[100px]"
                                    />
                                    <Button onClick={handleReply} disabled={replying || !replyMessage.trim()}>
                                        {replying ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            "Send Reply"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}

