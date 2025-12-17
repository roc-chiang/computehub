"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, MessageSquare } from "lucide-react";
import {
    createTicket,
    getMyTickets,
    getMyTicketDetail,
    replyToMyTicket,
    UserTicketListItem,
    UserTicketDetail,
    CreateTicketRequest,
    TicketStatus,
    TicketPriority,
    TicketCategory,
} from "@/lib/tickets-api";

export default function MyTicketsPage() {
    const [tickets, setTickets] = useState<UserTicketListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<UserTicketDetail | null>(null);
    const [newTicketOpen, setNewTicketOpen] = useState(false);
    const [replyMessage, setReplyMessage] = useState("");
    const [replying, setReplying] = useState(false);

    // New ticket form
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState<TicketCategory>(TicketCategory.TECHNICAL);
    const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
    const [message, setMessage] = useState("");
    const [creating, setCreating] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await getMyTickets();
            setTickets(data);
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

    const handleCreateTicket = async () => {
        if (!subject.trim() || !message.trim()) {
            toast({
                title: "Error",
                description: "Please fill in all fields",
                variant: "destructive",
            });
            return;
        }

        setCreating(true);
        try {
            const newTicket = await createTicket({
                subject,
                category,
                priority,
                message,
            });
            toast({
                title: "Success",
                description: "Ticket created successfully",
            });
            setNewTicketOpen(false);
            setSubject("");
            setMessage("");
            setCategory(TicketCategory.TECHNICAL);
            setPriority(TicketPriority.MEDIUM);
            fetchTickets();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create ticket",
                variant: "destructive",
            });
        } finally {
            setCreating(false);
        }
    };

    const handleTicketClick = async (ticketId: number) => {
        try {
            const detail = await getMyTicketDetail(ticketId);
            setSelectedTicket(detail);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load ticket details",
                variant: "destructive",
            });
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyMessage.trim()) return;

        setReplying(true);
        try {
            const newReply = await replyToMyTicket(selectedTicket.id, replyMessage);
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
        const variants: Record<TicketStatus, "default" | "secondary" | "outline"> = {
            [TicketStatus.OPEN]: "default",
            [TicketStatus.IN_PROGRESS]: "secondary",
            [TicketStatus.RESOLVED]: "outline",
            [TicketStatus.CLOSED]: "outline",
        };
        return <Badge variant={variants[status]}>{status.replace("_", " ").toUpperCase()}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                        My Support Tickets
                    </h2>
                    <p className="text-text-secondary">View and manage your support requests.</p>
                </div>

                <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-cream-50 border-cream-200">
                        <DialogHeader>
                            <DialogTitle className="text-text-primary">Create New Ticket</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Brief description of your issue"
                                    className="border-cream-200"
                                />
                            </div>

                            <div>
                                <Label htmlFor="category">Category</Label>
                                <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                                    <SelectTrigger className="border-cream-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="technical">Technical</SelectItem>
                                        <SelectItem value="billing">Billing</SelectItem>
                                        <SelectItem value="feature_request">Feature Request</SelectItem>
                                        <SelectItem value="bug_report">Bug Report</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                                    <SelectTrigger className="border-cream-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Describe your issue in detail..."
                                    className="border-cream-200 min-h-[150px]"
                                />
                            </div>

                            <Button onClick={handleCreateTicket} disabled={creating} className="w-full">
                                {creating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Ticket"
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tickets List */}
            <Card className="bg-cream-100 border-cream-200">
                <CardContent className="pt-6">
                    {tickets.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                            <p className="text-text-secondary">No tickets yet</p>
                            <p className="text-sm text-text-secondary mt-2">
                                Create a ticket to get support from our team
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="p-4 bg-cream-50 rounded-lg border border-cream-200 hover:border-brand cursor-pointer transition-colors"
                                    onClick={() => handleTicketClick(ticket.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-text-primary">
                                                    #{ticket.id} {ticket.subject}
                                                </h3>
                                                {getStatusBadge(ticket.status)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-text-secondary">
                                                <span className="capitalize">{ticket.category.replace("_", " ")}</span>
                                                <span>•</span>
                                                <span>{ticket.reply_count} replies</span>
                                                <span>•</span>
                                                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ticket Detail Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-cream-50 border-cream-200">
                    {selectedTicket && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-text-primary">
                                    Ticket #{selectedTicket.id}: {selectedTicket.subject}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Ticket Info */}
                                <div className="flex items-center gap-4 p-4 bg-cream-100 rounded-lg">
                                    <div>
                                        <p className="text-sm text-text-secondary">Status</p>
                                        {getStatusBadge(selectedTicket.status)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-secondary">Category</p>
                                        <p className="text-text-primary capitalize">
                                            {selectedTicket.category.replace("_", " ")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-secondary">Created</p>
                                        <p className="text-text-primary">
                                            {new Date(selectedTicket.created_at).toLocaleDateString()}
                                        </p>
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
                                                    : "bg-cream-100 border border-cream-200"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-text-primary">
                                                        {reply.is_admin ? "👨‍💼 Support Team" : "You"}
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

                                {/* Reply Form - Only if not closed */}
                                {selectedTicket.status !== TicketStatus.CLOSED && (
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-text-primary">Add Reply</h3>
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
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
