import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePayments } from "@/hooks/usePayments";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Plus, Search, CreditCard, Filter, MoreHorizontal, CheckCircle2, Loader2, ArrowRight, Edit, Trash2, Eye, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaymentDialog } from "@/components/billing/PaymentDialog";

const Payments = () => {
    const { formatAmount } = useCurrency();
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [editingPayment, setEditingPayment] = useState<any>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
    const { data: payments, isLoading, createPayment, updatePayment, deletePayment, getPaymentStats, getPaymentById } = usePayments();
    const [search, setSearch] = useState("");

    const { data: paymentStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ["payment-stats"],
        queryFn: async () => {
            if (!getPaymentStats) return null;
            return await getPaymentStats();
        },
        refetchInterval: 10000, // Refresh every 10 seconds
    });

    const filteredPayments = payments?.filter(pay =>
        pay.id.toLowerCase().includes(search.toLowerCase()) ||
        pay.payment_method?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDeletePayment = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this payment record?")) {
            await deletePayment.mutateAsync(id);
        }
    };

    const handleCreatePayment = async (data: any) => {
        await createPayment.mutateAsync(data);
        refetchStats(); // Refresh stats after creating
    };

    const handleEditPayment = async (data: any) => {
        if (editingPayment) {
            await updatePayment.mutateAsync({ id: editingPayment.id, ...data });
            refetchStats(); // Refresh stats after updating
        }
    };

    const handleViewDetails = async (payment: any) => {
        const detailedPayment = await getPaymentById(payment.id);
        setEditingPayment(detailedPayment);
        setIsViewDialogOpen(true);
    };

    const handleEdit = async (payment: any) => {
        setEditingPayment(payment);
        setIsPaymentDialogOpen(true);
    };

    const handleReceipt = async (payment: any) => {
        const detailedPayment = await getPaymentById(payment.id);
        setEditingPayment(detailedPayment);
        setIsReceiptDialogOpen(true);
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetchStats();
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payments History</h1>
                        <p className="text-muted-foreground mt-1">Track processed payments and transaction records.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleManualRefresh} disabled={isRefreshing}>
                            {isRefreshing ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            {isRefreshing ? "Refreshing..." : "Refresh"}
                        </Button>
                        <Button className="glow-primary" onClick={() => {
                        setEditingPayment(null);
                        setIsPaymentDialogOpen(true);
                    }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Record Payment
                        </Button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                        <p className="text-sm text-muted-foreground">Total Received</p>
                        <div className="flex items-end justify-between mt-2">
                            <h3 className="text-2xl font-bold text-green-500">
                                {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatAmount(paymentStats?.total || 0)}
                            </h3>
                            <div className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {statsLoading ? "..." : `${paymentStats?.count || 0} txns`}
                            </div>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
                        <p className="text-sm text-muted-foreground">Pending Due</p>
                        <div className="flex items-end justify-between mt-2">
                            <h3 className="text-2xl font-bold text-yellow-500">
                                {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatAmount(paymentStats?.pendingAmount || 0)}
                            </h3>
                            <div className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500">
                                {statsLoading ? "..." : "pending"}
                            </div>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
                        <p className="text-sm text-muted-foreground">Overdue</p>
                        <div className="flex items-end justify-between mt-2">
                            <h3 className="text-2xl font-bold text-destructive">
                                {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatAmount(paymentStats?.overdueAmount || 0)}
                            </h3>
                            <div className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                                {statsLoading ? "..." : "overdue"}
                            </div>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
                        <p className="text-sm text-muted-foreground">Total Invoiced</p>
                        <div className="flex items-end justify-between mt-2">
                            <h3 className="text-2xl font-bold">
                                {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatAmount(paymentStats?.totalInvoiced || 0)}
                            </h3>
                            <div className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                                {statsLoading ? "..." : "all time"}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by ID or method..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter History
                    </Button>
                </div>

                {/* Payments Grid/Table */}
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                        </td>
                                    </tr>
                                ) : filteredPayments?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            No payments recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayments?.map((payment, i) => (
                                        <motion.tr
                                            key={payment.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                                                        <CreditCard className="w-4 h-4 text-success" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">TXN-{payment.id.slice(0, 8).toUpperCase()}</p>
                                                        <p className="text-xs text-muted-foreground">Invoice: {payment.invoice_id?.slice(0, 8) || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm">
                                                {new Date(payment.payment_date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-medium">{payment.payment_method || "Credit Card"}</span>
                                            </td>
                                            <td className="p-4 text-sm font-bold text-success">
                                                +{formatAmount(payment.amount)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-success">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => handleViewDetails(payment)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEdit(payment)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleReceipt(payment)}>
                                                            Receipt <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePayment(payment.id)}>
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Dialog */}
                <PaymentDialog
                    open={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    onSubmit={editingPayment ? handleEditPayment : handleCreatePayment}
                    isLoading={createPayment.isPending || updatePayment.isPending}
                    initialData={editingPayment}
                />

                {/* View Details Dialog */}
                {isViewDialogOpen && editingPayment && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-background p-6 rounded-xl max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                                    <p className="font-medium">TXN-{editingPayment.id.slice(0, 8).toUpperCase()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Amount</p>
                                    <p className="font-medium text-success">+{formatAmount(editingPayment.amount)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment Method</p>
                                    <p className="font-medium">{editingPayment.payment_method || "Credit Card"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment Date</p>
                                    <p className="font-medium">{new Date(editingPayment.payment_date).toLocaleDateString()}</p>
                                </div>
                                {editingPayment.invoice && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Linked Invoice</p>
                                        <p className="font-medium">{editingPayment.invoice.invoice_number}</p>
                                    </div>
                                )}
                                {editingPayment.invoice?.tenant && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tenant</p>
                                        <p className="font-medium">{editingPayment.invoice.tenant.name}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                                    Close
                                </Button>
                                <Button onClick={() => {
                                    setIsViewDialogOpen(false);
                                    setIsPaymentDialogOpen(true);
                                }}>
                                    Edit Payment
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipt Dialog */}
                {isReceiptDialogOpen && editingPayment && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-background p-8 rounded-xl max-w-md w-full mx-4">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-success" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Payment Receipt</h3>
                                <p className="text-sm text-muted-foreground">Thank you for your payment</p>
                            </div>
                            
                            <div className="border-t border-b border-border/50 py-4 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Transaction ID</span>
                                    <span className="font-mono text-sm">TXN-{editingPayment.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Date</span>
                                    <span className="text-sm">{new Date(editingPayment.payment_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Payment Method</span>
                                    <span className="text-sm font-medium">{editingPayment.payment_method || "Credit Card"}</span>
                                </div>
                                {editingPayment.invoice && (
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-muted-foreground">Invoice</span>
                                        <span className="text-sm">{editingPayment.invoice.invoice_number}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-lg font-semibold">Total Paid</span>
                                <span className="text-2xl font-bold text-success">{formatAmount(editingPayment.amount)}</span>
                            </div>
                            
                            {editingPayment.invoice?.tenant && (
                                <div className="bg-muted/30 rounded-lg p-3 mb-4">
                                    <p className="text-xs text-muted-foreground mb-1">Paid by</p>
                                    <p className="font-medium">{editingPayment.invoice.tenant.name}</p>
                                </div>
                            )}
                            
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setIsReceiptDialogOpen(false)}>
                                    Close
                                </Button>
                                <Button className="flex-1" onClick={() => {
                                    // Print receipt functionality
                                    window.print();
                                }}>
                                    Print Receipt
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Payments;
