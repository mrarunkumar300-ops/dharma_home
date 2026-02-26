import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { tenantBackend } from "@/services/backend"
import type { TenantProfile, FamilyMember, TenantDocument } from "@/services/backend"

interface ProfileFamilyTabProps {
  tenant: TenantProfile
  familyMembers: FamilyMember[]
  documents: TenantDocument[]
  isAdmin: boolean
  onUpdate: () => void
}

export function ProfileFamilyTab({ tenant, familyMembers, documents, isAdmin, onUpdate }: ProfileFamilyTabProps) {
  const { toast } = useToast()
  const [showAddFamilyDialog, setShowAddFamilyDialog] = useState(false)
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false)
  const [editingFamilyMember, setEditingFamilyMember] = useState<FamilyMember | null>(null)

  const handleAddFamilyMember = async (formData: any) => {
    try {
      // Use the new backend service
      const response = await tenantBackend.addFamilyMember(tenant.id, formData)
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Family member added successfully"
        })
        setShowAddFamilyDialog(false)
        onUpdate()
      } else {
        throw new Error(response.error || 'Failed to add family member')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add family member",
        variant: "destructive"
      })
    }
  }

  const handleDeleteFamilyMember = async (memberId: string) => {
    try {
      // Use the new backend service
      const response = await tenantBackend.deleteFamilyMember(memberId)
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Family member deleted successfully"
        })
        onUpdate()
      } else {
        throw new Error(response.error || 'Failed to delete family member')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete family member",
        variant: "destructive"
      })
    }
  }

  const handleAddDocument = async (formData: any) => {
    try {
      // Use the new backend service
      const response = await tenantBackend.addDocument(tenant.id, formData)
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Document added successfully"
        })
        setShowAddDocumentDialog(false)
        onUpdate()
      } else {
        throw new Error(response.error || 'Failed to add document')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document",
        variant: "destructive"
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Personal and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <p className="font-medium">{tenant.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {tenant.email || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Mobile Number</Label>
              <p className="font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {tenant.phone || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Address</Label>
              <p className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {tenant.address || 'N/A'}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Emergency Contact</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{tenant.emergency_contact_name || 'N/A'}</p>
                <Badge variant="outline">{tenant.emergency_contact_relation || 'N/A'}</Badge>
              </div>
              {tenant.emergency_contact_mobile && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {tenant.emergency_contact_mobile}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Lease Start</Label>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {tenant.lease_start ? new Date(tenant.lease_start).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Lease End</Label>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {tenant.lease_end ? new Date(tenant.lease_end).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family Members
              </CardTitle>
              <CardDescription>
                Additional family members living with tenant
              </CardDescription>
            </div>
            {isAdmin && (
              <Dialog open={showAddFamilyDialog} onOpenChange={setShowAddFamilyDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Family Member</DialogTitle>
                    <DialogDescription>
                      Add a new family member to the tenant's profile
                    </DialogDescription>
                  </DialogHeader>
                  <FamilyMemberForm onSubmit={handleAddFamilyMember} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {familyMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No family members added</p>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowAddFamilyDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {familyMembers.map((member) => (
                <div key={member.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {member.is_emergency_contact && (
                          <Badge variant="destructive" className="text-xs">
                            Emergency
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.relation}</p>
                      {member.mobile_number && (
                        <p className="text-sm flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {member.mobile_number}
                        </p>
                      )}
                      {member.occupation && (
                        <p className="text-sm">{member.occupation}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteFamilyMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
              <CardDescription>
                Uploaded documents and verification status
              </CardDescription>
            </div>
            {isAdmin && (
              <Dialog open={showAddDocumentDialog} onOpenChange={setShowAddDocumentDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Upload a new document for the tenant
                    </DialogDescription>
                  </DialogHeader>
                  <DocumentForm onSubmit={handleAddDocument} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded</p>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowAddDocumentDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {doc.document_type}
                        </Badge>
                        {doc.is_verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate">{doc.document_name}</p>
                        {doc.document_number && (
                          <p className="text-xs text-muted-foreground">{doc.document_number}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Size: {formatFileSize(doc.file_size)}</p>
                        <p>Uploaded: {new Date(doc.upload_date).toLocaleDateString()}</p>
                        {doc.expiry_date && (
                          <p>Expires: {new Date(doc.expiry_date).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FamilyMemberForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    mobile_number: '',
    date_of_birth: '',
    occupation: '',
    is_emergency_contact: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="relation">Relation *</Label>
        <Select value={formData.relation} onValueChange={(value) => setFormData({ ...formData, relation: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select relation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spouse">Spouse</SelectItem>
            <SelectItem value="child">Child</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
            <SelectItem value="sibling">Sibling</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="mobile_number">Mobile Number</Label>
        <Input
          id="mobile_number"
          value={formData.mobile_number}
          onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="date_of_birth">Date of Birth</Label>
        <Input
          id="date_of_birth"
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="occupation">Occupation</Label>
        <Input
          id="occupation"
          value={formData.occupation}
          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full">Add Family Member</Button>
    </form>
  )
}

function DocumentForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    document_type: '',
    document_number: '',
    document_name: '',
    file_url: '',
    file_size: 0,
    file_type: '',
    expiry_date: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="document_type">Document Type *</Label>
        <Select value={formData.document_type} onValueChange={(value) => setFormData({ ...formData, document_type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aadhar">Aadhar Card</SelectItem>
            <SelectItem value="pan">PAN Card</SelectItem>
            <SelectItem value="agreement">Rental Agreement</SelectItem>
            <SelectItem value="passport">Passport</SelectItem>
            <SelectItem value="driving_license">Driving License</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="document_number">Document Number</Label>
        <Input
          id="document_number"
          value={formData.document_number}
          onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="document_name">Document Name *</Label>
        <Input
          id="document_name"
          value={formData.document_name}
          onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="file_url">File URL *</Label>
        <Input
          id="file_url"
          value={formData.file_url}
          onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
          placeholder="https://example.com/file.pdf"
          required
        />
      </div>
      <div>
        <Label htmlFor="expiry_date">Expiry Date</Label>
        <Input
          id="expiry_date"
          type="date"
          value={formData.expiry_date}
          onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full">Upload Document</Button>
    </form>
  )
}
