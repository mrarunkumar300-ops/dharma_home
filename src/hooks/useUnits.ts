import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Unit {
    id: string;
    property_id: string;
    unit_number: string;
    rent: number;
    availability: string;
    tenant_id: string | null;
    room_type: "Single" | "Double" | "1BHK" | "2BHK";
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
    properties?: {
        name: string;
        custom_id?: string;
    };
    tenants?: {
        name: string;
    };
}

export const useUnits = (propertyId?: string) => {
    const queryClient = useQueryClient();

    const unitsQuery = useQuery({
        queryKey: ["units", propertyId],
        queryFn: async () => {
            let query = supabase
                .from("units")
                .select(`
          *,
          properties (name, image_emoji),
          tenants!units_tenant_id_fkey (name)
        `)
                .order("unit_number", { ascending: true });

            if (propertyId && propertyId !== "all") {
                query = query.eq("property_id", propertyId);
            }

            const { data, error } = await query;
            console.log("[useUnits] Query result:", { data, error, propertyId });
            if (error) {
                console.error("[useUnits] Query error:", error);
                throw error;
            }
            return data as unknown as Unit[];
        },
        refetchOnMount: "always",
        staleTime: 0,
    });

    const createUnit = useMutation({
        mutationFn: async (unit: Partial<Unit>) => {
            const { data, error } = await supabase
                .from("units")
                .insert({
                    property_id: unit.property_id!,
                    unit_number: unit.unit_number!,
                    rent: unit.rent || 0,
                    availability: unit.availability || "vacant",
                    room_type: unit.room_type || null,
                    status: unit.status || "active",
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["units"] });
            await queryClient.invalidateQueries({ queryKey: ["properties"] });
            toast.success("Unit created successfully");
        },
        onError: (err: any) => toast.error(err.message),
    });

    const updateUnit = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Unit> & { id: string }) => {
            // Convert empty strings to null for UUID columns to prevent PostgreSQL errors
            const updateData = {
                ...updates,
                property_id: updates.property_id || null,
                tenant_id: updates.tenant_id || null,
            };
            
            const { data, error } = await supabase
                .from("units")
                .update(updateData)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            toast.success("Unit updated successfully");
        },
        onError: (err: any) => toast.error(err.message),
    });

    const deleteUnit = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("units").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            toast.success("Unit deleted successfully");
        },
        onError: (err: any) => toast.error(err.message),
    });

    const assignTenant = useMutation({
        mutationFn: async ({ 
            unitId, 
            tenantId, 
            leaseStart, 
            leaseEnd 
        }: { 
            unitId: string; 
            tenantId: string; 
            leaseStart: string; 
            leaseEnd: string; 
        }) => {
            // Update unit with tenant
            const { data: unitData, error: unitError } = await supabase
                .from("units")
                .update({ 
                    tenant_id: tenantId,
                    availability: 'occupied'
                })
                .eq("id", unitId)
                .select()
                .single();
            
            if (unitError) throw unitError;

            // Update tenant with lease dates
            const { data: tenantData, error: tenantError } = await supabase
                .from("tenants")
                .update({ 
                    lease_start: leaseStart,
                    lease_end: leaseEnd,
                    status: 'active'
                })
                .eq("id", tenantId)
                .select()
                .single();
            
            if (tenantError) throw tenantError;

            return { unitData, tenantData };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            queryClient.invalidateQueries({ queryKey: ["tenants"] });
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            toast.success("Tenant assigned successfully");
        },
        onError: (err: any) => toast.error(err.message),
    });

    const unassignTenant = useMutation({
        mutationFn: async ({ unitId, tenantId }: { unitId: string; tenantId: string }) => {
            // Update unit to remove tenant
            const { data: unitData, error: unitError } = await supabase
                .from("units")
                .update({ 
                    tenant_id: null,
                    availability: 'vacant'
                })
                .eq("id", unitId)
                .select()
                .single();
            
            if (unitError) throw unitError;

            // Update tenant status
            const { data: tenantData, error: tenantError } = await supabase
                .from("tenants")
                .update({ 
                    status: 'inactive'
                })
                .eq("id", tenantId)
                .select()
                .single();
            
            if (tenantError) throw tenantError;

            return { unitData, tenantData };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            queryClient.invalidateQueries({ queryKey: ["tenants"] });
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            toast.success("Tenant unassigned successfully");
        },
        onError: (err: any) => toast.error(err.message),
    });

    return {
        units: unitsQuery.data,
        isLoading: unitsQuery.isLoading,
        createUnit,
        updateUnit,
        deleteUnit,
        assignTenant,
        unassignTenant
    };
};
