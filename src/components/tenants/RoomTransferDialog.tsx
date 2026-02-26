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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Home, ArrowRight, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useProperties } from "@/hooks/useProperties";
import { useUnits } from "@/hooks/useUnits";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const roomTransferSchema = z.object({
  new_property_id: z.string().min(1, "Property is required"),
  new_unit_id: z.string().min(1, "Unit is required"),
  transfer_date: z.date().min(new Date(), "Transfer date cannot be in the past"),
  new_rent_amount: z.number().min(0, "Rent amount must be positive"),
  reason: z.string().min(1, "Reason is required"),
}).refine((data) => {
  // Additional validation can be added here
  return true;
});

type RoomTransferFormData = z.infer<typeof roomTransferSchema>;

interface RoomTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: any;
  onSubmit: (data: RoomTransferFormData) => Promise<any>;
}

export const RoomTransferDialog = ({ open, onOpenChange, tenant, onSubmit }: RoomTransferDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { properties } = useProperties();
  const { units } = useUnits();
  
  const form = useForm<RoomTransferFormData>({
    resolver: zodResolver(roomTransferSchema),
    defaultValues: {
      new_property_id: "",
      new_unit_id: "",
      transfer_date: new Date(),
      new_rent_amount: 0,
      reason: "",
    },
  });
  
  // Early return if tenant is null (after all hooks are declared)
  if (!tenant) return null;
  
  const selectedPropertyId = form.watch("new_property_id");
  const selectedUnitId = form.watch("new_unit_id");
  
  // Filter units based on selected property and availability
  const availableUnits = (units || []).filter(unit => {
    const matchesProperty = unit.property_id === selectedPropertyId;
    const isAvailable = unit.availability === 'available' || unit.availability === 'vacant';
    const isNotCurrentUnit = tenant?.unit_id ? unit.id !== tenant.unit_id : true;
    return matchesProperty && isAvailable && isNotCurrentUnit;
  });
  
  // Get selected unit details
  const selectedUnit = (units || []).find(unit => unit.id === selectedUnitId);
  
  // Get current unit details
  const currentUnit = tenant?.unit_id ? (units || []).find(unit => unit.id === tenant.unit_id) : null;

  useEffect(() => {
    if (open && tenant) {
      form.reset({
        new_property_id: "",
        new_unit_id: "",
        transfer_date: new Date(),
        new_rent_amount: currentUnit?.rent || 0,
        reason: "",
      });
    }
  }, [open, tenant, form]);

  const handleSubmit = async (data: RoomTransferFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error transferring room:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Transfer Room for {tenant?.name || 'Tenant'}
          </DialogTitle>
          <DialogDescription>
            Move this tenant to a different room. The current room will be marked as available.
          </DialogDescription>
        </DialogHeader>
        
        {currentUnit && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Assignment:</strong> {currentUnit.unit_number} at {currentUnit.properties?.name} (${currentUnit.rent}/month)
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="new_property_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      New Property *
                    </FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Reset unit when property changes
                      form.setValue("new_unit_id", "");
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(properties || []).map((property) => (
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
                name="new_unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      New Unit {selectedPropertyId ? "*" : "(select property first)"}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedPropertyId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedPropertyId ? "Select available unit" : "Select property first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUnits.length === 0 && selectedPropertyId ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No available units for this property
                          </div>
                        ) : (
                          availableUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Home className="w-4 h-4" />
                                  <span>{unit.unit_number}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    ${unit.rent}/mo
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    Available
                                  </Badge>
                                </div>
                              </div>
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

            {selectedUnit && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Selected Unit:</span>
                  <Badge variant="outline">{selectedUnit.unit_number}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Default rent: ${selectedUnit.rent}/month
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="new_rent_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Rent Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1200" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {selectedUnit && `Default: $${selectedUnit.rent}/mo`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transfer_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Transfer Date</FormLabel>
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

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Transfer</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Upgrade, Maintenance request, etc." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Explain why this tenant is being transferred to a different room
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedUnitId}>
                {isSubmitting ? "Transferring..." : "Transfer Room"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
