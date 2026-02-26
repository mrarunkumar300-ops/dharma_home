import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useInvoices } from "@/hooks/useInvoices";
import { useTenants } from "@/hooks/useTenants";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText, Download, Filter, MoreHorizontal, ArrowUpRight, ArrowDownRight, Loader2, Edit, Trash2, Eye, RefreshCw, CheckSquare, Square, DollarSign, CreditCard, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { RentInvoiceDialog2 } from "@/components/billing/RentInvoiceDialog2";
import { RentInvoice } from "@/components/billing/RentInvoice";
import { PaymentDialog } from "@/components/billing/PaymentDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Billing = () => {
    const { formatAmount } = useCurrency();
    const [activeTab, setActiveTab] = useState("all");
    const [isRentInvoiceDialogOpen, setIsRentInvoiceDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
    const [viewingInvoice, setViewingInvoice] = useState<any>(null);
    const [showInvoicePreview, setShowInvoicePreview] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
    const [showPaymentsView, setShowPaymentsView] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<{[key: string]: any[]}>({});
    const [paidAmounts, setPaidAmounts] = useState<{[key: string]: number}>({});
    const { data: invoices, isLoading, createInvoice, updateInvoice, deleteInvoice, getInvoiceStats, getInvoiceById } = useInvoices();
    const { data: tenants = [] } = useTenants();
    const [search, setSearch] = useState("");

    // Build tenant lookup map
    const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]));

    const { data: invoiceStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ["invoice-stats"],
        queryFn: async () => {
            if (!getInvoiceStats) return null;
            return await getInvoiceStats();
        },
        refetchInterval: 10000, // Refresh every 10 seconds
    });

    const filteredInvoices = invoices?.filter(inv => {
        const tenantName = inv.tenant_id ? tenantMap[inv.tenant_id]?.name || "" : "";
        const matchesSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
            tenantName.toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === "all" || inv.status.toLowerCase() === activeTab;
        return matchesSearch && matchesTab;
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetchStats();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleViewInvoice = async (invoiceId: string) => {
        try {
            const invoice = await getInvoiceById(invoiceId);
            console.log('Viewing invoice:', invoice);
            setViewingInvoice(invoice);
            setShowInvoicePreview(true);
        } catch (error) {
            console.error('Error fetching invoice:', error);
            toast.error('Failed to load invoice');
        }
    };

    const handleEditInvoice = async (invoice: any) => {
        console.log('Edit invoice:', invoice);
        // TODO: Implement invoice edit
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await deleteInvoice.mutateAsync(invoiceId);
            } catch (error) {
                console.error('Error deleting invoice:', error);
            }
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        await updateInvoice.mutateAsync({ id, status });
        refetchStats(); // Refresh stats after status change
    };

    const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
        if (checked) {
            setSelectedInvoices(prev => [...prev, invoiceId]);
        } else {
            setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedInvoices(filteredInvoices?.map(inv => inv.id) || []);
        } else {
            setSelectedInvoices([]);
        }
    };

    const handleBulkUpdateStatus = async (status: string) => {
        if (selectedInvoices.length === 0) return;
        
        for (const invoiceId of selectedInvoices) {
            await updateInvoice.mutateAsync({ id: invoiceId, status });
        }
        setSelectedInvoices([]);
        refetchStats();
    };

    const handleBulkDelete = async () => {
        if (selectedInvoices.length === 0) return;
        
        if (window.confirm(`Are you sure you want to delete ${selectedInvoices.length} invoice(s)?`)) {
            for (const invoiceId of selectedInvoices) {
                await deleteInvoice.mutate(invoiceId);
            }
            setSelectedInvoices([]);
            refetchStats();
        }
    };

    const handleAddPayment = (invoice: any) => {
        console.log('Add payment clicked for invoice:', invoice);
        console.log('Current paid amount:', getPaidAmount(invoice));
        console.log('Current pending amount:', getPendingAmount(invoice));
        setSelectedInvoiceForPayment(invoice);
        setShowPaymentDialog(true);
    };

    const handleViewPayments = (invoice: any) => {
        console.log('View payments clicked for invoice:', invoice);
        console.log('Invoice status:', invoice.status);
        console.log('Paid amount:', getPaidAmount(invoice));
        console.log('Payment history:', getPaymentHistory(invoice));
        setSelectedInvoiceForPayment(invoice);
        setShowPaymentsView(true);
    };

    const refreshInvoiceData = () => {
        // Force refresh of invoice data by updating the selected invoice
        if (selectedInvoiceForPayment) {
            setSelectedInvoiceForPayment({...selectedInvoiceForPayment});
        }
    };

    const handlePaymentSubmit = async (paymentData: any) => {
        try {
            console.log('Payment data:', paymentData);
            
            // Save payment to database
            const { data: payment, error } = await supabase
                .from('payments')
                .insert({
                    amount: paymentData.amount,
                    payment_method: paymentData.payment_method,
                    payment_date: paymentData.payment_date,
                    payment_time: paymentData.payment_time,
                    paid_by: paymentData.paid_by,
                    received_by: paymentData.received_by,
                    description: paymentData.description || 'Payment for invoice',
                    status: 'completed',
                    invoice_id: paymentData.invoice_id,
                    tenant_id: paymentData.tenant_id,
                    organization_id: selectedInvoiceForPayment.organization_id
                })
                .select()
                .single();

            if (error) {
                console.error('Error saving payment:', error);
                throw error;
            }

            console.log('Payment saved to database:', payment);
            
            // Update state immediately for real-time UI updates
            const invoiceId = selectedInvoiceForPayment.id;
            const currentPaidAmount = getPaidAmount(selectedInvoiceForPayment);
            const newPaidAmount = currentPaidAmount + paymentData.amount;
            const totalAmount = selectedInvoiceForPayment?.amount || 0;
            
            // Update paid amounts state
            setPaidAmounts(prev => ({
                ...prev,
                [invoiceId]: newPaidAmount
            }));
            
            // Add to payment history with database data
            const newPayment = {
                id: payment.id,
                amount: payment.amount,
                payment_method: payment.payment_method,
                payment_date: payment.payment_date,
                payment_time: paymentData.payment_time, // Use input data since DB doesn't have this field yet
                paid_by: paymentData.paid_by, // Use input data since DB doesn't have this field yet
                received_by: paymentData.received_by, // Use input data since DB doesn't have this field yet
                description: paymentData.description || 'Payment for invoice', // Use input data since DB doesn't have this field yet
                status: payment.status
            };
            
            setPaymentHistory(prev => ({
                ...prev,
                [invoiceId]: [...(prev[invoiceId] || []), newPayment]
            }));
            
            // Update invoice status based on payment
            let newStatus = 'pending';
            if (newPaidAmount >= totalAmount) {
                newStatus = 'paid';
            } else if (newPaidAmount > 0) {
                newStatus = 'partial';
            }

            // Update invoice status in database
            const { error: updateError } = await supabase
                .from('invoices')
                .update({ status: newStatus })
                .eq('id', invoiceId);

            if (updateError) {
                console.error('Error updating invoice status:', updateError);
            }
            
            console.log('Payment calculation:');
            console.log('- Total Amount:', totalAmount);
            console.log('- Current Paid:', currentPaidAmount);
            console.log('- New Payment:', paymentData.amount);
            console.log('- New Paid Amount:', newPaidAmount);
            console.log('- New Status:', newStatus);
            
            // Update invoice with new status (in real app, this would also update the database)
            await updateInvoice.mutateAsync({ 
                id: invoiceId, 
                status: newStatus
            });
            
            toast.success('Payment recorded successfully');
            refetchStats();
            refreshInvoiceData();
            setShowPaymentDialog(false);
            setSelectedInvoiceForPayment(null);
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Failed to process payment');
        }
    };

    const getPendingAmount = (invoice: any) => {
        // Auto calculate: Total Amount - Paid Amount = Pending Due
        const totalAmount = invoice.amount || 0;
        const paidAmount = getPaidAmount(invoice);
        return Math.max(0, totalAmount - paidAmount);
    };

    const getPaidAmount = (invoice: any) => {
        // Use state for real-time updates, fallback to status-based calculation
        const invoiceId = invoice?.id;
        if (invoiceId && paidAmounts[invoiceId] !== undefined) {
            return paidAmounts[invoiceId];
        }
        
        // Fallback to status-based calculation
        if (invoice.status === 'paid') return invoice.amount || 0;
        if (invoice.status === 'partial') return (invoice.amount || 0) * 0.3; // Simulate 30% paid for partial
        return 0;
    };

    const getPaymentHistory = (invoice: any) => {
        // Use only real payment data from state, no mock data
        const invoiceId = invoice?.id;
        if (invoiceId && paymentHistory[invoiceId]) {
            return paymentHistory[invoiceId];
        }
        
        // Return empty array if no real payment data exists
        return [];
    };

    // Function to fetch payment history from database
    const fetchPaymentHistory = async (invoiceId: string) => {
        try {
            const { data: payments, error } = await supabase
                .from('payments')
                .select('*')
                .eq('invoice_id', invoiceId)
                .order('payment_date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching payment history:', error);
                return [];
            }

            // Transform data to include the new fields (will be from DB after migration)
            return payments.map((payment: any) => ({
                ...payment,
                payment_time: (payment as any).payment_time || '12:00:00', // Default time if not available
                paid_by: (payment as any).paid_by || 'Unknown', // Default if not available
                received_by: (payment as any).received_by || 'Unknown', // Default if not available
                description: (payment as any).description || 'Payment for invoice'
            }));
        } catch (error) {
            console.error('Error fetching payment history:', error);
            return [];
        }
    };

    const statsData = [
        { 
            title: "Total Invoiced", 
            value: formatAmount(invoiceStats?.total || 0), 
            change: invoiceStats?.monthlyChange !== undefined ? `${invoiceStats?.monthlyChange >= 0 ? '+' : ''}${Math.round(Math.abs(invoiceStats?.monthlyChange || 0))}%` : "+0%", 
            trend: invoiceStats?.monthlyChange >= 0 ? "up" : invoiceStats?.monthlyChange < 0 ? "down" : "up" 
        },
        { 
            title: "Paid", 
            value: formatAmount(invoiceStats?.paid || 0), 
            change: invoiceStats?.paidPercentage !== undefined ? `${Math.round(invoiceStats?.paidPercentage)}%` : "0%", 
            trend: "up" 
        },
        { 
            title: "Overdue", 
            value: formatAmount(invoiceStats?.overdue || 0), 
            change: invoiceStats?.total > 0 ? `${Math.round((invoiceStats?.overdue / invoiceStats?.total) * 100)}%` : "0%", 
            trend: "down" 
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Billing & Invoices</h1>
                        <p className="text-muted-foreground mt-1">Manage your recurring revenue and tenant billing cycles.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                            {isRefreshing ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            {isRefreshing ? "Refreshing..." : "Refresh"}
                        </Button>
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="outline" onClick={() => setIsRentInvoiceDialogOpen(true)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Rent Invoice
                        </Button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statsData.map((stat, i) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-5"
                        >
                            <p className="text-sm text-muted-foreground">{stat.title}</p>
                            <div className="flex items-end justify-between mt-2">
                                <h3 className="text-2xl font-bold">
                                    {statsLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        stat.value
                                    )}
                                </h3>
                                <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${stat.trend === "up" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                                    }`}>
                                    {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {statsLoading ? "..." : stat.change}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Filters & Tabs */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                        <TabsList className="bg-muted/50 p-1">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="paid">Paid</TabsTrigger>
                            <TabsTrigger value="pending">Due</TabsTrigger>
                            <TabsTrigger value="overdue">Overdue</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex gap-2 items-center">
                        {selectedInvoices.length > 0 && (
                            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-lg">
                                <span className="text-sm font-medium">{selectedInvoices.length} selected</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            Bulk Actions
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleBulkUpdateStatus('paid')}>
                                            Mark as Paid
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleBulkUpdateStatus('overdue')}>
                                            Mark as Overdue
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleBulkDelete()} className="text-destructive">
                                            Delete Selected
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedInvoices([])}>
                                    Clear
                                </Button>
                            </div>
                        )}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search invoices..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">
                                        <Checkbox
                                            checked={selectedInvoices.length === filteredInvoices?.length && filteredInvoices?.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tenant</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Amount</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid Amount</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Due</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                        </td>
                                    </tr>
                                ) : filteredInvoices?.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                            No invoices found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices?.map((invoice, index) => (
                                        <motion.tr
                                            key={invoice.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                                        >
                                            <td className="p-4">
                                                <Checkbox
                                                    checked={selectedInvoices.includes(invoice.id)}
                                                    onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium">{invoice.invoice_number}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {invoice.tenant_id ? tenantMap[invoice.tenant_id]?.name || "Unknown" : "N/A"}
                                            </td>
                                            <td className="p-4">
                                                <Badge 
                                                    variant={invoice.status === 'paid' ? 'default' : invoice.status === 'partial' ? 'secondary' : invoice.status === 'overdue' ? 'destructive' : 'outline'}
                                                    className={`font-medium ${
                                                        invoice.status === 'paid' 
                                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600 shadow-md' 
                                                            : invoice.status === 'partial' 
                                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600 shadow-sm'
                                                                : invoice.status === 'overdue'
                                                                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 shadow-sm'
                                                                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-600'
                                                    }`}
                                                >
                                                    {invoice.status === 'paid' ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            PAID
                                                        </span>
                                                    ) : invoice.status === 'partial' ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            PARTIAL
                                                        </span>
                                                    ) : invoice.status === 'overdue' ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                            </svg>
                                                            OVERDUE
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 11-2 0 1 1 0 012 0zm0 2a1 1 0 10-2 0v4a1 1 0 102 0V9z" clipRule="evenodd" />
                                                            </svg>
                                                            PENDING
                                                        </span>
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                {new Date(invoice.due_date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 font-medium">
                                                {formatAmount(invoice.amount)}
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-green-600">
                                                    {formatAmount(getPaidAmount(invoice))}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-medium ${getPendingAmount(invoice) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {formatAmount(getPendingAmount(invoice))}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewInvoice(invoice.id)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    {getPendingAmount(invoice) > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleAddPayment(invoice)}
                                                            className="text-green-600 hover:text-green-700"
                                                        >
                                                            <DollarSign className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewPayments(invoice)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <Receipt className="w-4 h-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            {getPendingAmount(invoice) > 0 && (
                                                                <DropdownMenuItem 
                                                                    onClick={() => handleAddPayment(invoice)}
                                                                    className="text-green-600"
                                                                >
                                                                    <DollarSign className="w-4 h-4 mr-2" />
                                                                    Add Payment
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem 
                                                                onClick={() => handleViewPayments(invoice)}
                                                                className="text-blue-600"
                                                            >
                                                                <Receipt className="w-4 h-4 mr-2" />
                                                                View Payments
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                                                                className="text-green-600"
                                                            >
                                                                Mark as Paid
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => handleDeleteInvoice(invoice.id)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Rent Invoice Dialog */}
                <RentInvoiceDialog2
                    open={isRentInvoiceDialogOpen}
                    onOpenChange={setIsRentInvoiceDialogOpen}
                />

                {/* Invoice Preview */}
                {showInvoicePreview && viewingInvoice && (
                    <div className="fixed inset-0 bg-black/50 z-50">
                        <div className="h-full overflow-auto">
                            <RentInvoice 
                                apartmentName={viewingInvoice.unit?.property?.name || "Property Name"}
                                invoiceNumber={viewingInvoice.invoice_number}
                                invoiceDate={new Date(viewingInvoice.issue_date)}
                                dueDate={new Date(viewingInvoice.due_date)}
                                landlord={{
                                    name: viewingInvoice.unit?.property?.name || "Landlord Name",
                                    phone: viewingInvoice.unit?.property?.mobile || "+91 98765 43210",
                                    address: viewingInvoice.unit?.property?.address || "Property Address",
                                }}
                                tenant={{
                                    name: viewingInvoice.tenant?.name || "Tenant Name",
                                    mobile: viewingInvoice.tenant?.phone || "",
                                    roomNo: viewingInvoice.unit?.unit_number || "101",
                                    email: viewingInvoice.tenant?.email || ""
                                }}
                                billItems={[
                                    {
                                        type: 'rent',
                                        description: 'Room Rent',
                                        amount: viewingInvoice.amount,
                                    }
                                ]}
                                onDone={() => setShowInvoicePreview(false)}
                                showCloseButton={true}
                            />
                        </div>
                    </div>
                )}

                {/* Payment Dialog */}
                {showPaymentDialog && selectedInvoiceForPayment && (
                    <PaymentDialog
                        open={showPaymentDialog}
                        onOpenChange={setShowPaymentDialog}
                        invoice={{
                            ...selectedInvoiceForPayment,
                            paidAmount: getPaidAmount(selectedInvoiceForPayment)
                        }}
                        tenant={selectedInvoiceForPayment.tenant || tenants.find(t => t.id === selectedInvoiceForPayment.tenant_id)}
                        onSubmit={handlePaymentSubmit}
                        onSuccess={() => {
                            refetchStats();
                            // Refresh invoice list
                        }}
                    />
                )}

                {/* Payments View Modal */}
                {showPaymentsView && selectedInvoiceForPayment && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                            <Receipt className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Payment History</h2>
                                            <p className="text-blue-100 text-sm">Invoice {selectedInvoiceForPayment.invoice_number || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                            console.log('Closing payments view');
                                            setShowPaymentsView(false);
                                        }}
                                        className="text-white hover:bg-white/20 hover:text-white border-white/20"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                <div className="space-y-6">
                                    {/* Invoice Summary Card */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl overflow-hidden">
                                        <div className="bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-blue-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                    <DollarSign className="w-4 h-4 text-white" />
                                                </div>
                                                <h3 className="font-semibold text-blue-900">Invoice Summary</h3>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                                                    <p className="text-sm text-gray-600 mb-1 font-medium">Total Amount</p>
                                                    <p className="text-xl font-bold text-blue-600">{formatAmount(selectedInvoiceForPayment.amount || 0)}</p>
                                                </div>
                                                <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                                                    <p className="text-sm text-gray-600 mb-1 font-medium">Paid Amount</p>
                                                    <p className="text-xl font-bold text-green-600">{formatAmount(getPaidAmount(selectedInvoiceForPayment))}</p>
                                                </div>
                                                <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                                                    <p className="text-sm text-gray-600 mb-1 font-medium">Due/Pending</p>
                                                    <p className={`text-xl font-bold ${getPendingAmount(selectedInvoiceForPayment) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                        {formatAmount(getPendingAmount(selectedInvoiceForPayment))}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="space-y-2">
                                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                                    <div 
                                                        className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                                        style={{ width: `${((getPaidAmount(selectedInvoiceForPayment) / (selectedInvoiceForPayment.amount || 1)) * 100)}%` }}
                                                    >
                                                        {((getPaidAmount(selectedInvoiceForPayment) / (selectedInvoiceForPayment.amount || 1)) * 100) > 10 && (
                                                            <span className="text-xs text-white font-medium">
                                                                {Math.round((getPaidAmount(selectedInvoiceForPayment) / (selectedInvoiceForPayment.amount || 1)) * 100)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-600 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        {Math.round((getPaidAmount(selectedInvoiceForPayment) / (selectedInvoiceForPayment.amount || 1)) * 100)}% Paid
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                        {Math.round((getPendingAmount(selectedInvoiceForPayment) / (selectedInvoiceForPayment.amount || 1)) * 100)}% Pending
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Payment Status */}
                                    <div className={`bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 ${
                                        selectedInvoiceForPayment.status === 'paid' ? 'ring-2 ring-green-500 ring-opacity-50 bg-gradient-to-r from-green-50 to-emerald-50' : ''
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge 
                                                    variant={selectedInvoiceForPayment.status === 'paid' ? 'default' : selectedInvoiceForPayment.status === 'partial' ? 'secondary' : 'destructive'} 
                                                    className={`text-sm px-3 py-1 font-semibold ${
                                                        selectedInvoiceForPayment.status === 'paid' 
                                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600 shadow-lg animate-pulse' 
                                                            : selectedInvoiceForPayment.status === 'partial' 
                                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600 shadow-md'
                                                                : 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 shadow-md'
                                                    }`}
                                                >
                                                    {selectedInvoiceForPayment.status === 'paid' ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            FULLY PAID
                                                        </span>
                                                    ) : selectedInvoiceForPayment.status === 'partial' ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            PARTIALLY PAID
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                            </svg>
                                                            PENDING
                                                        </span>
                                                    )}
                                                </Badge>
                                                <span className="text-sm text-gray-700 font-medium">
                                                    {selectedInvoiceForPayment.status === 'paid' ? (
                                                        <span className="flex items-center gap-2">
                                                            Fully Paid
                                                            <span className="flex items-center gap-1 text-green-600">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                                <span className="text-xs font-semibold">COMPLETED</span>
                                                            </span>
                                                        </span>
                                                    ) : selectedInvoiceForPayment.status === 'partial' ? 'Partially Paid' : 'Payment Pending'}
                                                </span>
                                            </div>
                                            {getPendingAmount(selectedInvoiceForPayment) > 0 && (
                                                <Button 
                                                    onClick={() => {
                                                        console.log('Add payment clicked from view');
                                                        setShowPaymentsView(false);
                                                        handleAddPayment(selectedInvoiceForPayment);
                                                    }}
                                                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                                                >
                                                    <DollarSign className="w-4 h-4 mr-2" />
                                                    Add Payment
                                                </Button>
                                            )}
                                        </div>
                                        
                                        {/* Special celebration for fully paid */}
                                        {selectedInvoiceForPayment.status === 'paid' && (
                                            <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-lg">
                                                <div className="flex items-center gap-2 text-green-800">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="font-semibold">🎉 Congratulations! Invoice fully paid and completed.</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Payment History */}
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                                                    <Receipt className="w-4 h-4 text-white" />
                                                </div>
                                                <h3 className="font-semibold text-gray-900">Payment Records</h3>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            {getPaymentHistory(selectedInvoiceForPayment).length > 0 ? (
                                                <div className="space-y-3">
                                                    {getPaymentHistory(selectedInvoiceForPayment).map((payment, index) => (
                                                        <div key={payment.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300">
                                                            <div className="flex justify-between items-start">
                                                                <div className="space-y-2 flex-1">
                                                                    <div className="flex items-center gap-3">
                                                                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 px-2 py-1">
                                                                            {payment.payment_method}
                                                                        </Badge>
                                                                        <span className="text-sm text-gray-600 font-medium">
                                                                            {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                                                                                day: 'numeric',
                                                                                month: 'short',
                                                                                year: 'numeric'
                                                                            })}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500">
                                                                            {payment.payment_time || 'N/A'}
                                                                        </span>
                                                                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                                                            #{index + 1}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                                                        <span className="flex items-center gap-1">
                                                                            <span className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center text-xs">👤</span>
                                                                            <span className="font-medium">Paid:</span>
                                                                            <span>{payment.paid_by || 'N/A'}</span>
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <span className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center text-xs">💼</span>
                                                                            <span className="font-medium">Received:</span>
                                                                            <span>{payment.received_by || 'N/A'}</span>
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700 font-medium">{payment.description}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xl font-bold text-green-600">{formatAmount(payment.amount)}</p>
                                                                    <Badge variant="outline" className="text-xs border-green-500 text-green-700 bg-green-50">
                                                                        {payment.status}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    
                                                    {/* Payment Summary */}
                                                    <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-bold text-blue-700">Total Paid:</span>
                                                            <span className="text-xl font-bold text-blue-800">
                                                                {formatAmount(getPaymentHistory(selectedInvoiceForPayment).reduce((sum, payment) => sum + payment.amount, 0))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 text-gray-500">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Receipt className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-lg font-semibold mb-2">No payments recorded yet</p>
                                                    <p className="text-sm mb-6 text-gray-600">Pending due amount: <span className="font-bold text-orange-600">{formatAmount(getPendingAmount(selectedInvoiceForPayment))}</span></p>
                                                    {getPendingAmount(selectedInvoiceForPayment) > 0 && (
                                                        <Button 
                                                            onClick={() => {
                                                                console.log('Record first payment clicked');
                                                                setShowPaymentsView(false);
                                                                handleAddPayment(selectedInvoiceForPayment);
                                                            }}
                                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                                                        >
                                                            <DollarSign className="w-4 h-4 mr-2" />
                                                            Record First Payment
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Billing;
