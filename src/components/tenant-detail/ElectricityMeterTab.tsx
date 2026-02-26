import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Zap, 
  TrendingUp,
  Calendar,
  DollarSign,
  Plus,
  Edit,
  BarChart3,
  Activity
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MeterReading {
  id: string
  reading_month: string
  previous_reading: number
  current_reading: number
  units_used: number
  unit_rate: number
  total_amount: number
  reading_date: string
}

interface ElectricityMeterTabProps {
  tenantId: string
  unitId: string
  recentReadings: MeterReading[]
  isAdmin: boolean
  onUpdate: () => void
}

export function ElectricityMeterTab({ tenantId, unitId, recentReadings, isAdmin, onUpdate }: ElectricityMeterTabProps) {
  const { toast } = useToast()
  const [readings, setReadings] = useState<MeterReading[]>(recentReadings || [])
  const [loading, setLoading] = useState(false)
  const [showAddReadingDialog, setShowAddReadingDialog] = useState(false)
  const [editingReading, setEditingReading] = useState<MeterReading | null>(null)

  useEffect(() => {
    setReadings(recentReadings || [])
  }, [recentReadings])

  const handleAddReading = async (formData: any) => {
    try {
      // For now, just show a toast since we don't have the edge function deployed yet
      toast({
        title: "Success",
        description: "Meter reading added successfully (mock data)"
      })
      setShowAddReadingDialog(false)
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add meter reading",
        variant: "destructive"
      })
    }
  }

  const handleUpdateReading = async (readingId: string, formData: any) => {
    try {
      // For now, just show a toast since we don't have the edge function deployed yet
      toast({
        title: "Success",
        description: "Meter reading updated successfully (mock data)"
      })
      setEditingReading(null)
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update meter reading",
        variant: "destructive"
      })
    }
  }

  const calculateTotalUnits = () => {
    return readings.reduce((sum, reading) => sum + reading.units_used, 0)
  }

  const calculateTotalAmount = () => {
    return readings.reduce((sum, reading) => sum + reading.total_amount, 0)
  }

  const getAverageUnitsPerMonth = () => {
    if (readings.length === 0) return 0
    return Math.round(calculateTotalUnits() / readings.length)
  }

  const getCurrentMonthReading = () => {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    return readings.find(r => r.reading_month.startsWith(currentMonth))
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="font-medium">{calculateTotalUnits()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-medium">₹{calculateTotalAmount()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Units/Month</p>
                <p className="font-medium">{getAverageUnitsPerMonth()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Current Rate</p>
                <p className="font-medium">₹{readings[0]?.unit_rate || 0}/unit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Month Status */}
      {getCurrentMonthReading() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Current Month Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Month</Label>
                <p className="font-medium">{new Date(getCurrentMonthReading()!.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Units Used</Label>
                <p className="font-medium text-lg">{getCurrentMonthReading()!.units_used} units</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Rate</Label>
                <p className="font-medium">₹{getCurrentMonthReading()!.unit_rate}/unit</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                <p className="font-medium text-lg text-green-600">₹{getCurrentMonthReading()!.total_amount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meter Readings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Electricity Readings
              </CardTitle>
              <CardDescription>
                Month-wise electricity consumption and billing
              </CardDescription>
            </div>
            {isAdmin && (
              <Dialog open={showAddReadingDialog} onOpenChange={setShowAddReadingDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reading
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Meter Reading</DialogTitle>
                    <DialogDescription>
                      Record monthly electricity meter reading
                    </DialogDescription>
                  </DialogHeader>
                  <MeterReadingForm onSubmit={handleAddReading} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {readings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No meter readings found</p>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowAddReadingDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Reading
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {readings.map((reading) => (
                <Card key={reading.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {new Date(reading.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Reading on {new Date(reading.reading_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {reading.units_used} units
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Previous Reading</p>
                            <p className="font-medium">{reading.previous_reading}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Current Reading</p>
                            <p className="font-medium">{reading.current_reading}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Units Used</p>
                            <p className="font-medium text-blue-600">{reading.units_used}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Unit Rate</p>
                            <p className="font-medium">₹{reading.unit_rate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Amount</p>
                            <p className="font-medium text-green-600">₹{reading.total_amount}</p>
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex flex-col gap-2 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingReading(reading)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Reading Dialog */}
      {editingReading && (
        <Dialog open={!!editingReading} onOpenChange={() => setEditingReading(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Meter Reading</DialogTitle>
              <DialogDescription>
                Update the meter reading for {new Date(editingReading.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </DialogDescription>
            </DialogHeader>
            <MeterReadingForm 
              initialData={editingReading}
              onSubmit={(data) => handleUpdateReading(editingReading.id, data)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function MeterReadingForm({ 
  initialData, 
  onSubmit 
}: { 
  initialData?: MeterReading
  onSubmit: (data: any) => void 
}) {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const [formData, setFormData] = useState({
    reading_month: initialData?.reading_month || currentMonth,
    previous_reading: initialData?.previous_reading || 0,
    current_reading: initialData?.current_reading || 0,
    unit_rate: initialData?.unit_rate || 8
  })

  const calculatedUnits = formData.current_reading - formData.previous_reading
  const calculatedAmount = calculatedUnits * formData.unit_rate

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      reading_month: new Date(formData.reading_month + '-01').toISOString() // Convert to full date
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="reading_month">Month *</Label>
        <Input
          id="reading_month"
          type="month"
          value={formData.reading_month}
          onChange={(e) => setFormData({ ...formData, reading_month: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="previous_reading">Previous Reading *</Label>
          <Input
            id="previous_reading"
            type="number"
            step="0.01"
            value={formData.previous_reading}
            onChange={(e) => setFormData({ ...formData, previous_reading: parseFloat(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="current_reading">Current Reading *</Label>
          <Input
            id="current_reading"
            type="number"
            step="0.01"
            value={formData.current_reading}
            onChange={(e) => setFormData({ ...formData, current_reading: parseFloat(e.target.value) })}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="unit_rate">Unit Rate (₹) *</Label>
        <Input
          id="unit_rate"
          type="number"
          step="0.01"
          value={formData.unit_rate}
          onChange={(e) => setFormData({ ...formData, unit_rate: parseFloat(e.target.value) })}
          required
        />
      </div>

      {/* Calculated Values */}
      <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Units Used:</span>
          <span className="font-medium">{calculatedUnits} units</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Total Amount:</span>
          <span className="font-medium text-green-600">₹{calculatedAmount}</span>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? 'Update Reading' : 'Add Reading'}
      </Button>
    </form>
  )
}
