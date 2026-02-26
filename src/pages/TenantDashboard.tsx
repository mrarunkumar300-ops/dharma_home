import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  MapPin, 
  Mail,
  Phone,
} from "lucide-react";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { 
  Settings, 
  Upload,
  Download,
  Plus,
  CreditCard,
  Zap,
  Droplet,
  Wrench,
  LogOut,
  User,
  Camera
} from "lucide-react";
import { useTenantProfile } from "@/hooks/useTenantProfile";
import { useCurrency } from "@/hooks/useCurrency";

const TenantDashboard = () => {
  const { data: dashboardData, isLoading, error } = useTenantProfile();
  const { formatAmount } = useCurrency();
  
  // Handle loading and error states
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading tenant data...</div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">
            {error?.message || 'Unable to load tenant data. Please contact your administrator.'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tenantData = dashboardData?.profile;
  const roomData = dashboardData?.room;
  const familyMembers = dashboardData?.family_members || [];
  const documents = dashboardData?.documents || [];
  const bills = dashboardData?.bills || [];
  
  // Calculate metrics from real data
  const tenantMetrics = [
    { 
      title: "Monthly Rent", 
      value: roomData ? formatAmount(roomData.rent_amount) : "Not Assigned", 
      change: roomData ? `Due ${roomData.agreement_start_date ? `on ${new Date(roomData.agreement_start_date).toLocaleDateString()}` : 'TBD'}` : "No room assigned", 
      changeType: "neutral" as const, 
      icon: CurrencyIcon 
    },
    { 
      title: "Room Details", 
      value: roomData ? roomData.room_number : "Not Assigned", 
      change: roomData && roomData.floor_number ? `${roomData.floor_number}nd Floor` : "No room assigned", 
      changeType: "neutral" as const, 
      icon: Home 
    },
    { 
      title: "Family Members", 
      value: familyMembers.length.toString(), 
      change: "Registered", 
      changeType: "neutral" as const, 
      icon: Users 
    },
    { 
      title: "Pending Bills", 
      value: bills.filter(b => b.status === 'pending').length.toString(), 
      change: `${bills.filter(b => b.status === 'overdue').length} Overdue`, 
      changeType: bills.some(b => b.status === 'overdue') ? "negative" as const : "neutral" as const, 
      icon: FileText 
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tenant Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {tenantData?.full_name || 'Tenant'}!</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Tenant Code: {tenantData?.tenant_code || 'N/A'}
          </Badge>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tenantMetrics.map((metric, i) => (
            <MetricCard key={metric.title} {...metric} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Details
              </CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                {tenantData?.profile_photo_url ? (
                    <img src={tenantData.profile_photo_url} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{tenantData?.full_name || 'Tenant'}</p>
                  <p className="text-sm text-muted-foreground">Tenant</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{tenantData?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{tenantData?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs">{(roomData as any)?.properties?.address || 'No address available'}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Room Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Room Details
              </CardTitle>
              <CardDescription>Your rental information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Room Number</p>
                  <p className="font-medium">{roomData?.room_number || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Floor</p>
                  <p className="font-medium">{roomData?.floor_number ? `${roomData.floor_number}nd Floor` : 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rent Amount</p>
                  <p className="font-medium">{roomData ? `$${roomData.rent_amount}/month` : 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Agreement Period</p>
                  <p className="font-medium text-xs">
                    {roomData?.agreement_start_date && roomData?.agreement_end_date 
                      ? `${new Date(roomData.agreement_start_date).toLocaleDateString()} to ${new Date(roomData.agreement_end_date).toLocaleDateString()}`
                      : 'Not Available'
                    }
                  </p>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                View Agreement
              </Button>
            </CardContent>
          </Card>

          {/* Family Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Family Members
              </CardTitle>
              <CardDescription>Registered family members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {familyMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="font-medium text-sm">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.relationship} • {member.age ? `${member.age} years` : 'Age not specified'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {member.relationship}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Documents and Bills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents
              </CardTitle>
              <CardDescription>Your uploaded documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium text-sm">{doc.document_type || 'Document'}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.document_type} • {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </CardContent>
          </Card>

          {/* Bills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Bills
              </CardTitle>
              <CardDescription>Your monthly bills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {bills.map((bill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {bill.bill_type === "Electricity" && <Zap className="w-5 h-5 text-yellow-600" />}
                      {bill.bill_type === "Water" && <Droplet className="w-5 h-5 text-blue-600" />}
                      {bill.bill_type === "Maintenance" && <Wrench className="w-5 h-5 text-gray-600" />}
                      <div>
                        <p className="font-medium text-sm">{bill.bill_type}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(bill.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${bill.amount}</p>
                      <Badge 
                        variant={bill.status === "overdue" ? "destructive" : "secondary"} 
                        className="text-xs"
                      >
                        {bill.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Bills
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <CurrencyIcon className="w-5 h-5" />
                <span className="text-sm">Pay Rent</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <FileText className="w-5 h-5" />
                <span className="text-sm">View Bills</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Upload className="w-5 h-5" />
                <span className="text-sm">Upload Doc</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Settings className="w-5 h-5" />
                <span className="text-sm">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TenantDashboard;
