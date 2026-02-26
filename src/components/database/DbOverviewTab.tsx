import { useDatabaseHealth } from "@/hooks/useDatabaseManagement";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Server, HardDrive, Activity, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(45 93% 47%)", "hsl(142 76% 36%)", "hsl(var(--muted-foreground))"];

export const DbOverviewTab = () => {
  const { data: health, isLoading } = useDatabaseHealth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const tableCounts = health?.tableCounts || {};
  const tableSizes = Object.entries(tableCounts).map(([name, count]) => ({
    name,
    records: count as number,
    percentage: health?.totalRecords ? ((count as number) / health.totalRecords) * 100 : 0,
  }));

  const topTables = [...tableSizes].sort((a, b) => b.records - a.records);
  const largestTable = topTables[0];

  const metrics = [
    { title: "Total Records", value: (health?.totalRecords || 0).toLocaleString(), change: `~${health?.estimatedSizeMB || 0} MB`, changeType: "positive" as const, icon: Database },
    { title: "Tables", value: String(health?.totalTables || 0), change: "Active schema", changeType: "positive" as const, icon: Server },
    { title: "Largest Table", value: largestTable?.name || "—", change: `${(largestTable?.records || 0).toLocaleString()} rows`, changeType: "neutral" as const, icon: HardDrive },
    { title: "Status", value: health?.status === "healthy" ? "Healthy" : "Issue", change: new Date(health?.timestamp || "").toLocaleTimeString(), changeType: health?.status === "healthy" ? "positive" as const : "negative" as const, icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.title} {...m} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Table Distribution</CardTitle>
              <BarChart3 className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={topTables.slice(0, 8)}
                    dataKey="records"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  >
                    {topTables.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Record Counts</CardTitle>
              <Database className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topTables.slice(0, 10)}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-45} textAnchor="end" height={70} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="records" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Table List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topTables.map((t) => (
              <div key={t.name} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm">{t.name}</span>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{t.records.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
