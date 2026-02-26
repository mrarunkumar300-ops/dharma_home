import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Home, 
  CreditCard, 
  Zap, 
  FileText, 
  DollarSign, 
  UserPlus,
  QrCode,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  BookOpen,
  Shield,
  Database
} from "lucide-react";
import { motion } from "framer-motion";

export default function TenantManagementGuide() {
  const [activeTab, setActiveTab] = useState("overview");

  const features = [
    {
      title: "Family Details Management",
      description: "Add and manage family members for emergency contacts",
      icon: Users,
      status: "implemented",
      route: "/tenant/family",
      color: "text-blue-600 bg-blue-50 border-blue-200"
    },
    {
      title: "Monthly Readings",
      description: "Track electricity/water meter readings and calculate bills",
      icon: Zap,
      status: "implemented",
      route: "/admin/tenant-data",
      color: "text-yellow-600 bg-yellow-50 border-yellow-200"
    },
    {
      title: "Rent Management",
      description: "Set rent amounts and track lease agreements",
      icon: Home,
      status: "implemented",
      route: "/admin/tenants",
      color: "text-green-600 bg-green-50 border-green-200"
    },
    {
      title: "Bills Generation",
      description: "Create and manage various types of bills",
      icon: FileText,
      status: "implemented",
      route: "/admin/billing",
      color: "text-purple-600 bg-purple-50 border-purple-200"
    },
    {
      title: "Payments Tracking",
      description: "Monitor and record all payment transactions",
      icon: DollarSign,
      status: "implemented",
      route: "/admin/payments",
      color: "text-orange-600 bg-orange-50 border-orange-200"
    },
    {
      title: "QR Code Payments",
      description: "Accept payments via QR code with manual verification",
      icon: QrCode,
      status: "implemented",
      route: "/admin/payment-verification",
      color: "text-indigo-600 bg-indigo-50 border-indigo-200"
    },
    {
      title: "User Account Creation",
      description: "Create tenant accounts with role-based access",
      icon: UserPlus,
      status: "implemented",
      route: "/admin/tenants",
      color: "text-pink-600 bg-pink-50 border-pink-200"
    }
  ];

  const workflows = [
    {
      title: "Create New Tenant",
      steps: [
        "Go to /admin/tenants",
        "Click 'Add Tenant'",
        "Fill tenant details (name, email, phone)",
        "Check 'Create User Account'",
        "Set password for tenant login",
        "Select property and unit",
        "Set rent amount and lease dates",
        "Save to create tenant + user account"
      ],
      icon: UserPlus
    },
    {
      title: "Add Family Members",
      steps: [
        "Tenant logs in to their portal",
        "Go to /tenant/family",
        "Click 'Add Member'",
        "Fill: Full Name, Relationship, Age, Gender, Phone",
        "Save to add family member",
        "Admin can also add via /admin/tenant-data"
      ],
      icon: Users
    },
    {
      title: "Monthly Operations",
      steps: [
        "Record meter readings (Electricity tab)",
        "Generate rent bills (automatic on 1st)",
        "Create electricity bills (after readings)",
        "Track payments via /admin/payment-verification",
        "Update tenant status based on payments"
      ],
      icon: Clock
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "implemented":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "partial":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "missing":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Management Guide</h1>
          <p className="text-muted-foreground">
            Complete guide to managing tenants, family details, payments, and user accounts
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Features Implemented</p>
                  <p className="text-2xl font-bold text-green-600">
                    {features.filter(f => f.status === "implemented").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Features</p>
                  <p className="text-2xl font-bold">{features.length}</p>
                </div>
                <Database className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Workflows</p>
                  <p className="text-2xl font-bold">{workflows.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Security Level</p>
                  <p className="text-2xl font-bold text-green-600">High</p>
                </div>
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>
                  Complete tenant management system with family details, payments, and user accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Tenant Management
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Create tenant profiles with user accounts</li>
                      <li>• Assign properties and units</li>
                      <li>• Set rent amounts and lease terms</li>
                      <li>• Track tenant status and history</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Family & Details
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Add family members for emergency contacts</li>
                      <li>• Track relationships and contact info</li>
                      <li>• Manage documents and verification</li>
                      <li>• Update personal information</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Payments & Billing
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Generate monthly rent bills</li>
                      <li>• Track electricity/water readings</li>
                      <li>• Accept QR code payments</li>
                      <li>• Manual payment recording</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Security & Access
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Role-based access control</li>
                      <li>• Row-level security (RLS)</li>
                      <li>• Audit trail for all changes</li>
                      <li>• Secure user authentication</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <feature.icon className="w-5 h-5" />
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                        </div>
                        {getStatusIcon(feature.status)}
                      </div>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge className={feature.color}>
                          {feature.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {workflows.map((workflow, index) => (
                <motion.div
                  key={workflow.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <workflow.icon className="w-5 h-5" />
                        {workflow.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2">
                        {workflow.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start gap-2 text-sm">
                            <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                              {stepIndex + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Permissions
                </CardTitle>
                <CardDescription>
                  Role-based access control and data security measures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Role-Based Access Control</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>
                        <span className="text-sm">Full access across all organizations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
                        <span className="text-sm">Full access within organization</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Manager</Badge>
                        <span className="text-sm">View and limited edit access</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-800">Staff</Badge>
                        <span className="text-sm">Read-only access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-800">User</Badge>
                        <span className="text-sm">No tenant access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-pink-100 text-pink-800">Tenant</Badge>
                        <span className="text-sm">Access to own data only</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Data Security Measures</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Row-Level Security (RLS) for data isolation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Secure user authentication via Supabase Auth</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Role validation for all operations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Complete audit trail for all changes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>QR code payment verification system</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Best Practices</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">For Admins</h5>
                      <ul className="space-y-1 text-xs">
                        <li>• Always create user accounts for tenants</li>
                        <li>• Regular meter readings for accurate billing</li>
                        <li>• Timely bill generation</li>
                        <li>• Verify family member details</li>
                        <li>• Monitor payment status</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-2">For Tenants</h5>
                      <ul className="space-y-1 text-xs">
                        <li>• Keep profile updated</li>
                        <li>• Add family members for emergencies</li>
                        <li>• Pay bills on time</li>
                        <li>• Check meter readings</li>
                        <li>• Upload required documents</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
