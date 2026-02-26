import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { toast } from "sonner";

export const useMaintenanceTickets = () => {
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();

  const ticketsQuery = useQuery({
    queryKey: ["maintenance_tickets", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("maintenance_tickets")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createTicket = useMutation({
    mutationFn: async (ticket: { title: string; description?: string; property_id?: string; unit_id?: string; priority?: string }) => {
      if (!orgId) throw new Error("No organization");
      
      // Convert empty strings to null for UUID columns to prevent PostgreSQL errors
      const ticketData = {
        ...ticket,
        property_id: ticket.property_id || null,
        unit_id: ticket.unit_id || null,
        organization_id: orgId
      };
      
      const { data, error } = await supabase
        .from("maintenance_tickets")
        .insert(ticketData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_tickets"] });
      toast.success("Ticket created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; priority?: string; assignee_id?: string }) => {
      // Convert empty strings to null for UUID columns to prevent PostgreSQL errors
      const updateData = {
        ...updates,
        assignee_id: updates.assignee_id || null,
      };
      
      const { data, error } = await supabase
        .from("maintenance_tickets")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_tickets"] });
      toast.success("Ticket updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTicket = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("maintenance_tickets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_tickets"] });
      toast.success("Ticket deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { ...ticketsQuery, createTicket, updateTicket, deleteTicket };
};
