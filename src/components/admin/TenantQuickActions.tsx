import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Home, 
  CreditCard, 
  Zap, 
  FileText, 
  DollarSign, 
  UserPlus,
  QrCode,
  Plus,
  Eye,
  Settings,
  AlertTriangle,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  route: string;
  badge?: string;
  requiresConfirmation?: boolean;
}

export function TenantQuickActions() {
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: "add-tenant",
      title: "Add New Tenant",
      description: "Create a new tenant with user account",
      icon: UserPlus,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      route: "/admin/tenants",
      badge: "Quick"
    },
    {
      id: "view-tenants",
      title: "View All Tenants",
      description: "See all tenant records and status",
      icon: Users,
      color: "text-green-600 bg-green-50 border-green-200",
      route: "/admin/tenant-data",
      badge: "List"
    },
    {
      id: "payment-verification",
      title: "Payment Verification",
      description: "Review and verify QR code payments",
      icon: QrCode,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      route: "/admin/payment-verification",
      badge: "Pending"
    },
    {
      id: "generate-bills",
      title: "Generate Bills",
      description: "Create monthly bills for all tenants",
      icon: FileText,
      color: "text-orange-600 bg-orange-50 border-orange-200",
      route: "/admin/billing",
      requiresConfirmation: true
    },
    {
      id: "meter-readings",
      title: "Meter Readings",
      description: "Record utility meter readings",
      icon: Zap,
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
      route: "/admin/tenant-data"
    },
    {
      id: "payment-tracking",
      title: "Payment Tracking",
      description: "Monitor payment status and history",
      icon: DollarSign,
      color: "text-pink-600 bg-pink-50 border-pink-200",
      route: "/admin/payments"
    }
  ];

  const stats = [
    {
      title: "Total Tenants",
      value: "156",
      change: "+12%",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Pending Payments",
      value: "23",
      change: "-5%",
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Active Units",
      value: "142",
      change: "+8%",
      icon: Home,
      color: "text-green-600"
    },
    {
      title: "Monthly Revenue",
      value: "₹2.4L",
      change: "+15%",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ];

  const handleActionClick = (action: QuickAction) => {
    if (action.requiresConfirmation) {
      setSelectedAction(action);
      setShowDialog(true);
    } else {
      // Navigate to route (in real app, use router)
      console.log(`Navigate to: ${action.route}`);
    }
  };

  const confirmAction = () => {
    if (selectedAction) {
      console.log(`Execute: ${selectedAction.title}`);
      setShowDialog(false);
      setSelectedAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className="flex items-center gap-1 text-sm">
                      <span className={stat.color}>{stat.change}</span>
                      <TrendingUp className="w-3 h-3" />
                    </div>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used tenant management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="outline"
                  className="h-auto p-4 flex-col items-start space-y-2 hover:shadow-md transition-shadow"
                  onClick={() => handleActionClick(action)}
                >
                  <div className="flex items-center justify-between w-full">
                    <action.icon className="w-6 h-6" />
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest tenant management actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: "New tenant added",
                tenant: "John Doe",
                time: "2 hours ago",
                icon: UserPlus,
                color: "text-blue-600"
              },
              {
                action: "Payment verified",
                tenant: "Jane Smith",
                time: "3 hours ago",
                icon: QrCode,
                color: "text-green-600"
              },
              {
                action: "Bill generated",
                tenant: "Mike Johnson",
                time: "5 hours ago",
                icon: FileText,
                color: "text-orange-600"
              },
              {
                action: "Meter reading recorded",
                tenant: "Sarah Williams",
                time: "1 day ago",
                icon: Zap,
                color: "text-yellow-600"
              }
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.tenant}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Confirm Action
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {selectedAction?.title.toLowerCase()}? This action may affect multiple tenant records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAction && (
              <div className="bg-muted p-4 rounded">
                <div className="flex items-center gap-3">
                  <selectedAction.icon className="w-6 h-6" />
                  <div>
                    <p className="font-medium">{selectedAction.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedAction.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAction}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
