import { useState } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  Activity, Search, Filter, Download, RefreshCw, Eye, AlertTriangle, CheckCircle, 
  Clock, Users, Building2, Database, Shield, Settings, FileText, TrendingUp 
} from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning, 45 93% 47%))", "hsl(var(--success))", "hsl(var(--muted-foreground))"];

const SuperAdminActivityLogs = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateRange, setDateRange] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["super-admin-activity-logs", actionFilter, entityFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      // Apply filters
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }
      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }
      
      // Apply date range
      const now = new Date();
      let fromDate: Date | null = null;
      
      switch (dateRange) {
        case "1h":
          fromDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case "24h":
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (fromDate) {
        query = query.gte("created_at", fromDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
  });

  const { data: analytics = { hourlyData: [], actionData: [], entityData: [], total24h: 0 } } = useQuery({
    queryKey: ["super-admin-activity-analytics"],
    queryFn: async () => {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const { data: recentLogs } = await supabase
        .from("activity_log")
        .select("action, entity_type, created_at")
        .gte("created_at", last24h.toISOString());

      // Activity by hour
      const hourlyData = [];
      for (let i = 23; i >= 0; i--) {
        const hour = new Date();
        hour.setHours(hour.getHours() - i);
        hour.setMinutes(0, 0, 0);
        const nextHour = new Date(hour);
        nextHour.setHours(nextHour.getHours() + 1);
        
        const count = recentLogs?.filter(log => {
          const logTime = new Date(log.created_at);
          return logTime >= hour && logTime < nextHour;
        }).length || 0;
        
        hourlyData.push({
          hour: hour.getHours() === 0 ? '12AM' : hour.getHours() > 12 ? `${hour.getHours() - 12}PM` : `${hour.getHours()}AM`,
          count
        });
      }

      // Activity by type
      const actionCounts = recentLogs?.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const actionData = Object.entries(actionCounts).map(([name, value]) => ({ name, value }));

      // Activity by entity
      const entityCounts = recentLogs?.reduce((acc, log) => {
        acc[log.entity_type] = (acc[log.entity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const entityData = Object.entries(entityCounts).map(([name, value]) => ({ name, value }));

      return {
        hourlyData,
        actionData,
        entityData,
        total24h: recentLogs?.length || 0
      };
    },
    refetchInterval: autoRefresh ? 10000 : false // Refresh analytics every 10 seconds
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !search || 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'update': return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'delete': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'login': return <Users className="w-4 h-4 text-purple-500" />;
      case 'logout': return <Users className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-success/10 text-success border-success/20';
      case 'update': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'delete': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'login': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'logout': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'user': return <Users className="w-4 h-4" />;
      case 'organization': return <Building2 className="w-4 h-4" />;
      case 'property': return <Database className="w-4 h-4" />;
      case 'role': return <Shield className="w-4 h-4" />;
      case 'settings': return <Settings className="w-4 h-4" />;
      case 'invoice': return <FileText className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Action', 'Entity Type', 'Entity ID', 'User ID', 'Timestamp', 'Details'].join(','),
      ...filteredLogs.map(log => [
        log.action,
        log.entity_type,
        log.entity_id || '',
        log.user_id || '',
        new Date(log.created_at).toISOString(),
        JSON.stringify(log.details || '')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Activity logs exported successfully');
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Activity Logs
            </h1>
            <p className="text-muted-foreground mt-2">Real-time system activity monitoring and audit trail</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)} className="gap-2">
              {autoRefresh ? <Clock className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
              {autoRefresh ? 'Auto-refresh' : 'Manual'}
            </Button>
            <Button variant="outline" onClick={exportLogs} className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last 24h</p>
                  <p className="text-2xl font-bold">{analytics.total24h}</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Logs</p>
                  <p className="text-2xl font-bold">{logs.length}</p>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Actions</p>
                  <p className="text-2xl font-bold">{analytics.actionData.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entities</p>
                  <p className="text-2xl font-bold">{analytics.entityData.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hourly Activity */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Hourly Activity (Last 24h)</h3>
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.hourlyData}>
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Action Distribution */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Actions</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={analytics.actionData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {analytics.actionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search logs..." 
              className="pl-10" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["super-admin-activity-logs"] })} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading activity logs...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="space-y-3">
                      <Activity className="w-12 h-12 mx-auto opacity-30" />
                      <div>
                        <p className="font-medium">No activity logs found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your filters or time range</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-border/30 hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEntityIcon(log.entity_type)}
                        <div className="text-sm">
                          <div className="font-medium capitalize">{log.entity_type}</div>
                          {log.entity_id && (
                            <div className="text-xs text-muted-foreground">
                              ID: {log.entity_id.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {log.user_id ? `ID: ${log.user_id.slice(0, 8)}...` : 'System'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.details ? (
                          <div className="max-w-xs truncate" title={JSON.stringify(log.details)}>
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        <div>{new Date(log.created_at).toLocaleDateString()}</div>
                        <div className="text-xs">{new Date(log.created_at).toLocaleTimeString()}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminActivityLogs;
