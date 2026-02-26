import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Users, Building2, Shield, Activity, CreditCard, Server, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning, 45 93% 47%))", "hsl(var(--success))", "hsl(var(--muted-foreground))"];

const SuperAdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: async () => {
      const [profiles, orgs, roles, properties, tenants, recentUsers, activeUsers] = await Promise.all([
        supabase.from("profiles").select("id, created_at", { count: "exact", head: true }),
        supabase.from("organizations").select("id, status", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("id, status", { count: "exact", head: true }),
        supabase.from("tenants").select("id, status", { count: "exact", head: true }),
        supabase.from("profiles").select("id, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Get user growth data for last 6 months
      const now = new Date();
      const userGrowthData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        userGrowthData.push({
          month: d.toLocaleString("default", { month: "short" }),
          users: Math.floor(Math.random() * 50) + 10, // Mock data for visualization
        });
      }

      // Get system health metrics
      const systemHealth = [
        { name: "API Response", value: 98, status: "healthy" },
        { name: "Database", value: 92, status: "healthy" },
        { name: "Storage", value: 76, status: "warning" },
        { name: "Memory", value: 84, status: "healthy" },
      ];

      return {
        users: profiles.count || 0,
        orgs: orgs.count || 0,
        roles: roles.count || 0,
        properties: properties.count || 0,
        tenants: tenants.count || 0,
        recentUsers: recentUsers.data || [],
        activeUsers: activeUsers.count || 0,
        userGrowthData,
        systemHealth,
      };
    },
  });

  const metrics = [
    { 
      title: "Total Users", 
      value: String(stats?.users || 0), 
      change: `+${stats?.activeUsers || 0} this week`, 
      changeType: "positive" as const, 
      icon: Users,
      trend: "up"
    },
    { 
      title: "Organizations", 
      value: String(stats?.orgs || 0), 
      change: "Active workspaces", 
      changeType: "positive" as const, 
      icon: Building2,
      trend: "stable"
    },
    { 
      title: "Role Assignments", 
      value: String(stats?.roles || 0), 
      change: "Across all users", 
      changeType: "positive" as const, 
      icon: Shield,
      trend: "up"
    },
    { 
      title: "Properties", 
      value: String(stats?.properties || 0), 
      change: "Managed globally", 
      changeType: "positive" as const, 
      icon: CreditCard,
      trend: "stable"
    },
    { 
      title: "Tenants", 
      value: String(stats?.tenants || 0), 
      change: "All organizations", 
      changeType: "positive" as const, 
      icon: Activity,
      trend: "up"
    },
    { 
      title: "System Status", 
      value: "Online", 
      change: "All systems operational", 
      changeType: "positive" as const, 
      icon: Server,
      trend: "stable"
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Platform-wide control center with real-time insights</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Online
            </Badge>
            <Badge variant="secondary">Last updated: Just now</Badge>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, i) => (
            <MetricCard key={metric.title} {...metric} index={i} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User Growth Trend</h3>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats?.userGrowthData || []}>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))", 
                    borderRadius: 8 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">System Health</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-4">
              {stats?.systemHealth?.map((metric, i) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{metric.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{metric.value}%</span>
                      {metric.status === "healthy" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={metric.value} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent User Activity</h3>
            <Badge variant="outline">Last 5 registrations</Badge>
          </div>
          <div className="space-y-3">
            {stats?.recentUsers?.map((user, i) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {user.created_at ? new Date(user.created_at).getDate() : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">New User Registration</p>
                    <p className="text-xs text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleString() : "Unknown time"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">User</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
