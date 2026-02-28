import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useCurrency } from "@/hooks/useCurrency";

const revenueData = [
  { month: "Jan", revenue: 42000, expenses: 28000 },
  { month: "Feb", revenue: 45000, expenses: 27000 },
  { month: "Mar", revenue: 48000, expenses: 30000 },
  { month: "Apr", revenue: 51000, expenses: 29000 },
  { month: "May", revenue: 53000, expenses: 31000 },
  { month: "Jun", revenue: 58000, expenses: 32000 },
  { month: "Jul", revenue: 62000, expenses: 33000 },
];

export function RevenueChart() {
  const { currency, formatAmount, getCurrencySymbol } = useCurrency();
  const symbol = getCurrencySymbol();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Revenue Overview</h3>
          <p className="text-sm text-muted-foreground">Monthly revenue & expenses</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">Expenses</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={revenueData}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(263, 58%, 59%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(263, 58%, 59%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 20%)" />
          <XAxis dataKey="month" stroke="hsl(215, 20%, 65%)" fontSize={12} />
          <YAxis 
            stroke="hsl(215, 20%, 65%)" 
            fontSize={12} 
            tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(0)}k`} 
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(221, 39%, 11%)",
              border: "1px solid hsl(217, 33%, 20%)",
              borderRadius: "12px",
              fontSize: "13px",
            }}
            formatter={(value: number) => [formatAmount(value, 'INR'), ""]}
          />
          <Area type="monotone" dataKey="revenue" stroke="hsl(263, 58%, 59%)" fill="url(#revenueGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="expenses" stroke="hsl(271, 81%, 56%)" fill="url(#expenseGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
