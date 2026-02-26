import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { useUserRole } from "./useUserRole";
import { toast } from "sonner";

export const useTenants = () => {
  const { orgId } = useOrganization();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();

  const tenantsQuery = useQuery({
    queryKey: ["tenants", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          *,
          security_deposit,
          units!units_tenant_id_fkey (
            id,
            unit_number,
            rent,
            properties (
              id,
              name
            )
          )
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createTenant = useMutation({
    mutationFn: async (tenant: { 
      name: string; 
      email?: string; 
      phone?: string; 
      password?: string;
      lease_start?: Date; 
      lease_end?: Date;
      status?: string;
      property_id?: string;
      unit_id?: string;
      rent_amount?: number;
      security_deposit?: number;
      agreement_document_url?: string;
      create_user_account?: boolean;
    }) => {
      if (!orgId) throw new Error("No organization");
      
      // If creating user account, use the new function
      if (tenant.create_user_account && tenant.email && tenant.password) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;
        const response = await fetch(`${supabaseUrl}/functions/v1/create-tenant-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: tenant.name,
            email: tenant.email,
            password: tenant.password,
            phone: tenant.phone,
            lease_start: tenant.lease_start,
            lease_end: tenant.lease_end,
            status: tenant.status,
            organization_id: orgId,
            property_id: tenant.property_id || null,
            unit_id: tenant.unit_id || null,
            rent_amount: tenant.rent_amount,
            security_deposit: tenant.security_deposit,
            agreement_document_url: tenant.agreement_document_url,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create tenant user');
        }
        
        const result = await response.json();
        
        // If unit is assigned, update unit availability
        if (tenant.unit_id) {
          await supabase
            .from("units")
            .update({ 
              tenant_id: result.data.id,
              availability: 'occupied'
            })
            .eq("id", tenant.unit_id);
        }
        
        return result.data;
      }
      
      // Original tenant creation (without user account)
      const { create_user_account, password, ...cleanTenant } = tenant;
      const tenantData = {
        ...cleanTenant,
        lease_start: tenant.lease_start?.toISOString().split('T')[0],
        lease_end: tenant.lease_end?.toISOString().split('T')[0],
        organization_id: orgId
      };
      
      const { data, error } = await supabase
        .from("tenants")
        .insert(tenantData)
        .select()
        .single();
      if (error) throw error;
      
      // If unit is assigned, update unit availability
      if (tenant.unit_id) {
        await supabase
          .from("units")
          .update({ 
            tenant_id: data.id,
            availability: 'occupied'
          })
          .eq("id", tenant.unit_id);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Tenant created successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateTenant = useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: { 
      id: string; 
      name?: string; 
      email?: string; 
      phone?: string; 
      status?: string;
      lease_start?: Date;
      lease_end?: Date;
      property_id?: string;
      unit_id?: string;
      rent_amount?: number;
      security_deposit?: number;
      agreement_document_url?: string;
      create_user_account?: boolean;
    }) => {
      // Filter out undefined values and convert empty strings to null for UUID columns
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      // Convert empty strings to null for UUID columns to prevent PostgreSQL errors
      if (filteredUpdates.property_id === '') filteredUpdates.property_id = null;
      if (filteredUpdates.unit_id === '') filteredUpdates.unit_id = null;
      if (filteredUpdates.email === '') filteredUpdates.email = null;
      if (filteredUpdates.phone === '') filteredUpdates.phone = null;
      
      // Get current tenant data to check for unit changes
      const { data: currentTenant } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", id)
        .single();
      
      const updateData = {
        ...filteredUpdates,
        lease_start: (filteredUpdates.lease_start as Date)?.toISOString().split('T')[0],
        lease_end: (filteredUpdates.lease_end as Date)?.toISOString().split('T')[0],
      };
      
      const { data, error } = await supabase
        .from("tenants")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      
      // Handle unit assignment changes
      const oldUnitId = currentTenant?.unit_id;
      const newUnitId = filteredUpdates.unit_id;
      
      if (oldUnitId !== newUnitId) {
        // Free up old unit
        if (oldUnitId) {
          await supabase
            .from("units")
            .update({ 
              tenant_id: null,
              availability: 'available'
            })
            .eq("id", oldUnitId);
        }
        
        // Assign new unit
        if (newUnitId) {
          await supabase
            .from("units")
            .update({ 
              tenant_id: id,
              availability: 'occupied'
            })
            .eq("id", String(newUnitId));
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Tenant updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTenant = useMutation({
    mutationFn: async (id: string) => {
      console.log("Attempting to delete tenant with ID:", id);
      
      // Check if user has admin role
      if (!isAdmin) {
        throw new Error("Only administrators can delete tenants. Please contact your admin for assistance.");
      }
      
      // First, check if tenant exists
      const { data: tenant, error: checkError } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("id", id)
        .single();
      
      if (checkError) {
        console.error("Error checking tenant existence:", checkError);
        throw new Error(`Tenant not found: ${checkError.message}`);
      }
      
      console.log("Found tenant to delete:", tenant);
      
      // Attempt to delete
      const { error } = await supabase.from("tenants").delete().eq("id", id);
      
      if (error) {
        console.error("Delete error:", error);
        
        // Check if it's a permission error
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          throw new Error("You don't have permission to delete tenants. Only administrators can delete tenants.");
        }
        
        throw new Error(`Failed to delete tenant: ${error.message}`);
      }
      
      console.log("Successfully deleted tenant");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant deleted successfully");
    },
    onError: (err: any) => {
      console.error("Delete tenant error:", err);
      toast.error(err.message || "Failed to delete tenant");
    },
  });

  return { ...tenantsQuery, createTenant, updateTenant, deleteTenant, isAdmin };
};
