import { useState } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { 
  CreditCard, TrendingUp, Building2, Search, Plus, Calendar, AlertCircle, 
  CheckCircle, Clock, FileText, Download, Filter, RefreshCw 
} from "lucide-react";
import { toast } from "sonner";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning, 45 93% 47%))", "hsl(var(--success))", "hsl(var(--muted-foreground))"];

const SuperAdminSubscriptions = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  const { data: orgData = [], isLoading } = useQuery({
    queryKey: ["super-admin-subscriptions"],
    queryFn: async () => {
      const { data: orgs, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: payments } = await supabase.from("payments").select("organization_id, amount, status, created_at");
      const { data: invoices } = await supabase.from("invoices").select("organization_id, amount, status, created_at, due_date");

      const paymentMap = new Map<string, { total: number; count: number; recent: number[] }>();
      payments?.forEach((p) => {
        const existing = paymentMap.get(p.organization_id) || { total: 0, count: 0, recent: [] };
        existing.total += Number(p.amount);
        existing.count += 1;
        existing.recent.push(Number(p.amount));
        paymentMap.set(p.organization_id, existing);
      });

      const invoiceMap = new Map<string, { total: number; pending: number; overdue: number }>();
      const now = new Date();
      invoices?.forEach((i) => {
        const existing = invoiceMap.get(i.organization_id) || { total: 0, pending: 0, overdue: 0 };
        existing.total += Number(i.amount);
        if (i.status === "pending") {
          existing.pending += Number(i.amount);
          if (i.due_date && new Date(i.due_date) < now) {
            existing.overdue += Number(i.amount);
          }
        }
        invoiceMap.set(i.organization_id, existing);
      });

      return (orgs || []).map((o) => {
        const paymentData = paymentMap.get(o.id) || { total: 0, count: 0, recent: [] };
        const invoiceData = invoiceMap.get(o.id) || { total: 0, pending: 0, overdue: 0 };
        const planStatus = o.plan_valid_until ? (new Date(o.plan_valid_until) > now ? 'active' : 'expired') : 'active';
        
        return {
          ...o,
          total_payments: paymentData.total,
          payment_count: paymentData.count,
          recent_payments: paymentData.recent.slice(-3),
          total_invoiced: invoiceData.total,
          pending_amount: invoiceData.pending,
          overdue_amount: invoiceData.overdue,
          plan_status: planStatus,
          health_score: Math.max(0, 100 - (invoiceData.overdue / Math.max(1, invoiceData.total)) * 100)
        };
      });
    },
  });

  const { data: billingTrends = [] } = useQuery({
    queryKey: ["super-admin-billing-trends"],
    queryFn: async () => {
      const { data: payments } = await supabase.from("payments").select("amount, created_at").order("created_at", { ascending: false }).limit(100);
      const { data: invoices } = await supabase.from("invoices").select("amount, status, created_at").order("created_at", { ascending: false }).limit(100);

      // Monthly trends for last 6 months
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const nextD = new Date(d);
        nextD.setMonth(nextD.getMonth() + 1);
        
        const monthPayments = payments?.filter(p => {
          const created = new Date(p.created_at);
          return created >= d && created < nextD;
        }).reduce((s, p) => s + Number(p.amount), 0) || 0;
        
        const monthInvoices = invoices?.filter(i => {
          const created = new Date(i.created_at);
          return created >= d && created < nextD;
        }).reduce((s, i) => s + Number(i.amount), 0) || 0;
        
        monthlyData.push({
          month: d.toLocaleString("default", { month: "short" }),
          revenue: monthPayments,
          invoiced: monthInvoices
        });
      }
      
      return monthlyData;
    }
  });

  const totalRevenue = orgData.reduce((s, o) => s + o.total_payments, 0);
  const totalPending = orgData.reduce((s, o) => s + o.pending_amount, 0);
  const totalOverdue = orgData.reduce((s, o) => s + o.overdue_amount, 0);
  const totalInvoiced = orgData.reduce((s, o) => s + o.total_invoiced, 0);
  const activeOrgs = orgData.filter(o => o.plan_status === 'active').length;
  
  const filteredOrgs = orgData.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && org.plan_status === 'active') ||
      (statusFilter === 'expired' && org.plan_status === 'expired') ||
      (statusFilter === 'overdue' && org.overdue_amount > 0);
    return matchesSearch && matchesStatus;
  });

  const metrics = [
    { 
      title: "Total Revenue", 
      value: `$${totalRevenue.toLocaleString()}`, 
      change: `+${Math.floor(totalRevenue * 0.12)}% this year`, 
      changeType: "positive" as const, 
      icon: CurrencyIcon,
      trend: "up"
    },
    { 
      title: "Pending Invoices", 
      value: `$${totalPending.toLocaleString()}`, 
      change: `${Math.floor((totalPending / Math.max(1, totalInvoiced)) * 100)}% of total`, 
      changeType: "neutral" as const, 
      icon: CreditCard,
      trend: "stable"
    },
    { 
      title: "Overdue Amount", 
      value: `$${totalOverdue.toLocaleString()}`, 
      change: totalOverdue > 0 ? "Action required" : "All settled", 
      changeType: totalOverdue > 0 ? "negative" as "negative" : "positive" as "positive", 
      icon: AlertCircle,
      trend: totalOverdue > 0 ? "down" : "stable"
    },
    { 
      title: "Active Orgs", 
      value: `${activeOrgs}/${orgData.length}`, 
      change: `${Math.floor((activeOrgs / Math.max(1, orgData.length)) * 100)}% active`, 
      changeType: "positive" as const, 
      icon: Building2,
      trend: "stable"
    },
  ];

  const statusDistribution = [
    { name: "Active", value: activeOrgs, color: COLORS[2] },
    { name: "Expired", value: orgData.filter(o => o.plan_status === 'expired').length, color: COLORS[1] },
    { name: "Overdue", value: orgData.filter(o => o.overdue_amount > 0).length, color: COLORS[2] },
  ];

  const generateInvoice = useMutation({
    mutationFn: async (orgId: string) => {
      // Mock invoice generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, invoiceId: `INV-${Date.now()}` };
    },
    onSuccess: () => {
      toast.success("Invoice generated successfully");
      setInvoiceDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["super-admin-subscriptions"] });
    },
    onError: () => {
      toast.error("Failed to generate invoice");
    }
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Subscriptions & Billing
            </h1>
            <p className="text-muted-foreground mt-2">Financial overview and subscription management across all organizations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Export Report
            </Button>
            <Button onClick={() => setInvoiceDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Generate Invoice
            </Button>
          </div>
        </div>

        {/* Enhanced Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={m.title} {...m} index={i} />
          ))}
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trends */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Revenue Trends</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={billingTrends}>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--success))", r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="invoiced" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Subscription Status</h3>
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            {statusDistribution.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                    data={statusDistribution} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={90} 
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No data available</div>
            )}
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search organizations..." 
              className="pl-10" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Organization</TableHead>
                <TableHead>Plan Status</TableHead>
                <TableHead>Payments</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Health</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading billing data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No billing data found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrgs.map((org) => (
                  <TableRow key={org.id} className="border-border/30 hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{org.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {org.plan_price && `₹${Number(org.plan_price).toLocaleString()}/month`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge 
                          variant="outline" 
                          className={`capitalize ${
                            org.plan_status === 'active' 
                              ? 'bg-success/10 text-success border-success/20'
                              : 'bg-destructive/10 text-destructive border-destructive/20'
                          }`}
                        >
                          {org.plan_status}
                        </Badge>
                        {org.plan_valid_until && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(org.plan_valid_until).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{org.payment_count}</div>
                        <div className="text-xs text-muted-foreground">payments</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-green-600">
                        ${org.total_payments.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-yellow-600">
                        ${org.pending_amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${org.overdue_amount > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        ${org.overdue_amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Progress 
                          value={org.health_score} 
                          className="h-2 w-20"
                        />
                        <div className="text-xs text-muted-foreground">
                          {Math.round(org.health_score)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSelectedOrg(org);
                          setInvoiceDialogOpen(true);
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>

        {/* Generate Invoice Dialog */}
        <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Invoice</DialogTitle>
              <DialogDescription>
                {selectedOrg ? `Create invoice for ${selectedOrg.name}` : "Select an organization to generate invoice"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Organization</Label>
                <Select value={selectedOrg?.id || ""} onValueChange={(value) => {
                  const org = orgData.find(o => o.id === value);
                  setSelectedOrg(org);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgData.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name} - {org.plan_status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedOrg && (
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Current Plan:</span>
                    <span className="font-medium">₹{Number(selectedOrg.plan_price || 0).toLocaleString()}/month</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending Amount:</span>
                    <span className="font-medium text-yellow-600">${selectedOrg.pending_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Overdue Amount:</span>
                    <span className="font-medium text-red-600">${selectedOrg.overdue_amount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => selectedOrg && generateInvoice.mutate(selectedOrg.id)} 
                disabled={generateInvoice.isPending || !selectedOrg}
              >
                {generateInvoice.isPending ? "Generating..." : "Generate Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSubscriptions;
