import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMaintenanceTickets } from "@/hooks/useMaintenanceTickets";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Wrench, Clock, CheckCircle2, MoreHorizontal, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const statuses = [
    { id: "open", label: "Open", icon: AlertCircle, color: "text-primary", bg: "bg-primary/10" },
    { id: "in_progress", label: "In Progress", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { id: "completed", label: "Completed", icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
];

const PriorityBadge = ({ priority }: { priority: string }) => {
    const styles: Record<string, string> = {
        high: "bg-destructive/10 text-destructive border-destructive/20",
        medium: "bg-warning/10 text-warning border-warning/20",
        low: "bg-success/10 text-success border-success/20",
    };

    return (
        <Badge variant="outline" className={cn("text-[10px] uppercase px-1.5 py-0", styles[priority.toLowerCase()] || "")}>
            {priority}
        </Badge>
    );
};

const Maintenance = () => {
    const { data: tickets, isLoading, updateTicket } = useMaintenanceTickets();
    const [search, setSearch] = useState("");

    const filteredTickets = tickets?.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
    );

    const getTicketsByStatus = (status: string) =>
        filteredTickets?.filter(t => t.status.toLowerCase() === status.toLowerCase()) || [];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Maintenance Tickets</h1>
                        <p className="text-muted-foreground mt-1">Track and manage repair requests and work orders.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button className="glow-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            New Ticket
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tickets..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Kanban Board */}
                {isLoading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px]">
                        {statuses.map((status) => (
                            <div key={status.id} className="flex flex-col gap-4">
                                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                    <div className="flex items-center gap-2">
                                        <status.icon className={cn("w-4 h-4", status.color)} />
                                        <h3 className="font-semibold text-sm uppercase tracking-wider">{status.label}</h3>
                                        <Badge variant="secondary" className="ml-2 bg-muted/50">
                                            {getTicketsByStatus(status.id).length}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {getTicketsByStatus(status.id).map((ticket, i) => (
                                            <motion.div
                                                key={ticket.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.2 }}
                                                className="glass-card p-4 space-y-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors group"
                                                draggable
                                                onDragStart={(e: any) => {
                                                    e.dataTransfer?.setData("ticketId", ticket.id);
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-medium text-sm line-clamp-2">{ticket.title}</h4>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {ticket.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                                                )}

                                                <div className="flex items-center justify-between pt-2">
                                                    <PriorityBadge priority={ticket.priority} />
                                                    <div className="flex -space-x-2">
                                                        <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center">
                                                            <span className="text-[10px] font-bold">JD</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-[10px] text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(ticket.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span>ID: {ticket.id.slice(0, 6).toUpperCase()}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {/* Drop Zone */}
                                    <div
                                        className="h-24 rounded-xl border-2 border-dashed border-border/30 flex items-center justify-center text-muted-foreground/30 hover:border-primary/30 hover:text-primary/30 transition-colors"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const ticketId = e.dataTransfer.getData("ticketId");
                                            updateTicket.mutate({ id: ticketId, status: status.id });
                                        }}
                                    >
                                        Drop here to move
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Maintenance;
