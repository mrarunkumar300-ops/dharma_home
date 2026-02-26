import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Plus, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RentInvoice } from "./RentInvoice";
import { useTenants } from "@/hooks/useTenants";
import { useProperties } from "@/hooks/useProperties";
import { useInvoices } from "@/hooks/useInvoices";
import { toast } from "sonner";

const rentInvoiceSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  tenantId: z.string().min(1, "Tenant is required"),
  invoiceDate: z.date({
    required_error: "Invoice date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
});

type RentInvoiceFormData = z.infer<typeof rentInvoiceSchema>;

interface BillItem {
  id: string;
  type: 'rent' | 'electricity' | 'water' | 'other';
  description: string;
  amount: number;
  units?: number;
  rate?: number;
  startReading?: number;
  endReading?: number;
  unitsDividerRoom?: number;
}

interface RentInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RentInvoiceDialog2({ open, onOpenChange }: RentInvoiceDialogProps) {
  const { data: tenants } = useTenants();
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { createInvoice } = useInvoices();
  const [showPreview, setShowPreview] = useState(false);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [footerMessage, setFooterMessage] = useState("Thank you for your payment. Please pay before the due date to avoid late fees. For queries, contact: +91 98765 43210");
  const [isCreating, setIsCreating] = useState(false);

  // Debug: Log properties data
  console.log('Properties data:', properties);
  console.log('Properties loading:', propertiesLoading);

