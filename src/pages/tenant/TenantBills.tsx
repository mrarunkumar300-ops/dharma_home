import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTenantProfile } from "@/hooks/useTenantProfile";
import { motion } from "framer-motion";
import { CreditCard, AlertCircle, CheckCircle, Clock, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const TenantBills = () => {
  const { data: dashboardData, isLoading } = useTenantProfile();
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const bills = dashboardData?.bills || [];

  const handlePayNow = (bill: any) => {
    // Navigate to enhanced payments page with bill details
    navigate('/tenant/payments-enhanced', { 
      state: { 
        selectedBills: [bill.id],
        totalAmount: bill.amount 
      } 
    });
  };

  const totalDue = bills.filter(b => b.status === "pending" || b.status === "overdue").reduce((sum, b) => sum + Number(b.amount), 0);
  const overdue = bills.filter(b => b.status === "overdue").length;
  const paid = bills.filter(b => b.status === "paid").length;
  const pending = bills.filter(b => b.status === "pending").length;

  const statusConfig: Record<string, { icon: any; color: string }> = {
    paid: { icon: CheckCircle, color: "text-green-600 bg-green-500/10 border-green-500/20" },
    pending: { icon: Clock, color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20" },
    overdue: { icon: AlertCircle, color: "text-destructive bg-destructive/10 border-destructive/20" },
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Bills</h1>
          <p className="text-muted-foreground mt-1">View and manage your bills</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Due", value: formatAmount(totalDue), icon: CurrencyIcon, color: "text-primary" },
            { label: "Pending Bills", value: pending, icon: Clock, color: "text-yellow-600" },
            { label: "Overdue", value: overdue, icon: AlertCircle, color: "text-destructive" },
            { label: "Paid", value: paid, icon: CheckCircle, color: "text-green-600" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bills Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> All Bills</CardTitle>
              <CardDescription>Your bills and their payment status</CardDescription>
            </CardHeader>
            <CardContent>
              {bills.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No bills found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill Type</TableHead>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => {
                      const config = statusConfig[bill.status] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      return (
                        <TableRow key={bill.id}>
                          <TableCell className="font-medium">{bill.bill_type}</TableCell>
                          <TableCell className="text-muted-foreground">{bill.bill_number || "—"}</TableCell>
                          <TableCell className="font-semibold">{formatAmount(Number(bill.amount))}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {format(new Date(bill.bill_period_start), "MMM dd")} - {format(new Date(bill.bill_period_end), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(bill.due_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${config.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {bill.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {bill.status !== "paid" && (
                              <Button 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handlePayNow(bill)}
                              >
                                <CreditCard className="w-3.5 h-3.5" /> Pay Now
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default TenantBills;
