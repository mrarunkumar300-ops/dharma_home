import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar, Download, TrendingUp, Users, Building2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useProperties } from "@/hooks/useProperties";
import { useUnits } from "@/hooks/useUnits";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { useTenants } from "@/hooks/useTenants";
import { useCurrency } from "@/hooks/useCurrency";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyIcon } from "@/components/CurrencyIcon";

const Analytics = () => {
    const { formatAmount } = useCurrency();
    const { properties, isLoading: propsLoading } = useProperties();
    const { units, isLoading: unitsLoading } = useUnits("all");
    const { data: invoices = [], isLoading: invLoading } = useInvoices();
    const { data: payments = [], isLoading: payLoading } = usePayments();
    const { data: expenses = [], isLoading: expLoading } = useExpenses();
    const { data: tenants = [], isLoading: tenLoading } = useTenants();

    const isLoading = propsLoading || unitsLoading || invLoading || payLoading || expLoading || tenLoading;

    // Compute revenue data by month from invoices/payments
    const revenueData = useMemo(() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        const last6 = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            return { month: months[d.getMonth()], year: d.getFullYear(), m: d.getMonth() };
        });

        return last6.map(({ month, year, m }) => {
            const monthPayments = payments.filter(p => {
                const d = new Date(p.payment_date);
                return d.getMonth() === m && d.getFullYear() === year;
            });
            const monthExpenses = expenses.filter(e => {
                const d = new Date(e.expense_date);
                return d.getMonth() === m && d.getFullYear() === year;
            });
            return {
                month,
                revenue: monthPayments.reduce((s, p) => s + Number(p.amount), 0),
                expenses: monthExpenses.reduce((s, e) => s + Number(e.amount), 0),
            };
        });
    }, [payments, expenses]);

    // Occupancy data from units
    const occupancyData = useMemo(() => {
        const total = units?.length || 1;
        const occupied = units?.filter(u => u.availability === "occupied").length || 0;
        const maintenance = units?.filter(u => u.availability === "maintenance").length || 0;
        const vacant = total - occupied - maintenance;
        return [
            { name: "Occupied", value: Math.round((occupied / total) * 100), color: "hsl(var(--primary))" },
            { name: "Vacant", value: Math.round((vacant / total) * 100), color: "hsl(var(--muted))" },
            { name: "Maintenance", value: Math.round((maintenance / total) * 100), color: "hsl(var(--warning))" },
        ];
    }, [units]);

    const avgOccupancy = occupancyData[0]?.value || 0;

    // Property performance from units
    const propertyPerformance = useMemo(() => {
        return (properties || []).slice(0, 6).map(prop => {
            const propUnits = units?.filter(u => u.property_id === prop.id) || [];
            const occupied = propUnits.filter(u => u.availability === "occupied");
            return {
                name: prop.name.length > 15 ? prop.name.slice(0, 15) + "…" : prop.name,
                revenue: occupied.reduce((s, u) => s + (u.rent || 0), 0),
                occupancy: propUnits.length > 0 ? Math.round((occupied.length / propUnits.length) * 100) : 0,
            };
        });
    }, [properties, units]);

    // Top metrics
    const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalUnits = units?.length || 0;
    const activeTenants = tenants.filter(t => t.status === "active").length;

    const metrics = [
        { label: "Net Revenue", value: formatAmount(totalRevenue), change: `${payments.length} payments`, icon: CurrencyIcon },
        { label: "Avg Occupancy", value: `${avgOccupancy}%`, change: `${units?.filter(u => u.availability === "occupied").length || 0}/${totalUnits} units`, icon: Users },
        { label: "Active Tenants", value: activeTenants.toString(), change: `${tenants.length} total`, icon: TrendingUp },
        { label: "Properties", value: (properties?.length || 0).toString(), change: `${totalUnits} units`, icon: Building2 },
    ];

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                    </div>
                    <Skeleton className="h-[400px] rounded-xl" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Portfolio Analytics</h1>
                        <p className="text-muted-foreground mt-1">Deep dive into your revenue, occupancy, and growth trends.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Calendar className="w-4 h-4 mr-2" />
                            Last 6 Months
                        </Button>
                        <Button className="glow-primary">
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                        </Button>
                    </div>
                </div>

                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metrics.map((metric, i) => (
                        <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-5"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">{metric.label}</p>
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <metric.icon className="w-4 h-4 text-primary" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <h3 className="text-2xl font-bold">{metric.value}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{metric.change}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold">Revenue vs Expenses</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                    <span className="text-xs text-muted-foreground">Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                                    <span className="text-xs text-muted-foreground">Expenses</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(value) => `${formatAmount(value).slice(0, -3)}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                                    <Area type="monotone" dataKey="expenses" stroke="hsl(var(--muted-foreground)/0.5)" strokeWidth={2} fill="transparent" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="font-semibold mb-6">Occupancy Status</h3>
                        <div className="h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={occupancyData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {occupancyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold">{avgOccupancy}%</span>
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Occupied</span>
                            </div>
                        </div>
                        <div className="space-y-3 mt-4">
                            {occupancyData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm text-muted-foreground">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Property Comparison */}
                <div className="glass-card p-6">
                    <h3 className="font-semibold mb-6">Property Performance Comparison</h3>
                    {propertyPerformance.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No properties to display</div>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={propertyPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(value) => `${formatAmount(value).slice(0, -3)}k`} />
                                    <Tooltip cursor={{ fill: "hsl(var(--muted)/0.1)" }} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Analytics;