  // Auto-generate invoice number
  const generateInvoiceNumber = () => {
    return `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  };

  const form = useForm<RentInvoiceFormData>({
    resolver: zodResolver(rentInvoiceSchema),
    defaultValues: {
      propertyId: "",
      tenantId: "",
      invoiceDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Due in 7 days
    },
  });

  // Watch property and tenant changes
  const selectedPropertyId = form.watch("propertyId");
  const selectedTenantId = form.watch("tenantId");

  const selectedProperty = properties?.find(p => p.id === selectedPropertyId);
  const selectedTenant = tenants?.find(t => t.id === selectedTenantId);

  // Reset tenant when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      form.setValue("tenantId", "");
    }
  }, [selectedPropertyId, form]);

  // Auto-calculate amount for electricity and water
  useEffect(() => {
    setBillItems(prevItems => 
      prevItems.map(item => {
        if ((item.type === 'electricity' || item.type === 'water') && 
            item.units !== undefined && 
            item.rate !== undefined) {
          return {
            ...item,
            amount: item.units * item.rate
          };
        }
        return item;
      })
    );
  }, [billItems.map(item => `${item.type}-${item.units}-${item.rate}`).join(',')]);

  const addBillItem = (type: 'rent' | 'electricity' | 'water' | 'other') => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      type,
      description: type === 'rent' ? 'Room Rent' : 
                   type === 'electricity' ? 'Electricity Charges' :
                   type === 'water' ? 'Water Charges' : 'Other Charges',
      amount: 0,
      ...(type === 'electricity' && { rate: 8 }),
      ...(type === 'water' && { rate: 9, unitsDividerRoom: 4 }),
    };
    setBillItems([...billItems, newItem]);
  };

  const updateBillItem = (id: string, field: keyof BillItem, value: any) => {
    setBillItems(billItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate units if readings are provided
        if ((item.type === 'electricity' || item.type === 'water') && 
            field === 'endReading' && 
            updatedItem.startReading !== undefined) {
          const rawUnits = updatedItem.endReading - updatedItem.startReading;
          // For water, divide by unitsDividerRoom if available
          if (item.type === 'water' && updatedItem.unitsDividerRoom && updatedItem.unitsDividerRoom > 0) {
            updatedItem.units = rawUnits / updatedItem.unitsDividerRoom;
          } else {
            updatedItem.units = rawUnits;
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const removeBillItem = (id: string) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const handlePreview = () => {
    console.log('Preview button clicked');
    console.log('Bill items:', billItems);
    console.log('Selected tenant:', selectedTenant);
    console.log('Selected property:', selectedProperty);
    
    if (billItems.length === 0) {
      toast.error("Please add at least one bill item");
      return;
    }
    
    if (!selectedTenant) {
      toast.error("Please select a tenant");
      return;
    }
    
    if (!selectedProperty) {
      toast.error("Please select a property");
      return;
    }
    
    console.log('Setting showPreview to true');
    setShowPreview(true);
  };

  const handleCreateInvoice = async () => {
    if (!selectedTenant || !selectedProperty) {
      toast.error("Please select property and tenant");
      return;
    }

    setIsCreating(true);
    try {
      const totalAmount = billItems.reduce((sum, item) => sum + (parseFloat(item.amount.toString()) || 0), 0);
      const invoiceNumber = generateInvoiceNumber();

      const result = await createInvoice.mutateAsync({
        invoice_number: invoiceNumber,
        amount: totalAmount,
        due_date: form.watch("dueDate").toISOString(),
        tenant_id: selectedTenant.id,
        unit_id: selectedTenant.units?.[0]?.id,
        status: "pending"
      });

      console.log('Invoice created successfully:', result);
      toast.success(`Rent invoice ${invoiceNumber} created successfully!`);
      
      // Reset form and close dialog
      form.reset();
      setBillItems([]);
      setShowPreview(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setIsCreating(false);
    }
  };

  // Auto-fill landlord info when tenant is selected
  useEffect(() => {
    if (selectedTenant && selectedProperty) {
      // Reset tenant selection if property changes
      if (selectedTenantId && !selectedTenant.property_id.includes(selectedPropertyId)) {
        form.setValue("tenantId", "");
      }
    }
  }, [selectedProperty, selectedTenant, form]);

  if (showPreview && selectedTenant && selectedProperty) {
    console.log('Showing preview - showPreview:', showPreview);
    console.log('Selected tenant exists:', !!selectedTenant);
    console.log('Selected property exists:', !!selectedProperty);
    
    const invoiceData = {
      apartmentName: selectedProperty.name || "Property Name",
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: form.watch("invoiceDate"),
      dueDate: form.watch("dueDate"),
      landlord: {
        name: selectedProperty.name || "Landlord Name",
        phone: selectedProperty.mobile || "+91 98765 43210",
        address: selectedProperty.address || "Property Address",
      },
      tenant: {
        name: selectedTenant.name,
        mobile: selectedTenant.phone || "",
        roomNo: selectedTenant.units?.[0]?.unit_number || "101",
      },
      billItems: billItems.map(item => ({
        ...item,
        amount: parseFloat(item.amount.toString()) || 0
      }))
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50">
        <div className="h-full overflow-auto">
          <RentInvoice 
            {...invoiceData}
            billItems={billItems.map(item => ({
              ...item,
              amount: parseFloat(item.amount.toString()) || 0
            }))}
            footerMessage={footerMessage}
            hideExportButtons={true}
            onBackToEdit={() => {
              console.log('Back to Edit clicked');
              setShowPreview(false);
            }}
            onDone={handleCreateInvoice}
            isLoading={isCreating}
          />
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open && !showPreview} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto glass-card border-0">
        <DialogHeader>
          <DialogTitle>Generate Rent Invoice</DialogTitle>
          <DialogDescription>
            Create a professional rent invoice for your tenant
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form className="space-y-6">
            {/* Property Selection */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Property Name</FormLabel>
                    <Select onValueChange={(value) => {
                      console.log('Property selected:', value);
                      field.onChange(value);
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {propertiesLoading ? (
                          <SelectItem value="loading" disabled>Loading properties...</SelectItem>
                        ) : !properties || properties.length === 0 ? (
                          <SelectItem value="none" disabled>No properties found</SelectItem>
                        ) : (
                          properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tenant Selection */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Select Tenant</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!selectedProperty ? (
                          <SelectItem value="none" disabled>Select a property first</SelectItem>
                        ) : !tenants || tenants.length === 0 ? (
                          <SelectItem value="none" disabled>No tenants available</SelectItem>
                        ) : tenants.filter(tenant => tenant.property_id && tenant.property_id.includes(selectedProperty.id)).length === 0 ? (
                          <SelectItem value="none" disabled>No tenants found for this property</SelectItem>
                        ) : (
                          tenants
                            .filter(tenant => tenant.property_id && tenant.property_id.includes(selectedProperty.id))
                            .map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.name} - {tenant.units?.[0]?.unit_number || "N/A"}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Auto-filled Information Display */}
            {selectedTenant && selectedProperty && (
              <div className="space-y-4">
                <div className="glass-card p-4 rounded-lg border border-border/50">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Property Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property Name:</span>
                      <span className="font-medium">{selectedProperty.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium">{selectedProperty.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium">{selectedProperty.mobile}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-lg border border-border/50">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Tenant Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedTenant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{selectedTenant.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room No:</span>
                      <span className="font-medium">{selectedTenant.units?.[0]?.unit_number || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedTenant.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-foreground">Invoice Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-foreground">Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Footer Message</label>
              <textarea
                className="w-full px-3 py-2 border border-border/50 rounded-md bg-background text-foreground resize-none"
                rows={3}
                value={footerMessage}
                onChange={(e) => setFooterMessage(e.target.value)}
                placeholder="Enter footer message for the invoice..."
              />
              <p className="text-xs text-muted-foreground">
                This message will appear at the bottom of the invoice
              </p>
            </div>

            {/* Bill Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Bill Items</h3>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => addBillItem('rent')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Room Rent
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addBillItem('electricity')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Electricity
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addBillItem('water')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Water
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addBillItem('other')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Other
                  </Button>
                </div>
              </div>
              
              {billItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg bg-muted/20">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No bill items added yet</p>
                  <p className="text-sm">Click the buttons above to add bill items</p>
                </div>
              ) : (
                billItems.map((item, index) => (
                  <div key={item.id} className="border border-border/50 rounded-lg p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize text-foreground">
                          {item.type === 'rent' ? 'Room Rent' : 
                           item.type === 'electricity' ? 'Electricity Charges' :
                           item.type === 'water' ? 'Water Charges' : 'Other Charges'}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBillItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-foreground">Amount (₹)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-border/50 rounded-md bg-background text-foreground"
                          value={item.amount}
                          onChange={(e) => updateBillItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          disabled={item.type === 'electricity' || item.type === 'water'}
                        />
                        {(item.type === 'electricity' || item.type === 'water') && (
                          <p className="text-xs text-muted-foreground mt-1">Auto-calculated from units × rate</p>
                        )}
                      </div>
                      
                      {(item.type === 'electricity' || item.type === 'water') && (
                        <div>
                          <label className="text-sm font-medium text-foreground">Rate (₹/unit)</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-border/50 rounded-md bg-background text-foreground"
                            value={item.rate || ''}
                            onChange={(e) => updateBillItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    </div>
                    
                    {(item.type === 'electricity' || item.type === 'water') && (
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-sm font-medium text-foreground">Start Reading</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-border/50 rounded-md bg-background text-foreground"
                            value={item.startReading || ''}
                            onChange={(e) => updateBillItem(item.id, 'startReading', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">End Reading</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-border/50 rounded-md bg-background text-foreground"
                            value={item.endReading || ''}
                            onChange={(e) => updateBillItem(item.id, 'endReading', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        {item.type === 'water' && (
                          <div>
                            <label className="text-sm font-medium text-foreground">Units Divider Room</label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 border border-border/50 rounded-md bg-background text-foreground"
                              value={item.unitsDividerRoom || ''}
                              onChange={(e) => updateBillItem(item.id, 'unitsDividerRoom', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-foreground">Total Units</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-border/50 rounded-md bg-background text-foreground"
                            value={item.units || ''}
                            onChange={(e) => updateBillItem(item.id, 'units', parseInt(e.target.value) || 0)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.startReading && item.endReading ? 
                              item.type === 'water' && item.unitsDividerRoom ?
                                `Auto: ${(item.endReading - item.startReading) / item.unitsDividerRoom}` :
                                `Auto: ${item.endReading - item.startReading}` : 
                              'Enter manually or provide readings'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Add divider after water charges */}
                    {item.type === 'water' && <Separator className="mt-4" />}
                  </div>
                ))
              )}
              
              <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total Amount:</span>
                  <span className="text-lg font-bold text-primary">
                    ₹{billItems.reduce((sum, item) => sum + (parseFloat(item.amount.toString()) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handlePreview}>
                Preview Invoice
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
