import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { TenantQuickActions } from "@/components/admin/TenantQuickActions";
import { Building2, Users, TrendingUp, Home, Wrench, AlertCircle, CheckCircle, CreditCard, FileText, ArrowUpRight, ArrowDownRight, Plus, Eye, Database, List, Package, Calendar } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";
import { useUnits } from "@/hooks/useUnits";
import { useInvoices } from "@/hooks/useInvoices";
import { useMaintenanceTickets } from "@/hooks/useMaintenanceTickets";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { data: tenants = [], isLoading: tenantsLoading } = useTenants();
  const { units, isLoading: unitsLoading } = useUnits();
  const invoicesQuery = useInvoices();
  const ticketsQuery = useMaintenanceTickets();
  
  const invoices = invoicesQuery.data || [];
  const tickets = ticketsQuery.data || [];
  
  const isLoading = propertiesLoading || tenantsLoading || unitsLoading || invoicesQuery.isLoading || ticketsQuery.isLoading;

  const totalRevenue = invoices.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + Number(i.amount), 0);
  const totalInvoiced = invoices.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
  const activeTenants = tenants.filter(t => t.status === "active").length;
  const totalUnits = units?.length || 0;
  const occupiedUnits = units?.filter(u => u.tenant_id).length || 0;
  const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : "0";
  const openTickets = tickets.filter((t: any) => t.status === "open").length;
  const pendingInvoices = invoices.filter((i: any) => i.status === "pending").length;
  const overdueInvoices = invoices.filter((i: any) => i.status === "overdue").length;
  const paidInvoices = invoices.filter((i: any) => i.status === "paid").length;
  const collectionRate = totalInvoiced > 0 ? ((totalRevenue / totalInvoiced) * 100).toFixed(1) : "0";
  
  const adminMetrics = [
    { 
      title: "Total Revenue", 
      value: formatAmount(totalRevenue), 
      change: `${collectionRate}% collection rate`, 
      changeType: Number(collectionRate) > 80 ? "positive" as const : Number(collectionRate) > 60 ? "neutral" as const : "negative" as const, 
      icon: CurrencyIcon 
    },
    { 
      title: "Total Invoiced", 
      value: formatAmount(totalInvoiced), 
      change: `${invoices.length} total invoices`, 
      changeType: "positive" as const, 
      icon: FileText 
    },
    { 
      title: "Properties", 
      value: (properties?.length || 0).toString(), 
      change: `${totalUnits} total units`, 
      changeType: "positive" as const, 
      icon: Building2 
    },
    { 
      title: "Active Tenants", 
      value: activeTenants.toString(), 
      change: `${tenants.length} total tenants`, 
      changeType: "positive" as const, 
      icon: Users 
    },
    { 
      title: "Occupancy Rate", 
      value: `${occupancyRate}%`, 
      change: `${occupiedUnits}/${totalUnits} units occupied`, 
      changeType: Number(occupancyRate) > 80 ? "positive" as const : Number(occupancyRate) > 60 ? "neutral" as const : "negative" as const, 
      icon: TrendingUp 
    },
    { 
      title: "Open Tickets", 
      value: openTickets.toString(), 
      change: openTickets > 5 ? "High priority" : "Normal", 
      changeType: openTickets > 5 ? "negative" as const : "positive" as const, 
      icon: Wrench 
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <Button>Download</Button>
          </div>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-3 w-full" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminMetrics.map((metric, i) => (
                <MetricCard key={metric.title} {...metric} index={i} />
              ))}
            </div>

            {/* Enhanced Invoice Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingInvoices}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatAmount(invoices.filter((i: any) => i.status === "pending").reduce((sum: number, i: any) => sum + Number(i.amount), 0))} pending
                    </p>
                    <Progress value={invoices.length > 0 ? (pendingInvoices / invoices.length) * 100 : 0} className="mt-2" />
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{overdueInvoices}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatAmount(invoices.filter((i: any) => i.status === "overdue").reduce((sum: number, i: any) => sum + Number(i.amount), 0))} overdue
                    </p>
                    <Badge variant={overdueInvoices > 0 ? "destructive" : "secondary"} className="mt-2">
                      {overdueInvoices > 0 ? "Action Required" : "All Clear"}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{collectionRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      {paidInvoices} of {invoices.length} paid
                    </p>
                    <Progress value={Number(collectionRate)} className="mt-2" />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <TenantQuickActions />
              </motion.div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <OccupancyChart />
        </div>

        <ActivityFeed />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
