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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTenants } from "@/hooks/useTenants";

const assignTenantSchema = z.object({
  tenant_id: z.string().min(1, "Tenant is required"),
  lease_start: z.date({
    required_error: "Lease start date is required",
  }),
  lease_end: z.date({
    required_error: "Lease end date is required",
  }),
});

type AssignTenantFormData = z.infer<typeof assignTenantSchema>;

interface AssignTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AssignTenantFormData) => void;
  isLoading?: boolean;
  unitId?: string;
  currentTenantId?: string | null;
}

export const AssignTenantDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading, 
  unitId,
  currentTenantId 
}: AssignTenantDialogProps) => {
  const { data: tenants } = useTenants();

  const form = useForm<AssignTenantFormData>({
    resolver: zodResolver(assignTenantSchema),
    defaultValues: {
      tenant_id: currentTenantId || "",
      lease_start: new Date(),
      lease_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  const handleSubmit = (data: AssignTenantFormData) => {
    onSubmit({
      ...data,
      lease_start: data.lease_start.toISOString().split('T')[0] as any,
      lease_end: data.lease_end.toISOString().split('T')[0] as any,
    } as any);
    form.reset();
    onOpenChange(false);
  };

  // Filter out currently assigned tenant if editing
  const availableTenants = tenants?.filter(tenant => 
    !currentTenantId || tenant.id !== currentTenantId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{currentTenantId ? "Update Tenant Assignment" : "Assign Tenant"}</DialogTitle>
          <DialogDescription>
            {currentTenantId 
              ? "Update the tenant assignment and lease details for this unit."
              : "Assign a tenant to this unit and set lease terms."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTenants?.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} {tenant.email && `(${tenant.email})`}
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
              name="lease_start"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Lease Start Date</FormLabel>
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

            <FormField
              control={form.control}
              name="lease_end"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Lease End Date</FormLabel>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Assigning..." : currentTenantId ? "Update Assignment" : "Assign Tenant"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
