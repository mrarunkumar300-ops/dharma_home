import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  Warehouse,
  Box,
  ArrowUpDown
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/AdminNavigation"

// Types for Inventory Management
interface InventoryItem {
  id: string
  name: string
  category: string
  description: string
  sku: string
  quantity: number
  minQuantity: number
  maxQuantity: number
  unit: string
  unitPrice: number
  location: string
  supplier: string
  purchaseDate: string
  expiryDate?: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  condition: 'new' | 'good' | 'fair' | 'poor'
  lastUpdated: string
  notes?: string
}

interface InventoryTransaction {
  id: string
  itemId: string
  itemName: string
  type: 'purchase' | 'sale' | 'adjustment' | 'return'
  quantity: number
  unitPrice: number
  totalPrice: number
  reference: string
  reason: string
  date: string
  performedBy: string
}

interface InventoryCategory {
  id: string
  name: string
  description: string
  parentCategory?: string
}

export function InventoryManagement() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [activeTab, setActiveTab] = useState("items")

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    sku: "",
    quantity: 0,
    minQuantity: 0,
    maxQuantity: 1000,
    unit: "pieces",
    unitPrice: 0,
    location: "",
    supplier: "",
    purchaseDate: "",
    expiryDate: "",
    condition: "new",
    notes: ""
  })

  const [transactionData, setTransactionData] = useState({
    itemId: "",
    type: "purchase",
    quantity: 0,
    unitPrice: 0,
    reference: "",
    reason: ""
  })

  useEffect(() => {
    fetchInventoryData()
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, searchTerm, categoryFilter, statusFilter])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      
      // Mock inventory data
      const mockItems: InventoryItem[] = [
        {
          id: '1',
          name: 'LED Light Bulb',
          category: 'Electrical',
          description: 'Energy efficient LED bulb for common areas',
          sku: 'LED-001',
          quantity: 150,
          minQuantity: 20,
          maxQuantity: 500,
          unit: 'pieces',
          unitPrice: 120,
          location: 'Store Room A',
          supplier: 'Electro Supplies Ltd',
          purchaseDate: '2024-01-15',
          expiryDate: '2025-01-15',
          status: 'in_stock',
          condition: 'new',
          lastUpdated: '2024-01-15T10:30:00Z',
          notes: 'High quality LED bulbs with 2-year warranty'
        },
        {
          id: '2',
          name: 'Water Filter',
          category: 'Plumbing',
          description: 'RO water filter for kitchen use',
          sku: 'FLT-002',
          quantity: 8,
          minQuantity: 5,
          maxQuantity: 20,
          unit: 'pieces',
          unitPrice: 2500,
          location: 'Store Room B',
          supplier: 'Aqua Pure Systems',
          purchaseDate: '2024-01-10',
          expiryDate: '2024-12-10',
          status: 'low_stock',
          condition: 'good',
          lastUpdated: '2024-01-10T14:20:00Z'
        },
        {
          id: '3',
          name: 'Fire Extinguisher',
          category: 'Safety',
          description: '2kg ABC type fire extinguisher',
          sku: 'FIRE-003',
          quantity: 0,
          minQuantity: 2,
          maxQuantity: 10,
          unit: 'pieces',
          unitPrice: 1500,
          location: 'Safety Cabinet',
          supplier: 'Safety First Co',
          purchaseDate: '2023-12-01',
          expiryDate: '2025-12-01',
          status: 'out_of_stock',
          condition: 'good',
          lastUpdated: '2024-01-20T09:15:00Z'
        },
        {
          id: '4',
          name: 'Cleaning Supplies Kit',
          category: 'Cleaning',
          description: 'Complete cleaning kit with mops, buckets, detergents',
          sku: 'CLN-004',
          quantity: 25,
          minQuantity: 10,
          maxQuantity: 50,
          unit: 'kits',
          unitPrice: 850,
          location: 'Janitorial Closet',
          supplier: 'CleanPro Supplies',
          purchaseDate: '2024-01-05',
          status: 'in_stock',
          condition: 'good',
          lastUpdated: '2024-01-05T11:45:00Z'
        },
        {
          id: '5',
          name: 'Door Lock Set',
          category: 'Hardware',
          description: 'High security door lock with 3 keys',
          sku: 'LCK-005',
          quantity: 12,
          minQuantity: 5,
          maxQuantity: 30,
          unit: 'sets',
          unitPrice: 1200,
          location: 'Hardware Box',
          supplier: 'SecureLock Systems',
          purchaseDate: '2024-01-08',
          status: 'in_stock',
          condition: 'new',
          lastUpdated: '2024-01-08T16:30:00Z'
        }
      ]

      const mockCategories: InventoryCategory[] = [
        { id: '1', name: 'Electrical', description: 'Electrical items and components' },
        { id: '2', name: 'Plumbing', description: 'Plumbing fixtures and supplies' },
        { id: '3', name: 'Safety', description: 'Safety equipment and supplies' },
        { id: '4', name: 'Cleaning', description: 'Cleaning supplies and equipment' },
        { id: '5', name: 'Hardware', description: 'Hardware and tools' },
        { id: '6', name: 'Furniture', description: 'Office and common area furniture' },
        { id: '7', name: 'Stationery', description: 'Office stationery and supplies' }
      ]

      const mockTransactions: InventoryTransaction[] = [
        {
          id: '1',
          itemId: '1',
          itemName: 'LED Light Bulb',
          type: 'purchase',
          quantity: 50,
          unitPrice: 120,
          totalPrice: 6000,
          reference: 'PO-2024-001',
          reason: 'Monthly restock',
          date: '2024-01-15',
          performedBy: 'Admin'
        },
        {
          id: '2',
          itemId: '2',
          itemName: 'Water Filter',
          type: 'sale',
          quantity: 2,
          unitPrice: 2500,
          totalPrice: 5000,
          reference: 'SALE-2024-001',
          reason: 'Unit 101 replacement',
          date: '2024-01-20',
          performedBy: 'Admin'
        }
      ]

      setItems(mockItems)
      setCategories(mockCategories)
      setTransactions(mockTransactions)
    } catch (error) {
      console.error('Error fetching inventory data:', error)
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    setFilteredItems(filtered)
  }

  const handleAddItem = async () => {
    try {
      // Validate form
      if (!formData.name || !formData.category || !formData.sku) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      // Check if SKU already exists
      if (items.some(item => item.sku === formData.sku)) {
        toast({
          title: "Error",
          description: "SKU already exists",
          variant: "destructive"
        })
        return
      }

      // Create new item
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        ...formData,
        status: formData.quantity <= formData.minQuantity ? 'low_stock' : 'in_stock',
        condition: formData.condition as 'new' | 'good' | 'fair' | 'poor',
        lastUpdated: new Date().toISOString()
      }

      setItems([...items, newItem])
      setShowAddItemModal(false)
      resetForm()
      
      toast({
        title: "Success",
        description: "Item added successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive"
      })
    }
  }

  const handleAddTransaction = async () => {
    try {
      if (!transactionData.itemId || transactionData.quantity <= 0) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      const item = items.find(i => i.id === transactionData.itemId)
      if (!item) return

      // Calculate new quantity
      let newQuantity = item.quantity
      if (transactionData.type === 'purchase') {
        newQuantity += transactionData.quantity
      } else if (transactionData.type === 'sale' || transactionData.type === 'adjustment') {
        newQuantity -= transactionData.quantity
      }

      // Update item quantity
      const updatedItems = items.map(i => 
        i.id === transactionData.itemId 
          ? { 
              ...i, 
              quantity: newQuantity,
              status: newQuantity <= 0 ? 'out_of_stock' : 
                     newQuantity <= i.minQuantity ? 'low_stock' : 'in_stock',
              lastUpdated: new Date().toISOString()
            }
          : i
      ) as InventoryItem[]
      setItems(updatedItems)

      // Add transaction record
      const newTransaction: InventoryTransaction = {
        id: Date.now().toString(),
        itemId: transactionData.itemId,
        itemName: item.name,
        type: transactionData.type as any,
        quantity: transactionData.quantity,
        unitPrice: transactionData.unitPrice,
        totalPrice: transactionData.quantity * transactionData.unitPrice,
        reference: transactionData.reference,
        reason: transactionData.reason,
        date: new Date().toISOString().split('T')[0],
        performedBy: 'Admin'
      }

      setTransactions([newTransaction, ...transactions])
      setShowTransactionModal(false)
      resetTransactionForm()

      toast({
        title: "Success",
        description: "Transaction recorded successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record transaction",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      sku: "",
      quantity: 0,
      minQuantity: 0,
      maxQuantity: 1000,
      unit: "pieces",
      unitPrice: 0,
      location: "",
      supplier: "",
      purchaseDate: "",
      expiryDate: "",
      condition: "new",
      notes: ""
    })
  }

  const resetTransactionForm = () => {
    setTransactionData({
      itemId: "",
      type: "purchase",
      quantity: 0,
      unitPrice: 0,
      reference: "",
      reason: ""
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>
      case 'low_stock':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Low Stock</Badge>
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>
      case 'discontinued':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Discontinued</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'new':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">New</Badge>
      case 'good':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Good</Badge>
      case 'fair':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Fair</Badge>
      case 'poor':
        return <Badge variant="destructive">Poor</Badge>
      default:
        return <Badge variant="secondary">{condition}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button onClick={() => setShowAddItemModal(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </Button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold">{items.filter(i => i.status === 'in_stock').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">{items.filter(i => i.status === 'low_stock').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold">{items.filter(i => i.status === 'out_of_stock').length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Inventory Items</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
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
                      placeholder="Search by name, SKU, description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("")
                    setCategoryFilter("all")
                    setStatusFilter("all")
                  }}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Showing {filteredItems.length} of {items.length} items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.sku}</code>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.quantity}</span>
                          <span className="text-sm text-muted-foreground">{item.unit}</span>
                        </div>
                        {item.quantity <= item.minQuantity && (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{getConditionBadge(item.condition)}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowTransactionModal(true)
                            }}
                          >
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Inventory movements and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.itemName}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.type === 'purchase' ? 'default' :
                          transaction.type === 'sale' ? 'destructive' : 'secondary'
                        }>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>₹{transaction.totalPrice.toLocaleString()}</TableCell>
                      <TableCell>{transaction.reference}</TableCell>
                      <TableCell>{transaction.performedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Reports</CardTitle>
              <CardDescription>
                Generate and view inventory reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex items-center space-x-2 h-20">
                  <BarChart3 className="h-8 w-8" />
                  <div className="text-left">
                    <div className="font-medium">Stock Report</div>
                    <div className="text-sm text-muted-foreground">Current stock levels</div>
                  </div>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2 h-20">
                  <Package className="h-8 w-8" />
                  <div className="text-left">
                    <div className="font-medium">Low Stock Alert</div>
                    <div className="text-sm text-muted-foreground">Items needing restock</div>
                  </div>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2 h-20">
                  <Warehouse className="h-8 w-8" />
                  <div className="text-left">
                    <div className="font-medium">Value Report</div>
                    <div className="text-sm text-muted-foreground">Total inventory value</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Item Modal */}
      <Dialog open={showAddItemModal} onOpenChange={setShowAddItemModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>
              Add a new item to the inventory system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter item name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder="Enter SKU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="kits">Kits</SelectItem>
                    <SelectItem value="sets">Sets</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minQuantity">Min Quantity</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({...formData, minQuantity: parseInt(e.target.value) || 0})}
                  placeholder="Enter minimum quantity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxQuantity">Max Quantity</Label>
                <Input
                  id="maxQuantity"
                  type="number"
                  value={formData.maxQuantity}
                  onChange={(e) => setFormData({...formData, maxQuantity: parseInt(e.target.value) || 0})}
                  placeholder="Enter maximum quantity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price (₹)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})}
                  placeholder="Enter unit price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Enter storage location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Enter additional notes"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAddItemModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Modal */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
            <DialogDescription>
              Record inventory movement for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select value={transactionData.type} onValueChange={(value) => setTransactionData({...transactionData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionQuantity">Quantity</Label>
              <Input
                id="transactionQuantity"
                type="number"
                value={transactionData.quantity}
                onChange={(e) => setTransactionData({...transactionData, quantity: parseInt(e.target.value) || 0})}
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionUnitPrice">Unit Price (₹)</Label>
              <Input
                id="transactionUnitPrice"
                type="number"
                value={transactionData.unitPrice}
                onChange={(e) => setTransactionData({...transactionData, unitPrice: parseFloat(e.target.value) || 0})}
                placeholder="Enter unit price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionReference">Reference</Label>
              <Input
                id="transactionReference"
                value={transactionData.reference}
                onChange={(e) => setTransactionData({...transactionData, reference: e.target.value})}
                placeholder="Enter reference number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionReason">Reason</Label>
              <Textarea
                id="transactionReason"
                value={transactionData.reason}
                onChange={(e) => setTransactionData({...transactionData, reason: e.target.value})}
                placeholder="Enter reason for transaction"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowTransactionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTransaction}>
              Record Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  )
}
