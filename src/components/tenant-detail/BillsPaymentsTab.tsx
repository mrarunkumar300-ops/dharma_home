import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  DollarSign,
  Calendar,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  CreditCard,
  TrendingUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Bill {
  id: string
  invoice_number: string
  bill_type: string
  amount: number
  issue_date: string
  due_date: string
  status: string
  payments?: Payment[]
  total_paid?: number
  remaining_balance?: number
}

interface Payment {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  status: string
}

interface BillsPaymentsTabProps {
  tenantId: string
  isAdmin: boolean
}

export function BillsPaymentsTab({ tenantId, isAdmin }: BillsPaymentsTabProps) {
  const { toast } = useToast()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddBillDialog, setShowAddBillDialog] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  useEffect(() => {
    fetchBills()
  }, [tenantId])

  const fetchBills = async () => {
    try {
      setLoading(true)
      
      // Mock bills data for now
      const mockBills = [
        {
          id: '1',
          invoice_number: 'INV-2024-001',
          bill_type: 'Rent',
          amount: 15000,
          issue_date: '2024-01-01',
          due_date: '2024-01-05',
          status: 'paid',
          payments: [
            {
              id: '1',
              amount: 15000,
              payment_date: '2024-01-04',
              payment_method: 'cash',
              status: 'completed'
            }
          ],
          total_paid: 15000,
          remaining_balance: 0
        },
        {
          id: '2',
          invoice_number: 'INV-2024-002',
          bill_type: 'Electricity',
          amount: 425,
          issue_date: '2024-01-15',
          due_date: '2024-01-20',
          status: 'pending',
          payments: [],
          total_paid: 0,
          remaining_balance: 425
        }
      ]
      
      setBills(mockBills)
    } catch (error) {
      console.error('Error fetching bills:', error)
      toast({
        title: "Error",
        description: "Failed to load bills and payments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddBill = async (formData: any) => {
    try {
      // For now, just show a toast since we don't have the edge function deployed yet
      toast({
        title: "Success",
        description: "Bill added successfully (mock data)"
      })
      setShowAddBillDialog(false)
      fetchBills()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add bill",
        variant: "destructive"
      })
    }
  }

  const handleMarkAsPaid = async (billId: string) => {
    try {
      // For now, just show a toast since we don't have the edge function deployed yet
      toast({
        title: "Success",
        description: "Payment processed successfully (mock data)"
      })
      setSelectedBill(null)
      fetchBills()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getBillTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rent':
        return <Home className="h-4 w-4" />
      case 'electricity':
        return <Zap className="h-4 w-4" />
      case 'water':
        return <Droplets className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Bills</p>
                <p className="font-medium">{bills.length}</p>
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
                <p className="font-medium">₹{bills.reduce((sum, bill) => sum + bill.amount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Paid Amount</p>
                <p className="font-medium text-green-600">₹{bills.reduce((sum, bill) => sum + (bill.total_paid || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="font-medium text-red-600">₹{bills.reduce((sum, bill) => sum + (bill.remaining_balance || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bills & Payments
              </CardTitle>
              <CardDescription>
                Invoice history and payment status
              </CardDescription>
            </div>
            {isAdmin && (
              <Dialog open={showAddBillDialog} onOpenChange={setShowAddBillDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bill
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Bill</DialogTitle>
                    <DialogDescription>
                      Generate a new bill for the tenant
                    </DialogDescription>
                  </DialogHeader>
                  <BillForm onSubmit={handleAddBill} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bills found</p>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowAddBillDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Bill
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map((bill) => (
                <Card key={bill.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          {getBillTypeIcon(bill.bill_type)}
                          <div>
                            <p className="font-medium">{bill.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">{bill.bill_type}</p>
                          </div>
                          {getStatusBadge(bill.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Issue Date</p>
                            <p className="font-medium">{new Date(bill.issue_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Due Date</p>
                            <p className="font-medium">{new Date(bill.due_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Amount</p>
                            <p className="font-medium">₹{bill.amount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Remaining</p>
                            <p className="font-medium text-red-600">₹{bill.remaining_balance || bill.amount}</p>
                          </div>
                        </div>

                        {bill.payments && bill.payments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Payment History</p>
                            <div className="space-y-1">
                              {bill.payments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-3 w-3" />
                                    <span>₹{payment.amount}</span>
                                    <span className="text-muted-foreground">via {payment.payment_method}</span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    {new Date(payment.payment_date).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        {isAdmin && bill.status !== 'paid' && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedBill(bill)
                              handleMarkAsPaid(bill.id)
                            }}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Paid
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

function BillForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    invoice_number: '',
    bill_type: 'Rent',
    amount: 0,
    due_date: '',
    unit_id: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="invoice_number">Invoice Number *</Label>
        <Input
          id="invoice_number"
          value={formData.invoice_number}
          onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
          placeholder="INV-2024-001"
          required
        />
      </div>
      <div>
        <Label htmlFor="bill_type">Bill Type *</Label>
        <Select value={formData.bill_type} onValueChange={(value) => setFormData({ ...formData, bill_type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select bill type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Rent">Rent</SelectItem>
            <SelectItem value="Electricity">Electricity</SelectItem>
            <SelectItem value="Water">Water</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="amount">Amount (₹) *</Label>
        <Input
          id="amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
          required
        />
      </div>
      <div>
        <Label htmlFor="due_date">Due Date *</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          required
        />
      </div>
      <Button type="submit" className="w-full">Create Bill</Button>
    </form>
  )
}

// Missing imports for icons
import { Home, Zap, Droplets } from "lucide-react"
