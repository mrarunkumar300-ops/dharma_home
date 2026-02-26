import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { toast } from "sonner";

export const useExpenses = () => {
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ["expenses", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createExpense = useMutation({
    mutationFn: async (expense: { description: string; amount: number; property_id?: string; category?: string; expense_date?: string }) => {
      if (!orgId) throw new Error("No organization");
      
      // Convert empty strings to null for UUID columns to prevent PostgreSQL errors
      const expenseData = {
        ...expense,
        property_id: expense.property_id || null,
        organization_id: orgId
      };
      
      const { data, error } = await supabase
        .from("expenses")
        .insert(expenseData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense recorded");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { ...expensesQuery, createExpense };
};
