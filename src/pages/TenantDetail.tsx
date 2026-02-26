import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Users,
  User,
  Home,
  FileText,
  Zap,
  Calendar,
  DollarSign,
  Edit,
  Phone,
  Mail,
  MapPin
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { tenantBackend } from "@/services/backend"
import { CompleteTenantProfile } from "@/services/backend"
import { ProfileFamilyTab } from "@/components/tenant-detail/ProfileFamilyTab"
import { RoomInformationTab } from "@/components/tenant-detail/RoomInformationTab"
import { BillsPaymentsTab } from "@/components/tenant-detail/BillsPaymentsTab"
import { ElectricityMeterTab } from "@/components/tenant-detail/ElectricityMeterTab"

export default function TenantDetail() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [tenantData, setTenantData] = useState<CompleteTenantProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("profile")

  const isAdmin = user?.app_metadata?.role === 'admin' || user?.app_metadata?.role === 'super_admin'

  useEffect(() => {
    if (tenantId) {
      fetchTenantData()
    }
  }, [tenantId])

  const fetchTenantData = async () => {
    try {
      setLoading(true)
      
      if (!tenantId) {
        throw new Error('No tenant ID provided')
      }

      // Use the new backend service
      const response = await tenantBackend.getTenantProfile(tenantId)
      
      if (response.success && response.data) {
        setTenantData(response.data)
      } else {
        throw new Error(response.error || 'Failed to fetch tenant data')
      }
    } catch (error) {
      console.error('Error fetching tenant data:', error)
      toast({
        title: "Error",
        description: "Failed to load tenant data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchTenantData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!tenantData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Tenant not found</h2>
          <Button onClick={() => navigate('/admin/tenants')} className="mt-4">
            Back to Tenants
          </Button>
        </div>
      </div>
    )
  }

  const { tenant, family_members, documents, room_info, recent_meter_readings } = tenantData

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/tenants')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={""} />
              <AvatarFallback>
                {tenant.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status}
                </Badge>
                <span className="text-sm">ID: {tenant.id.slice(0, 8)}...</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          {isAdmin && (
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Tenant
            </Button>
          )}
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Mobile</p>
                <p className="font-medium">{tenant.phone || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium truncate">{tenant.email || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Unit</p>
                <p className="font-medium">{room_info?.unit || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="font-medium">₹{tenant.rent_amount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile & Family</span>
          </TabsTrigger>
          <TabsTrigger value="room" className="flex items-center space-x-2">
            <Home className="h-4 w-4" />
            <span>Room Info</span>
          </TabsTrigger>
          <TabsTrigger value="bills" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Bills & Payments</span>
          </TabsTrigger>
          <TabsTrigger value="meter" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Electricity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileFamilyTab 
            tenant={tenant}
            familyMembers={family_members}
            documents={documents}
            isAdmin={isAdmin}
            onUpdate={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="room" className="space-y-4">
          <RoomInformationTab 
            roomInfo={room_info}
            tenant={tenant}
            isAdmin={isAdmin}
            onUpdate={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          <BillsPaymentsTab 
            tenantId={tenantId}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="meter" className="space-y-4">
          <ElectricityMeterTab 
            tenantId={tenantId}
            unitId={tenant.unit_id}
            recentReadings={recent_meter_readings}
            isAdmin={isAdmin}
            onUpdate={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
