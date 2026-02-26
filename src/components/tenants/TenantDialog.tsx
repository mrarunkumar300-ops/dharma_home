import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/hooks/useCurrency";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, User, Key, Home, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useProperties } from "@/hooks/useProperties";
import { useUnits } from "@/hooks/useUnits";
import { Badge } from "@/components/ui/badge";

const tenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
  lease_start: z.date().optional(),
  lease_end: z.date().optional(),
  status: z.enum(["active", "inactive", "expiring"]).default("active"),
  property_id: z.string().optional(),
  unit_id: z.string().optional(),
  rent_amount: z.number().optional(),
  security_deposit: z.number().optional(),
  create_user_account: z.boolean().default(false),
}).refine((data) => {
  if (data.create_user_account && (!data.email || !data.email.includes("@"))) return false;
  return true;
}, { message: "Valid email is required when creating a user account", path: ["email"] })
.refine((data) => {
  if (data.create_user_account && (!data.password || data.password.length < 6)) return false;
  return true;
}, { message: "Password (min 6 chars) is required for user account", path: ["password"] })
.refine((data) => {
  if (data.unit_id && !data.property_id) return false;
  return true;
}, { message: "Property must be selected when assigning a unit", path: ["property_id"] })
.refine((data) => {
  if (data.lease_start && data.lease_end && data.lease_end <= data.lease_start) {
    return false;
  }
  return true;
}, { message: "Lease end date must be after start date", path: ["lease_end"] });

type TenantFormData = z.infer<typeof tenantSchema>;

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: any;
  onSubmit: (data: TenantFormData) => Promise<any>;
}

export const TenantDialog = ({ open, onOpenChange, tenant, onSubmit }: TenantDialogProps) => {
  const { formatAmount } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { properties } = useProperties();
  const { units } = useUnits();
  
  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      status: "active",
      create_user_account: false,
    },
  });
  
  const selectedPropertyId = form.watch("property_id");
  const selectedUnitId = form.watch("unit_id");
  
  // Filter units based on selected property and availability
  const filteredUnits = units?.filter(unit => {
    const matchesProperty = unit.property_id === selectedPropertyId;
    const isAvailable = unit.availability === 'available' || unit.availability === 'vacant';
    return matchesProperty && (isAvailable || unit.id === selectedUnitId);
  }) || [];
  
  // Get selected unit details
  const selectedUnit = units?.find(unit => unit.id === selectedUnitId);
  
  // Status configurations with emoji icons
  const statusOptions = [
    { value: "active", label: "Active", icon: "✅", color: "text-green-600" },
    { value: "inactive", label: "Inactive", icon: "⏸️", color: "text-yellow-600" },
    { value: "expiring", label: "Expiring", icon: "⚠️", color: "text-orange-600" },
  ];

  useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name || "",
        email: tenant.email || "",
        phone: tenant.phone || "",
        lease_start: tenant.lease_start ? new Date(tenant.lease_start) : undefined,
        lease_end: tenant.lease_end ? new Date(tenant.lease_end) : undefined,
        status: tenant.status || "active",
        property_id: tenant.property_id || "",
        unit_id: tenant.unit_id || "",
        rent_amount: tenant.rent_amount || undefined,
        security_deposit: tenant.security_deposit || undefined,
        create_user_account: false,
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        password: "",
        status: "active",
        create_user_account: false,
      });
    }
  }, [tenant, form]);

  const handleSubmit = async (data: TenantFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting tenant:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tenant ? "Edit Tenant" : "Add New Tenant"}</DialogTitle>
          <DialogDescription>
            {tenant ? "Update the tenant information below." : "Fill in the tenant details to add a new tenant."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* User Account Creation Section */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="create_user_account"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Create User Account</FormLabel>
                      <FormDescription>
                        Create a login account for this tenant to access their dashboard
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("create_user_account") && (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="tenant@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password for tenant account" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            {/* Property and Unit Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="property_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Property *
                    </FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Reset unit when property changes
                      form.setValue("unit_id", "");
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property first" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties?.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4" />
                              {property.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Unit {selectedPropertyId ? "*" : "(select property first)"}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedPropertyId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedPropertyId ? "Select unit" : "Select property first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredUnits.length === 0 && selectedPropertyId ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No available units for this property
                          </div>
                        ) : (
                          filteredUnits?.map((unit) => {
                            const isOccupied = unit.availability === 'occupied';
                            return (
                              <SelectItem key={unit.id} value={unit.id} disabled={isOccupied && unit.id !== selectedUnitId}>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4" />
                                    <span>{unit.unit_number}</span>
                                    {isOccupied && (
                                      <Badge variant="destructive" className="text-xs">
                                        Occupied
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      {formatAmount(unit.rent)}/mo
                                    </span>
                                    {unit.availability === 'available' && (
                                      <Badge variant="secondary" className="text-xs">
                                        Available
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch("unit_id") && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rent_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rent Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1200" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          {selectedUnit && `Default: ${formatAmount(selectedUnit.rent)}/mo`}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="security_deposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="2400" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Typically 2x rent amount
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lease_start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Lease Start</FormLabel>
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
                name="lease_end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Lease End</FormLabel>
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
                            date < new Date("1900-01-01")
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Status
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{option.icon}</span>
                            <span className={option.color}>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : tenant ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
