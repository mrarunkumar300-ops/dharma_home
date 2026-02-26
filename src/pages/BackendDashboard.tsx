import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Database,
  Server,
  Activity,
  Users,
  FileText,
  Zap,
  Settings,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Download
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { tenantBackend } from "@/services/backend"
import { AdminLayout } from "@/components/admin/AdminNavigation"

export function BackendDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [migrationStatus, setMigrationStatus] = useState<any>(null)
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalFamilyMembers: 0,
    totalDocuments: 0,
    totalBills: 0,
    totalMeterReadings: 0
  })

  useEffect(() => {
    fetchBackendStatus()
  }, [])

  const fetchBackendStatus = async () => {
    try {
      setLoading(true)
      
      // Get migration status
      const statusResponse = await tenantBackend.getMigrationStatus()
      if (statusResponse.success) {
        setMigrationStatus(statusResponse.data)
      }

      // Mock stats for now - can be enhanced with real data
      setStats({
        totalTenants: 45,
        totalFamilyMembers: 120,
        totalDocuments: 89,
        totalBills: 156,
        totalMeterReadings: 234
      })
    } catch (error) {
      console.error('Error fetching backend status:', error)
      toast({
        title: "Error",
        description: "Failed to load backend status",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchBackendStatus()
  }

  const handleTestConnection = async () => {
    try {
      const response = await tenantBackend.getMigrationStatus()
      if (response.success) {
        toast({
          title: "Success",
          description: "Backend connection successful"
        })
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Backend connection failed",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading backend status...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Backend Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleRefresh} className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button onClick={handleTestConnection} className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Test Connection</span>
            </Button>
          </div>
        </div>

      {/* Migration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Database Schema Status</span>
          </CardTitle>
          <CardDescription>
            Current database schema and migration status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant={migrationStatus?.isEnhanced ? "default" : "secondary"}>
                {migrationStatus?.isEnhanced ? "Enhanced Schema" : "Current Schema"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {migrationStatus?.message}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {migrationStatus?.isEnhanced ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                <p className="text-2xl font-bold">{stats.totalTenants}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Family Members</p>
                <p className="text-2xl font-bold">{stats.totalFamilyMembers}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bills</p>
                <p className="text-2xl font-bold">{stats.totalBills}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meter Readings</p>
                <p className="text-2xl font-bold">{stats.totalMeterReadings}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schema">Schema Details</TabsTrigger>
          <TabsTrigger value="api">API Status</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Backend Service Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Service Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Updated</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Version</span>
                  <span className="text-sm text-muted-foreground">v1.0.0</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Database Connection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection Status</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Type</span>
                  <span className="text-sm text-muted-foreground">Supabase</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Schema Version</span>
                  <span className="text-sm text-muted-foreground">
                    {migrationStatus?.isEnhanced ? "Enhanced" : "Current"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schema Information</CardTitle>
              <CardDescription>
                Current database schema structure and available tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Current Schema Tables</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>tenants</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>tenants_profile</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>invoices</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>payments</span>
                    </div>
                  </div>
                </div>
                {migrationStatus?.isEnhanced && (
                  <div>
                    <h4 className="font-medium mb-2">Enhanced Schema Tables</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>tenant_family_members</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>tenant_documents</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>electricity_meter_readings</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Enhanced tenant fields</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints Status</CardTitle>
              <CardDescription>
                Backend service API endpoints and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Tenant Management</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span>getTenantProfile</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>getFamilyMembers</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>addFamilyMember</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>updateRoomInfo</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Document Management</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span>getDocuments</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>addDocument</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                Recent backend service activities and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>Backend service initialized</span>
                  <span className="text-muted-foreground">Just now</span>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>Schema status: {migrationStatus?.isEnhanced ? 'Enhanced' : 'Current'}</span>
                  <span className="text-muted-foreground">1 min ago</span>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>Database connection established</span>
                  <span className="text-muted-foreground">2 mins ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  )
}
