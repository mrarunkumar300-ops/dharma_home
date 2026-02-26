import { motion } from "framer-motion";
import { Building2, UserPlus, CreditCard, Wrench, ArrowUpRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export function ActivityFeed() {
  const { formatAmount } = useCurrency();
  
  const activities = [
    { icon: UserPlus, label: "New tenant Sarah Johnson signed lease", time: "2 min ago", color: "text-success" },
    { icon: CreditCard, label: `Payment of ${formatAmount(1200)} received from Unit 4B`, time: "15 min ago", color: "text-primary" },
    { icon: Wrench, label: "Maintenance ticket #1042 resolved", time: "1 hour ago", color: "text-warning" },
    { icon: Building2, label: "Property 'Riverside Apts' listed", time: "3 hours ago", color: "text-accent" },
    { icon: CreditCard, label: "Invoice #INV-2024-089 generated", time: "5 hours ago", color: "text-primary" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
          View all <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.08 }}
            className="flex items-start gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-muted transition-colors">
              <activity.icon className={`w-4 h-4 ${activity.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">{activity.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
