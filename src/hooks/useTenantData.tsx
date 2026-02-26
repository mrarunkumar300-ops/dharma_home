import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// Hook to get tenant profile data
export const useTenantProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["tenant-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("tenants_profile")
        .select(`
          *,
          user:auth.users(email)
        `)
        .eq("user_id", user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - tenant profile doesn't exist
          return null;
        }
        throw error;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: {
      full_name?: string;
      phone?: string;
      address?: string;
      date_of_birth?: string;
      gender?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("tenants_profile")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  return {
    ...profileQuery,
    updateProfile,
  };
};

// Hook to get tenant room information
export const useTenantRoom = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tenant-room", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // First get tenant profile ID
      const { data: profile } = await supabase
        .from("tenants_profile")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (!profile) return null;
      
      // Get room assignment
      const { data, error } = await supabase
        .from("tenant_rooms")
        .select(`
          *,
          properties(id, name, address),
          units(id, unit_number)
        `)
        .eq("tenant_id", profile.id)
        .eq("status", "active")
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No room assigned
        }
        throw error;
      }
      return data;
    },
    enabled: !!user?.id,
  });
};

// Hook to get tenant bills
export const useTenantBills = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tenant-bills", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get tenant profile ID
      const { data: profile } = await supabase
        .from("tenants_profile")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from("tenant_bills")
        .select("*")
        .eq("tenant_id", profile.id)
        .order("due_date", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

// Hook to get tenant family members
export const useTenantFamily = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const familyQuery = useQuery({
    queryKey: ["tenant-family", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get tenant profile ID
      const { data: profile } = await supabase
        .from("tenants_profile")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from("tenant_family_members")
        .select("*")
        .eq("tenant_id", profile.id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addFamilyMember = useMutation({
    mutationFn: async (member: {
      full_name: string;
      relationship: string;
      age?: number;
      gender?: string;
      phone?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Get tenant profile ID
      const { data: profile } = await supabase
        .from("tenants_profile")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (!profile) throw new Error("Tenant profile not found");
      
      const { data, error } = await supabase
        .from("tenant_family_members")
        .insert({
          tenant_id: profile.id,
          ...member,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-family"] });
      toast.success("Family member added successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add family member");
    },
  });

  return {
    ...familyQuery,
    addFamilyMember,
  };
};

// Hook to get tenant documents
export const useTenantDocuments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tenant-documents", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get tenant profile ID
      const { data: profile } = await supabase
        .from("tenants_profile")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from("tenant_documents")
        .select("*")
        .eq("tenant_id", profile.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

// Hook to get tenant payments
export const useTenantPayments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tenant-payments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get tenant profile ID
      const { data: profile } = await supabase
        .from("tenants_profile")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from("tenant_payment_records")
        .select(`
          *,
          payments(id, amount, payment_date, payment_method, status)
        `)
        .eq("tenant_id", profile.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

// Hook to get comprehensive dashboard data
export const useTenantDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tenant-dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .rpc("get_tenant_details" as any, { _user_id: user.id });
      
      if (error) {
        console.error("Dashboard data error:", error);
        return null;
      }
      
      return data as any; // Type assertion to handle complex return type
    },
    enabled: !!user?.id,
  });
};
