import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { toast } from "sonner";

export const usePayments = () => {
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ["payments", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createPayment = useMutation({
    mutationFn: async (payment: { 
      amount: number; 
      invoice_id?: string; 
      payment_method?: string;
      payment_date?: string;
      tenant_id?: string;
      description?: string;
      payment_type?: string;
    }) => {
      if (!orgId) throw new Error("No organization");
      
      // Only send columns that exist on the payments table
      const paymentInsert: any = {
        amount: payment.amount,
        organization_id: orgId,
        payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
        payment_method: payment.payment_method || null,
        invoice_id: payment.invoice_id || null,
        status: 'completed',
      };

      const { data, error } = await supabase
        .from("payments")
        .insert(paymentInsert)
        .select()
        .single();
      if (error) throw error;
      
      // Create tenant payment record if tenant_id is provided
      if (payment.tenant_id && data) {
        // Find the tenant_profile id for this tenant
        const { data: tenantProfile } = await supabase
          .from("tenants_profile")
          .select("id")
          .filter("tenant_record_id" as any, "eq", payment.tenant_id)
          .limit(1) as any;

        const profileId = tenantProfile?.[0]?.id || payment.tenant_id;

        const { error: recordError } = await supabase
          .from("tenant_payment_records")
          .insert({
            tenant_id: profileId,
            payment_id: data.id,
            payment_type: payment.payment_type || "Rent",
            description: payment.description || `Payment via ${payment.payment_method || 'Manual'}`,
          });
        
        if (recordError) {
          console.error("Failed to create tenant payment record:", recordError);
        }
      }

      // If linked to an invoice, update invoice status to paid
      if (payment.invoice_id) {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("amount")
          .eq("id", payment.invoice_id)
          .maybeSingle();

        if (invoice) {
          // Get total payments for this invoice
          const { data: existingPayments } = await supabase
            .from("payments")
            .select("amount")
            .eq("invoice_id", payment.invoice_id);

          const totalPaid = (existingPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

          const newStatus = totalPaid >= Number(invoice.amount) ? 'paid' : 'pending';
          
          await supabase
            .from("invoices")
            .update({ 
              status: newStatus,
              payment_date: newStatus === 'paid' ? payment.payment_date || new Date().toISOString().split('T')[0] : null,
              payment_method: payment.payment_method || null,
            })
            .eq("id", payment.invoice_id);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-payment-records"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      toast.success("Payment recorded successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; amount?: number; payment_method?: string; payment_date?: string; status?: string; invoice_id?: string }) => {
      const { data, error } = await supabase
        .from("payments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      toast.success("Payment updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      toast.success("Payment deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getPaymentById = async (id: string) => {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        invoice:invoices(id, invoice_number, amount, status, tenant:tenants(id, name))
      `)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

  const getPaymentStats = async () => {
    if (!orgId) return null;
    const { data, error } = await supabase
      .from("payments")
      .select("amount, payment_date, payment_method, status")
      .eq("organization_id", orgId);
    if (error) throw error;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Also get invoice stats for pending/due amounts
    const { data: invoiceData } = await supabase
      .from("invoices")
      .select("amount, status, due_date")
      .eq("organization_id", orgId);

    const totalPaid = data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const thisMonthPaid = data?.filter(p => {
      const date = new Date(p.payment_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const totalInvoiced = invoiceData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
    const pendingAmount = invoiceData?.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
    const overdueAmount = invoiceData?.filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
    const paidInvoiceAmount = invoiceData?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;

    const stats = {
      total: totalPaid,
      thisMonth: thisMonthPaid,
      count: data?.length || 0,
      average: data && data.length > 0 ? totalPaid / data.length : 0,
      methods: data?.reduce((acc, payment) => {
        const method = payment.payment_method || 'Unknown';
        acc[method] = (acc[method] || 0) + Number(payment.amount);
        return acc;
      }, {} as Record<string, number>) || {},
      // Invoice-based stats
      totalInvoiced,
      pendingAmount,
      overdueAmount,
      paidInvoiceAmount,
      dueAmount: pendingAmount + overdueAmount,
    };
    return stats;
  };

  return { 
    ...paymentsQuery, 
    createPayment, 
    updatePayment, 
    deletePayment,
    getPaymentById,
    getPaymentStats
  };
};
