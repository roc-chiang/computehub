"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Mail, CheckCircle2, XCircle, Search, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { getNotificationHistory, type NotificationHistoryItem } from "@/lib/notification-api";

export default function NotificationHistoryPage() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
    const [filteredNotifications, setFilteredNotifications] = useState<NotificationHistoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [channelFilter, setChannelFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchHistory();
        }
    }, [isLoaded, isSignedIn, currentPage]);

    useEffect(() => {
        applyFilters();
    }, [notifications, channelFilter, statusFilter, searchQuery]);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            if (!token) {
                throw new Error("No authentication token");
            }

            const data = await getNotificationHistory(
                token,
                ITEMS_PER_PAGE,
                (currentPage - 1) * ITEMS_PER_PAGE
            );

            setNotifications(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error("Failed to fetch notification history:", err);
            setError("Failed to load notification history. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...notifications];

        // Channel filter
        if (channelFilter !== "all") {
            filtered = filtered.filter(n => n.channel.toLowerCase() === channelFilter);
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(n => n.status.toLowerCase() === statusFilter);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(n =>
                n.title?.toLowerCase().includes(query) ||
                n.message?.toLowerCase().includes(query)
            );
        }

        setFilteredNotifications(filtered);
    };

    const getChannelIcon = (channel: string) => {
        switch (channel.toLowerCase()) {
            case "telegram":
                return <Bell className="h-4 w-4 text-blue-500" />;
            case "email":
                return <Mail className="h-4 w-4 text-gray-500" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "sent":
                return (
                    <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Sent
                    </Badge>
                );
            case "failed":
                return (
                    <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    if (!isLoaded || !isSignedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Notification History</h1>
                <p className="text-muted-foreground">
                    View all your past notifications and their delivery status
                </p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Channel Filter */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Channel</label>
                            <Select value={channelFilter} onValueChange={setChannelFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Channels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Channels</SelectItem>
                                    <SelectItem value="telegram">Telegram</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search notifications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error State */}
            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Loading State */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredNotifications.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            {searchQuery || channelFilter !== "all" || statusFilter !== "all"
                                ? "Try adjusting your filters to see more results."
                                : "Notifications will appear here when you receive them."}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Notification List */}
            {!loading && filteredNotifications.length > 0 && (
                <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <Card key={notification.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {getChannelIcon(notification.channel)}
                                        <CardTitle className="text-lg">
                                            {notification.title || "Notification"}
                                        </CardTitle>
                                    </div>
                                    {getStatusBadge(notification.status)}
                                </div>
                                <CardDescription>
                                    {notification.event_type} • {formatDate(notification.created_at)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {notification.message}
                                </p>
                                {notification.error_message && (
                                    <Alert variant="destructive" className="mt-3">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-xs">
                                            <strong>Error:</strong> {notification.error_message}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                    <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                        {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} notifications
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
