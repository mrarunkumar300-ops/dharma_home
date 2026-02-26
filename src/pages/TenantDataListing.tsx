import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Plus
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { tenantBackend } from "@/services/backend"
import type { CompleteTenantProfile, TenantProfile, FamilyMember, TenantDocument, Bill } from "@/services/backend"
import { AdminLayout } from "@/components/admin/AdminNavigation"

export function TenantDataListing() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<TenantProfile[]>([])
  const [filteredTenants, setFilteredTenants] = useState<TenantProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [propertyFilter, setPropertyFilter] = useState<string>("all")
  const [selectedTenant, setSelectedTenant] = useState<CompleteTenantProfile | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchTenants()
  }, [])

  useEffect(() => {
    filterTenants()
  }, [tenants, searchTerm, statusFilter, propertyFilter])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      
      // Mock tenant data for now - can be enhanced with real API call
      const mockTenants: TenantProfile[] = [
        {
          id: '1',
          name: 'Rajesh Kumar',
          email: 'rajesh.kumar@email.com',
          phone: '+91 98765 43210',
          address: '123 Main Street, City',
          emergency_contact_name: 'Sunita Kumar',
          emergency_contact_relation: 'Spouse',
          emergency_contact_mobile: '+91 98765 43211',
          lease_start: '2024-01-01',
          lease_end: '2024-12-31',
          rent_amount: 15000,
          security_deposit: 45000,
          status: 'active',
          property_id: '1',
          unit_id: '1',
          organization_id: '1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Priya Sharma',
          email: 'priya.sharma@email.com',
          phone: '+91 98765 43212',
          address: '456 Park Avenue, City',
          emergency_contact_name: 'Amit Sharma',
          emergency_contact_relation: 'Brother',
          emergency_contact_mobile: '+91 98765 43213',
          lease_start: '2024-02-01',
          lease_end: '2025-01-31',
          rent_amount: 18000,
          security_deposit: 54000,
          status: 'active',
          property_id: '1',
          unit_id: '2',
          organization_id: '1',
          created_at: '2024-02-01T00:00:00Z',
          updated_at: '2024-02-01T00:00:00Z'
        },
        {
          id: '3',
          name: 'Amit Patel',
          email: 'amit.patel@email.com',
          phone: '+91 98765 43214',
          address: '789 Garden Road, City',
          emergency_contact_name: 'Reena Patel',
          emergency_contact_relation: 'Spouse',
          emergency_contact_mobile: '+91 98765 43215',
          lease_start: '2023-12-01',
          lease_end: '2024-11-30',
          rent_amount: 12000,
          security_deposit: 36000,
          status: 'expiring',
          property_id: '2',
          unit_id: '3',
          organization_id: '1',
          created_at: '2023-12-01T00:00:00Z',
          updated_at: '2023-12-01T00:00:00Z'
        },
        {
          id: '4',
          name: 'Neha Singh',
          email: 'neha.singh@email.com',
          phone: '+91 98765 43216',
          address: '321 Lake View, City',
          emergency_contact_name: 'Rohit Singh',
          emergency_contact_relation: 'Husband',
          emergency_contact_mobile: '+91 98765 43217',
          lease_start: '2024-03-01',
          lease_end: '2025-02-28',
          rent_amount: 20000,
          security_deposit: 60000,
          status: 'active',
          property_id: '2',
          unit_id: '4',
          organization_id: '1',
          created_at: '2024-03-01T00:00:00Z',
          updated_at: '2024-03-01T00:00:00Z'
        },
        {
          id: '5',
          name: 'Vijay Kumar',
          email: 'vijay.kumar@email.com',
          phone: '+91 98765 43218',
          address: '654 Hill Station, City',
          emergency_contact_name: 'Anita Kumar',
          emergency_contact_relation: 'Spouse',
          emergency_contact_mobile: '+91 98765 43219',
          lease_start: '2023-10-01',
          lease_end: '2024-09-30',
          rent_amount: 10000,
          security_deposit: 30000,
          status: 'inactive',
          property_id: '3',
          unit_id: '5',
          organization_id: '1',
          created_at: '2023-10-01T00:00:00Z',
          updated_at: '2023-10-01T00:00:00Z'
        }
      ]

      setTenants(mockTenants)
    } catch (error) {
      console.error('Error fetching tenants:', error)
      toast({
        title: "Error",
        description: "Failed to load tenant data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTenants = () => {
    let filtered = tenants

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.phone?.includes(searchTerm)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(tenant => tenant.status === statusFilter)
    }

    // Property filter
    if (propertyFilter !== "all") {
      filtered = filtered.filter(tenant => tenant.property_id === propertyFilter)
    }

    setFilteredTenants(filtered)
  }

  const handleViewDetails = async (tenant: TenantProfile) => {
    try {
      // Fetch complete tenant profile
      const response = await tenantBackend.getTenantProfile(tenant.id)
      if (response.success && response.data) {
        setSelectedTenant(response.data)
        setShowDetailModal(true)
      } else {
        throw new Error(response.error || 'Failed to fetch tenant details')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tenant details",
        variant: "destructive"
      })
    }
  }

  const handleExportData = () => {
    // Export tenant data to CSV
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Status', 'Rent Amount', 'Lease Start', 'Lease End'],
      ...filteredTenants.map(tenant => [
        tenant.name,
        tenant.email || '',
        tenant.phone || '',
        tenant.status,
        tenant.rent_amount || 0,
        tenant.lease_start || '',
        tenant.lease_end || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tenant_data.csv'
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Tenant data exported successfully"
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'expiring':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Expiring</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tenant data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Tenant Data Listing</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExportData} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
            <Button onClick={fetchTenants} className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                <p className="text-2xl font-bold">{tenants.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
                <p className="text-2xl font-bold">{tenants.filter(t => t.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{tenants.filter(t => t.status === 'expiring').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{tenants.filter(t => t.status === 'inactive').length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expiring">Expiring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  <SelectItem value="1">Sunshine Apartments</SelectItem>
                  <SelectItem value="2">Green Valley Residency</SelectItem>
                  <SelectItem value="3">Lake View Heights</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setPropertyFilter("all")
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Accounts</CardTitle>
          <CardDescription>
            Showing {filteredTenants.length} of {tenants.length} tenant accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rent Amount</TableHead>
                <TableHead>Lease Period</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-sm text-muted-foreground">{tenant.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{tenant.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[150px]">{tenant.address}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell>
                    <div className="font-medium">₹{tenant.rent_amount?.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{tenant.lease_start}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{tenant.lease_end}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Property {tenant.property_id}</div>
                      <div className="text-sm text-muted-foreground">Unit {tenant.unit_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(tenant)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Tenant Details</h2>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
            
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="family">Family</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="bills">Bills</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tenant Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <p className="font-medium">{selectedTenant.tenant.name}</p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p className="font-medium">{selectedTenant.tenant.email}</p>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <p className="font-medium">{selectedTenant.tenant.phone}</p>
                      </div>
                      <div>
                        <Label>Address</Label>
                        <p className="font-medium">{selectedTenant.tenant.address}</p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedTenant.tenant.status)}</div>
                      </div>
                      <div>
                        <Label>Rent Amount</Label>
                        <p className="font-medium">₹{selectedTenant.tenant.rent_amount?.toLocaleString()}/month</p>
                      </div>
                      <div>
                        <Label>Security Deposit</Label>
                        <p className="font-medium">₹{selectedTenant.tenant.security_deposit?.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label>Lease Period</Label>
                        <p className="font-medium">{selectedTenant.tenant.lease_start} - {selectedTenant.tenant.lease_end}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="family" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Family Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedTenant.family_members.map((member) => (
                        <div key={member.id} className="border rounded p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Name</Label>
                              <p className="font-medium">{member.name}</p>
                            </div>
                            <div>
                              <Label>Relation</Label>
                              <p className="font-medium">{member.relation}</p>
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <p className="font-medium">{member.mobile_number}</p>
                            </div>
                            <div>
                              <Label>Emergency Contact</Label>
                              <p className="font-medium">{member.is_emergency_contact ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedTenant.documents.map((doc) => (
                        <div key={doc.id} className="border rounded p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Document Type</Label>
                              <p className="font-medium">{doc.document_type}</p>
                            </div>
                            <div>
                              <Label>Document Name</Label>
                              <p className="font-medium">{doc.document_name}</p>
                            </div>
                            <div>
                              <Label>Upload Date</Label>
                              <p className="font-medium">{new Date(doc.upload_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <Label>Verified</Label>
                              <p className="font-medium">{doc.is_verified ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bills" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Bills & Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedTenant.bills.map((bill) => (
                        <div key={bill.id} className="border rounded p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Invoice Number</Label>
                              <p className="font-medium">{bill.invoice_number}</p>
                            </div>
                            <div>
                              <Label>Bill Type</Label>
                              <p className="font-medium">{bill.bill_type}</p>
                            </div>
                            <div>
                              <Label>Amount</Label>
                              <p className="font-medium">₹{bill.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <p className="font-medium">{bill.status}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  )
}
