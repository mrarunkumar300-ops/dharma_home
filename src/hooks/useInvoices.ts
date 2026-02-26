import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { toast } from "sonner";

export const useInvoices = () => {
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ["invoices", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: { 
      invoice_number: string; 
      amount: number; 
      due_date: string; 
      tenant_id?: string; 
      unit_id?: string; 
      status?: string;
    }) => {
      if (!orgId) throw new Error("No organization");
      
      // Create main invoice with only confirmed existing columns
      const { data, error } = await supabase
        .from("invoices")
        .insert({ 
          invoice_number: invoice.invoice_number,
          amount: invoice.amount,
          due_date: invoice.due_date,
          tenant_id: invoice.tenant_id,
          unit_id: invoice.unit_id,
          status: invoice.status || 'pending',
          organization_id: orgId
        })
        .select()
        .single();
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
      toast.success("Invoice created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; invoice_number?: string; amount?: number; due_date?: string; status?: string; tenant_id?: string; unit_id?: string }) => {
      // Update the main invoice with only existing columns
      const updateData: any = {};
      if (updates.invoice_number) updateData.invoice_number = updates.invoice_number;
      if (updates.amount) updateData.amount = updates.amount;
      if (updates.due_date) updateData.due_date = updates.due_date;
      if (updates.status) updateData.status = updates.status;
      if (updates.tenant_id) updateData.tenant_id = updates.tenant_id;
      if (updates.unit_id) updateData.unit_id = updates.unit_id;
      
      const { data, error } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
      toast.success("Invoice updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-profile"] }); // Also refresh tenant data
      toast.success("Invoice deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getInvoiceById = async (id: string) => {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        tenant:tenants(id, name, email, phone),
        unit:units(id, unit_number, rent, property:properties(id, name))
      `)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  };

  const getInvoiceStats = async () => {
    if (!orgId) return null;
    const { data, error } = await supabase
      .from("invoices")
      .select("status, amount, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthInvoices = data?.filter(inv => {
      const invDate = new Date(inv.created_at);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    }) || [];
    
    const previousMonthInvoices = data?.filter(inv => {
      const invDate = new Date(inv.created_at);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return invDate.getMonth() === prevMonth && invDate.getFullYear() === prevYear;
    }) || [];
    
    const currentMonthTotal = currentMonthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const previousMonthTotal = previousMonthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    
    const stats = {
      total: data?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0,
      paid: data?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0) || 0,
      overdue: data?.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + Number(inv.amount), 0) || 0,
      pending: data?.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + Number(inv.amount), 0) || 0,
      monthlyChange: previousMonthTotal > 0 ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0,
      paidPercentage: data && data.length > 0 ? (data.filter(inv => inv.status === 'paid').length / data.length) * 100 : 0,
    };
    return stats;
  };

  return { 
    ...invoicesQuery, 
    createInvoice, 
    updateInvoice, 
    deleteInvoice,
    getInvoiceById,
    getInvoiceStats
  };
};
