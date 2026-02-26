import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { Building2, Users, TrendingUp, Wrench, CreditCard } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";
import { useUnits } from "@/hooks/useUnits";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { useMaintenanceTickets } from "@/hooks/useMaintenanceTickets";

const ManagerDashboard = () => {
  const { properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();
  const { units = [] } = useUnits();
  const { data: tickets = [] } = useMaintenanceTickets();

  const activeTenants = tenants.filter(t => t.status === "active").length;
  const occupiedUnits = units.filter(u => u.availability === "occupied").length;
  const occupancyRate = units.length > 0 ? ((occupiedUnits / units.length) * 100).toFixed(1) : "0";
  const openTickets = tickets.filter(t => t.status === "open").length;
  const totalRent = units.reduce((sum, u) => sum + (u.rent || 0), 0);

  const managerMetrics = [
    { title: "Properties Managed", value: String(properties.length), change: "Active", changeType: "positive" as const, icon: Building2 },
    { title: "Active Tenants", value: String(activeTenants), change: `of ${tenants.length}`, changeType: "positive" as const, icon: Users },
    { title: "Total Units", value: String(units.length), change: `${occupiedUnits} occupied`, changeType: "positive" as const, icon: CurrencyIcon },
    { title: "Occupancy Rate", value: `${occupancyRate}%`, change: "Current", changeType: "positive" as const, icon: TrendingUp },
    { title: "Open Tickets", value: String(openTickets), change: "Pending", changeType: openTickets > 5 ? "negative" as const : "positive" as const, icon: Wrench },
    { title: "Monthly Rent", value: `₹${totalRent.toLocaleString()}`, change: "Expected", changeType: "positive" as const, icon: CreditCard },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Manager. Here's your property overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {managerMetrics.map((metric, i) => (
            <MetricCard key={metric.title} {...metric} index={i} />
          ))}
        </div>

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

export default ManagerDashboard;
