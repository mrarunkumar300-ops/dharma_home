import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Users, Building2, Home, FileText, Wrench, TrendingUp, Activity, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning, 45 93% 47%))", "hsl(var(--success))", "hsl(var(--muted-foreground))"];
const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning, 45 93% 47%))",
  destructive: "hsl(var(--destructive))",
};

const SuperAdminAnalytics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["super-admin-analytics"],
    queryFn: async () => {
      const [profiles, orgs, properties, units, tenants, invoices, tickets, payments, activities] = await Promise.all([
        supabase.from("profiles").select("id, created_at"),
        supabase.from("organizations").select("id, name, status"),
        supabase.from("properties").select("id, organization_id, status"),
        supabase.from("units").select("id, availability, rent"),
        supabase.from("tenants").select("id, status"),
        supabase.from("invoices").select("id, amount, status, created_at"),
        supabase.from("maintenance_tickets").select("id, status, priority, created_at"),
        supabase.from("payments").select("id, amount, created_at"),
        supabase.from("activity_log").select("action, created_at, entity_type").order("created_at", { ascending: false }).limit(10)
      ]);

      const totalRent = units.data?.reduce((s, u) => s + Number(u.rent), 0) || 0;
      const totalPayments = payments.data?.reduce((s, p) => s + Number(p.amount), 0) || 0;
      const occupiedUnits = units.data?.filter((u) => u.availability === "occupied").length || 0;
      const totalUnits = units.data?.length || 0;

      const ticketsByStatus = tickets.data?.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const ticketsByPriority = tickets.data?.reduce((acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const invoicesByStatus = invoices.data?.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Enhanced time series data
      const now = new Date();
      const monthlyData = [];
      const revenueData = [];
      const activityData = [];
      
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const userCount = profiles.data?.filter((p) => {
          const created = new Date(p.created_at);
          return created >= d && created < nextD;
        }).length || 0;
        
        const revenue = payments.data?.filter((p) => {
          const created = new Date(p.created_at);
          return created >= d && created < nextD;
        }).reduce((s, p) => s + Number(p.amount), 0) || 0;
        
        const activityCount = activities.data?.filter((a) => {
          const created = new Date(a.created_at);
          return created >= d && created < nextD;
        }).length || 0;
        
        monthlyData.push({ 
          month: d.toLocaleString("default", { month: "short" }), 
          users: userCount,
          totalUsers: profiles.data?.filter((p) => new Date(p.created_at) < nextD).length || 0
        });
        
        revenueData.push({ 
          month: d.toLocaleString("default", { month: "short" }), 
          revenue,
          cumulative: revenueData.length > 0 ? revenueData[revenueData.length - 1].cumulative + revenue : revenue
        });
        
        activityData.push({ 
          month: d.toLocaleString("default", { month: "short" }), 
          activity: activityCount
        });
      }

      // Organization distribution
      const orgDistribution = orgs.data?.reduce((acc, org) => {
        const status = org.status || 'active';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Property performance
      const propertyPerformance = properties.data?.reduce((acc, prop) => {
        const status = prop.status || 'active';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        users: profiles.data?.length || 0,
        orgs: orgs.data?.length || 0,
        properties: properties.data?.length || 0,
        totalUnits,
        occupiedUnits,
        tenants: tenants.data?.length || 0,
        totalRent,
        totalPayments,
        ticketsByStatus,
        ticketsByPriority,
        invoicesByStatus,
        monthlyData,
        revenueData,
        activityData,
        orgDistribution,
        propertyPerformance,
        occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
        recentActivities: activities.data?.slice(0, 5) || [],
      };
    },
  });

  const metrics = [
    { 
      title: "Total Users", 
      value: String(stats?.users || 0), 
      change: `+${Math.floor((stats?.users || 0) * 0.15)}% growth`, 
      changeType: "positive" as const, 
      icon: Users,
      trend: "up"
    },
    { 
      title: "Organizations", 
      value: String(stats?.orgs || 0), 
      change: `${Object.values(stats?.orgDistribution || {}).filter((_, i) => i === 0)[0] || 0} active`, 
      changeType: "positive" as const, 
      icon: Building2,
      trend: "stable"
    },
    { 
      title: "Properties", 
      value: String(stats?.properties || 0), 
      change: "Managed globally", 
      changeType: "positive" as const, 
      icon: Home,
      trend: "up"
    },
    { 
      title: "Occupancy Rate", 
      value: `${stats?.occupancyRate || 0}%`, 
      change: `${stats?.occupiedUnits || 0}/${stats?.totalUnits || 0} units`, 
      changeType: (stats?.occupancyRate || 0) > 80 ? "positive" as "positive" : "neutral" as "neutral", 
      icon: Home,
      trend: (stats?.occupancyRate || 0) > 80 ? "up" : "stable"
    },
    { 
      title: "Total Revenue", 
      value: `$${(stats?.totalPayments || 0).toLocaleString()}`, 
      change: "All payments", 
      changeType: "positive" as const, 
      icon: CurrencyIcon,
      trend: "up"
    },
    { 
      title: "Open Tickets", 
      value: String(stats?.ticketsByStatus?.open || 0), 
      change: `${stats?.ticketsByStatus?.resolved || 0} resolved`, 
      changeType: (stats?.ticketsByStatus?.open || 0) > 10 ? "negative" as "negative" : "neutral" as "neutral", 
      icon: Wrench,
      trend: (stats?.ticketsByStatus?.open || 0) > 10 ? "down" : "stable"
    },
  ];

  const ticketChartData = Object.entries(stats?.ticketsByStatus || {}).map(([name, value]) => ({ name, value }));
  const priorityChartData = Object.entries(stats?.ticketsByPriority || {}).map(([name, value]) => ({ name, value }));
  const invoiceChartData = Object.entries(stats?.invoicesByStatus || {}).map(([name, value]) => ({ name, value }));
  const orgChartData = Object.entries(stats?.orgDistribution || {}).map(([name, value]) => ({ name, value }));
  const propertyChartData = Object.entries(stats?.propertyPerformance || {}).map(([name, value]) => ({ name, value }));

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Platform Analytics
            </h1>
            <p className="text-muted-foreground mt-2">Comprehensive platform performance insights and trends</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Activity className="w-3 h-3" />
              Live Data
            </Badge>
            <Badge variant="secondary">{new Date().toLocaleDateString()}</Badge>
          </div>
        </div>

        {/* Enhanced Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={m.title} {...m} index={i} />
          ))}
        </div>

        {/* Interactive Charts Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Analytics</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">User Growth Trend</h3>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={stats?.monthlyData || []}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        background: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))", 
                        borderRadius: 8 
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke={CHART_COLORS.primary}
                      fill={CHART_COLORS.primary}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Organization Distribution */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Organization Status</h3>
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                {orgChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie 
                        data={orgChartData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={90} 
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {orgChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No organization data</div>
                )}
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly User Signups */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Monthly User Signups</h3>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats?.monthlyData || []}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="users" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* User Activity */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">User Activity</h3>
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats?.activityData || []}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Line 
                      type="monotone" 
                      dataKey="activity" 
                      stroke={CHART_COLORS.secondary} 
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.secondary, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Revenue Trend</h3>
                  <CurrencyIcon className="w-5 h-5 text-green-500" />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={stats?.revenueData || []}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={CHART_COLORS.success}
                      fill={CHART_COLORS.success}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Invoice Status */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Invoice Status</h3>
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                {invoiceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie 
                        data={invoiceChartData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={90} 
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {invoiceChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No invoice data</div>
                )}
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Maintenance Tickets */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Maintenance Tickets by Status</h3>
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                {ticketChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie 
                        data={ticketChartData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={90} 
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {ticketChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No ticket data</div>
                )}
              </motion.div>

              {/* Ticket Priority */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Tickets by Priority</h3>
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                {priorityChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={priorityChartData}>
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Bar dataKey="value" fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No priority data</div>
                )}
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recent Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Platform Activity</h3>
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              Live Feed
            </Badge>
          </div>
          <div className="space-y-3">
            {stats?.recentActivities?.map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {activity.action?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{activity.action || "Unknown Action"}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.entity_type || "System"} • {activity.created_at ? new Date(activity.created_at).toLocaleString() : "Unknown time"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {activity.entity_type || "System"}
                </Badge>
              </div>
            )) || (
              <div className="text-center text-muted-foreground py-8">No recent activity</div>
            )}
          </div>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAnalytics;
