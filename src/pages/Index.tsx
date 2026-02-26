import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { Building2, Users, TrendingUp } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyIcon } from "@/components/CurrencyIcon";

const Dashboard = () => {
  const { formatAmount } = useCurrency();
  
  const metrics = [
    { title: "Total Revenue", value: formatAmount(128400), change: "+12.5%", changeType: "positive" as const, icon: CurrencyIcon },
    { title: "Properties", value: "24", change: "+3", changeType: "positive" as const, icon: Building2 },
    { title: "Active Tenants", value: "186", change: "+8", changeType: "positive" as const, icon: Users },
    { title: "Occupancy Rate", value: "94.2%", change: "+2.1%", changeType: "positive" as const, icon: TrendingUp },
  ];
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's your portfolio overview.</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, i) => (
            <MetricCard key={metric.title} {...metric} index={i} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <OccupancyChart />
        </div>

        {/* Activity */}
        <ActivityFeed />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
