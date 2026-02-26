import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { toast } from "sonner";

export interface Property {
  id: string;
  name: string;
  address: string | null;
  units_count: number;
  occupied_count: number;
  status: string;
  image_emoji: string | null;
  revenue: number | null;
  created_at: string;
  organization_id: string;
  // Requested fields (mapping if they exist or using metadata if added)
  custom_id?: string;
  owner_name?: string;
  mobile?: string;
  email?: string;
  notes?: string;
}

export const useProperties = () => {
  const { orgId, ensureOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const propertiesQuery = useQuery({
    queryKey: ["properties", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Property[];
    },
    enabled: !!orgId,
  });

  const createProperty = useMutation({
    mutationFn: async (property: Partial<Property>) => {
      const currentOrgId = await ensureOrganization();

      const { data, error } = await supabase
        .from("properties")
        .insert({
          ...property,
          name: property.name!,
          units_count: property.units_count || 0,
          status: property.status || "active",
          image_emoji: property.image_emoji || "🏢",
          organization_id: currentOrgId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Property created successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateProperty = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Property> & { id: string }) => {
      const { data, error } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Property updated successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteProperty = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Property deleted successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return {
    properties: propertiesQuery.data,
    isLoading: propertiesQuery.isLoading,
    createProperty,
    updateProperty,
    deleteProperty
  };
};
