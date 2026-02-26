import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  Home, 
  MapPin, 
  Calendar,
  DollarSign,
  User,
  Edit,
  Building
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RoomInfo {
  unit: string
  property: string
  property_address: string
  floor: string
  rent: number
  join_date: string
  end_date: string
  security_deposit: number
  monthly_rent: number
}

interface Tenant {
  id: string
  property_id?: string
  unit_id?: string
  lease_start?: string
  lease_end?: string
  rent_amount?: number
  security_deposit?: number
}

interface RoomInformationTabProps {
  roomInfo: RoomInfo
  tenant: Tenant
  isAdmin: boolean
  onUpdate: () => void
}

export function RoomInformationTab({ roomInfo, tenant, isAdmin, onUpdate }: RoomInformationTabProps) {
  const { toast } = useToast()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>(tenant.property_id || '')

  const fetchProperties = async () => {
    try {
      // This would typically fetch from your API
      // For now, using mock data
      setProperties([
        { id: '1', name: 'Sunshine Apartments', address: '123 Main St' },
        { id: '2', name: 'Green Valley Residency', address: '456 Oak Ave' }
      ])
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const fetchUnits = async (propertyId: string) => {
    try {
      // This would typically fetch from your API
      // For now, using mock data
      setUnits([
        { id: '1', unit_number: 'A-101', floor: '1', rent: 15000 },
        { id: '2', unit_number: 'A-102', floor: '1', rent: 16000 },
        { id: '3', unit_number: 'B-201', floor: '2', rent: 17000 }
      ])
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  const handleUpdateRoomInfo = async (formData: any) => {
    try {
      // For now, just show a toast since we don't have the edge function deployed yet
      toast({
        title: "Success",
        description: "Room information updated successfully (mock data)"
      })
      setShowEditDialog(false)
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update room information",
        variant: "destructive"
      })
    }
  }

  const handlePropertyChange = (propertyId: string) => {
    setSelectedProperty(propertyId)
    fetchUnits(propertyId)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current Room Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Room Information
              </CardTitle>
              <CardDescription>
                Current unit and property details
              </CardDescription>
            </div>
            {isAdmin && (
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Update Room Information</DialogTitle>
                    <DialogDescription>
                      Modify the tenant's room and property details
                    </DialogDescription>
                  </DialogHeader>
                  <RoomInfoForm 
                    tenant={tenant}
                    properties={properties}
                    units={units}
                    onPropertyChange={handlePropertyChange}
                    onSubmit={handleUpdateRoomInfo}
                    onOpen={setShowEditDialog}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Unit Number</Label>
              <p className="font-medium text-lg">{roomInfo?.unit || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Floor</Label>
              <p className="font-medium text-lg">{roomInfo?.floor || 'N/A'}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Property</Label>
            <p className="font-medium text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              {roomInfo?.property || 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4" />
              {roomInfo?.property_address || 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Join Date</Label>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {roomInfo?.join_date ? new Date(roomInfo.join_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {roomInfo?.end_date ? new Date(roomInfo.end_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Details
          </CardTitle>
          <CardDescription>
            Rent and security deposit information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Monthly Rent</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <p className="text-2xl font-bold text-green-600">
                  ₹{roomInfo?.monthly_rent || tenant.rent_amount || 0}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">Per month</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Security Deposit</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">
                  ₹{roomInfo?.security_deposit || tenant.security_deposit || 0}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">One-time deposit</p>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-3">Payment Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Monthly Rent:</span>
                <span className="font-medium">₹{roomInfo?.monthly_rent || tenant.rent_amount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Security Deposit:</span>
                <span className="font-medium">₹{roomInfo?.security_deposit || tenant.security_deposit || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total Initial Payment:</span>
                <span>₹{(roomInfo?.monthly_rent || tenant.rent_amount || 0) + (roomInfo?.security_deposit || tenant.security_deposit || 0)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Active
              </Badge>
              <span className="text-sm text-muted-foreground">Regular payments</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Owner Information */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Property Owner Information
          </CardTitle>
          <CardDescription>
            Contact details for property owner/management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Owner Name</Label>
              <p className="font-medium">Property Management Office</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Contact Number</Label>
              <p className="font-medium">+91 98765 43210</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="font-medium">management@property.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RoomInfoForm({ 
  tenant, 
  properties, 
  units, 
  onPropertyChange, 
  onSubmit, 
  onOpen 
}: {
  tenant: Tenant
  properties: any[]
  units: any[]
  onPropertyChange: (id: string) => void
  onSubmit: (data: any) => void
  onOpen: (open: boolean) => void
}) {
  const [formData, setFormData] = useState({
    property_id: tenant.property_id || '',
    unit_id: tenant.unit_id || '',
    lease_start: tenant.lease_start || '',
    lease_end: tenant.lease_end || '',
    rent_amount: tenant.rent_amount || 0,
    security_deposit: tenant.security_deposit || 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="property_id">Property *</Label>
          <Select 
            value={formData.property_id} 
            onValueChange={(value) => {
              setFormData({ ...formData, property_id: value, unit_id: '' })
              onPropertyChange(value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="unit_id">Unit *</Label>
          <Select 
            value={formData.unit_id} 
            onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.unit_number} - Floor {unit.floor} (₹{unit.rent})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lease_start">Lease Start Date *</Label>
          <Input
            id="lease_start"
            type="date"
            value={formData.lease_start}
            onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lease_end">Lease End Date *</Label>
          <Input
            id="lease_end"
            type="date"
            value={formData.lease_end}
            onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rent_amount">Monthly Rent (₹) *</Label>
          <Input
            id="rent_amount"
            type="number"
            value={formData.rent_amount}
            onChange={(e) => setFormData({ ...formData, rent_amount: parseFloat(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="security_deposit">Security Deposit (₹) *</Label>
          <Input
            id="security_deposit"
            type="number"
            value={formData.security_deposit}
            onChange={(e) => setFormData({ ...formData, security_deposit: parseFloat(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => onOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">Update Room Information</Button>
      </div>
    </form>
  )
}
