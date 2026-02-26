import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Users,
  Home,
  FileText,
  Zap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  QrCode,
  UserPlus,
  CreditCard,
  DollarSign,
  Building2,
  Wrench,
  Settings,
  Book
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import { ROUTES } from "@/routes";
import { TenantManagementWizard } from "@/components/tenant/TenantManagementWizard";
import { TenantQuickActions } from "@/components/admin/TenantQuickActions";

interface UnifiedTenantManagementProps {
  mode?: "listing" | "detail" | "wizard";
}

export default function TenantManagementUnified({ mode = "listing" }: UnifiedTenantManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const { tenantId } = useParams();
  const navigate = useNavigate();

  // Mock data for demonstration
  const [tenants, setTenants] = useState([
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+91 9876543210",
      status: "active",
      property: "Sunshine Apartments",
      unit: "A-101",
      rent_amount: 15000,
      lease_start: "2024-01-01",
      lease_end: "2024-12-31",
      created_at: "2024-01-01T00:00:00Z",
      family_members: 3,
      total_paid: 45000,
      pending_bills: 2,
      overdue_bills: 1
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+91 9876543211",
      status: "active",
      property: "Green Valley Residency",
      unit: "B-205",
      rent_amount: 12000,
      lease_start: "2024-02-01",
      lease_end: "2025-01-31",
      created_at: "2024-02-01T00:00:00Z",
      family_members: 2,
      total_paid: 24000,
      pending_bills: 1,
      overdue_bills: 0
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      phone: "+91 9876543212",
      status: "inactive",
      property: "Blue Sky Complex",
      unit: "C-303",
      rent_amount: 18000,
      lease_start: "2023-06-01",
      lease_end: "2024-05-31",
      created_at: "2023-06-01T00:00:00Z",
      family_members: 1,
      total_paid: 54000,
      pending_bills: 0,
      overdue_bills: 0
    }
  ]);

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone.includes(searchTerm)
  );

  const handleTenantClick = (tenant) => {
    setSelectedTenant(tenant);
    navigate(`/admin/tenant-management/${tenant.id}`);
  };

  const handleBack = () => {
    setSelectedTenant(null);
    navigate("/admin/tenant-management");
  };

  const handleAddTenant = () => {
    setShowWizard(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Detail View Component
  const TenantDetailView = ({ tenant }: { tenant: any }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{tenant.name}</h2>
          <p className="text-muted-foreground">{tenant.email}</p>
          <p className="text-sm text-muted-foreground">{tenant.phone}</p>
        </div>
        <Button variant="outline" onClick={handleBack}>
          Back to List
        </Button>
      </div>

      {/* Tenant Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Property</p>
              <p className="font-medium">{tenant.property}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unit</p>
              <p className="font-medium">{tenant.unit}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge(tenant.status)}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rent Amount</p>
              <p className="font-medium">₹{tenant.rent_amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lease Period</p>
              <p className="font-medium">{tenant.lease_start} to {tenant.lease_end}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed information */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="bills">Bills & Payments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">₹{tenant.total_paid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Bills</p>
                  <p className="text-2xl font-bold text-orange-600">{tenant.pending_bills}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Bills</p>
                  <p className="text-2xl font-bold text-red-600">{tenant.overdue_bills}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => navigate(`/admin/payment-verification`)}>
                <QrCode className="w-4 h-4 mr-2" />
                Verify Payments
              </Button>
              <Button className="w-full" onClick={() => navigate(`/admin/billing`)}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Bills
              </Button>
              <Button className="w-full" onClick={() => navigate(`/admin/tenant-guide`)}>
                <Book className="w-4 h-4 mr-2" />
                View Guide
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="family" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Family Members</CardTitle>
              <CardDescription>
                Family members associated with this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p>No family members added yet</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Family Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bills & Payments</CardTitle>
              <CardDescription>
                Billing and payment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>No bills generated yet</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate First Bill
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Settings</CardTitle>
              <CardDescription>
                Manage tenant account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={tenant.email} disabled />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={tenant.phone} disabled />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={tenant.status} disabled>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Wizard View
  if (mode === "wizard") {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <TenantManagementWizard onComplete={() => setShowWizard(false)} />
        </div>
      </DashboardLayout>
    );
  }

  // Detail View
  if (mode === "detail" && selectedTenant) {
    return <TenantDetailView tenant={selectedTenant} />;
  }

  // Listing View (Default)
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
            <p className="text-muted-foreground">
              Manage all tenants, their properties, and related activities
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddTenant}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Tenant
            </Button>
            <Button variant="outline" onClick={() => setShowWizard(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Setup Wizard
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <TenantQuickActions />

        {/* Tenant Listing */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Directory</CardTitle>
            <CardDescription>
              All tenants in the system with their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tenants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Tenant Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow
                      key={tenant.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleTenantClick(tenant)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground font-medium text-xs">
                              {tenant.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {tenant.family_members} family members
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{tenant.email}</TableCell>
                      <TableCell>{tenant.phone}</TableCell>
                      <TableCell>{tenant.property}</TableCell>
                      <TableCell>{tenant.unit}</TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>₹{tenant.rent_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
