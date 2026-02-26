import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/hooks/useCurrency";
import { 
  Building2, 
  Users, 
  Calendar, 
  FileText, 
  Bell,
  TrendingUp,
  Home,
  MapPin,
  Mail,
  Phone,
  Eye,
  Edit,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CurrencyIcon } from "@/components/CurrencyIcon";

const UserDashboard = () => {
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();

  const userMetrics = [
    { title: "My Properties", value: "3", change: "0", changeType: "neutral" as const, icon: Building2 },
    { title: "My Tenants", value: "24", change: "+2", changeType: "positive" as const, icon: Users },
    { title: "Monthly Revenue", value: formatAmount(12400), change: "+5.2%", changeType: "positive" as const, icon: CurrencyIcon },
    { title: "Occupancy Rate", value: "85%", change: "+2.1%", changeType: "positive" as const, icon: TrendingUp },
    { title: "Pending Tasks", value: "8", change: "-3", changeType: "positive" as const, icon: Calendar },
    { title: "Open Invoices", value: "5", change: "+1", changeType: "neutral" as const, icon: FileText },
  ];

  const recentProperties = [
    {
      id: "1",
      name: "Sunset Apartments",
      address: "123 Main St, City, State 12345",
      units: 12,
      occupied: 10,
      status: "active",
      revenue: 8500
    },
    {
      id: "2", 
      name: "Oak Villa Complex",
      address: "456 Oak Ave, City, State 67890",
      units: 8,
      occupied: 6,
      status: "active",
      revenue: 3900
    }
  ];

  const recentTenants = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 123-4567",
    unit: "Unit A-101",
    property: "Sunset Apartments",
    rent: 850,
    status: "active"
  },
  {
    id: "2",
    name: "Sarah Johnson", 
    email: "sarah.j@email.com",
    phone: "+1 (555) 987-6543",
    unit: "Unit B-205",
    property: "Oak Villa Complex",
    rent: 650,
    status: "active"
  }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's your property overview.</p>
        </div>

        {/* User Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userMetrics.map((metric, i) => (
            <MetricCard key={metric.title} {...metric} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Property Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Property Information
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/user/properties')}>
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div key={property.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{property.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {property.address}
                        </div>
                      </div>
                      <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                        {property.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Units:</span>
                        <div className="font-medium">{property.occupied}/{property.units}</div>
                        <Progress value={(property.occupied / property.units) * 100} className="h-1 mt-1" />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Revenue:</span>
                        <div className="font-medium text-green-600">${property.revenue}/mo</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tenant Listings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Tenants
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/user/tenants')}>
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTenants.map((tenant) => (
                  <div key={tenant.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{tenant.name}</h4>
                        <div className="text-sm text-muted-foreground">{tenant.unit} • {tenant.property}</div>
                      </div>
                      <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                        {tenant.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {tenant.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {tenant.phone}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-sm font-medium">{formatAmount(tenant.rent)}/mo</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Basic Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Basic Reports
            </CardTitle>
            <Button variant="outline" size="sm">
              View Reports
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Revenue Trend</h4>
                <p className="text-2xl font-bold text-green-600">+12.5%</p>
                <p className="text-sm text-muted-foreground">vs last month</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                  <PieChart className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Occupancy Rate</h4>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-muted-foreground">of total units</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Active Leases</h4>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limited Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Limited Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm">Create Invoice</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Add Tenant</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Building2 className="h-6 w-6" />
                <span className="text-sm">Add Property</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Bell className="h-6 w-6" />
                <span className="text-sm">Send Notice</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">New tenant registered</span>
                <span className="text-xs text-muted-foreground">2h ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Payment received</span>
                <span className="text-xs text-muted-foreground">5h ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Maintenance request</span>
                <span className="text-xs text-muted-foreground">1d ago</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Lease renewal due</p>
                  <p className="text-xs text-muted-foreground">3 leases expiring this month</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CurrencyIcon className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Payment received</p>
                  <p className="text-xs text-muted-foreground">{formatAmount(2400)} collected today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
