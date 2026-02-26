import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useTenantProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tenant-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        // First try tenants_profile
        const { data: profile, error: profileError } = await supabase
          .from('tenants_profile')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error("Profile error:", profileError);
        }

        // If no tenants_profile, try to find via tenants table by matching email
        if (!profile) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('email, organization_id')
            .eq('id', user.id)
            .maybeSingle();

          if (!userProfile?.email) return null;

          // Find tenant record by email
          const { data: tenantRecord } = await supabase
            .from('tenants')
            .select('*')
            .eq('email', userProfile.email)
            .maybeSingle();

          if (!tenantRecord) return null;

          // Get invoices directly as bills (since tenant_bills may not exist)
          const { data: invoices } = await supabase
            .from('invoices')
            .select('*')
            .eq('tenant_id', tenantRecord.id)
            .order('due_date', { ascending: false });

          // Map invoices to bill-like structure
          const bills = (invoices || []).map(inv => ({
            id: inv.id,
            tenant_id: tenantRecord.id,
            bill_type: 'Invoice',
            bill_number: inv.invoice_number,
            amount: inv.amount,
            bill_period_start: inv.issue_date,
            bill_period_end: inv.due_date,
            due_date: inv.due_date,
            status: inv.status,
            created_at: inv.created_at,
            updated_at: inv.updated_at,
            payment_id: null,
            bill_document_url: null,
          }));

          return {
            profile: {
              id: tenantRecord.id,
              user_id: user.id,
              tenant_code: 'N/A',
              full_name: tenantRecord.name,
              email: tenantRecord.email || '',
              phone: tenantRecord.phone,
              address: null,
              id_proof_type: null,
              id_proof_url: null,
              profile_photo_url: null,
              date_of_birth: null,
              gender: null,
              emergency_contact_name: null,
              emergency_contact_phone: null,
              status: tenantRecord.status,
              created_at: tenantRecord.created_at,
              updated_at: tenantRecord.updated_at,
            } as any,
            room: null,
            family_members: [],
            documents: [],
            bills,
          };
        }

        // Get room assignment
        const { data: room } = await supabase
          .from('tenant_rooms')
          .select(`
            *,
            properties(id, name, address),
            units(id, unit_number)
          `)
          .eq('tenant_id', profile.id)
          .eq('status', 'active')
          .maybeSingle();

        // Get family members
        const { data: familyMembers } = await supabase
          .from('tenant_family_members')
          .select('*')
          .eq('tenant_id', profile.id);

        // Get documents
        const { data: documents } = await supabase
          .from('tenant_documents')
          .select('*')
          .eq('tenant_id', profile.id);

        // Get bills from tenant_bills
        const { data: bills } = await supabase
          .from('tenant_bills')
          .select('*')
          .eq('tenant_id', profile.id)
          .order('due_date', { ascending: false });

        // If no tenant_bills found, fallback to invoices via tenant_record_id
        let finalBills = bills || [];
        if (finalBills.length === 0 && (profile as any).tenant_record_id) {
          const { data: invoices } = await supabase
            .from('invoices')
            .select('*')
            .eq('tenant_id', (profile as any).tenant_record_id)
            .order('due_date', { ascending: false });

          finalBills = (invoices || []).map(inv => ({
            id: inv.id,
            tenant_id: profile.id,
            bill_type: 'Invoice',
            bill_number: inv.invoice_number,
            amount: inv.amount,
            bill_period_start: inv.issue_date,
            bill_period_end: inv.due_date,
            due_date: inv.due_date,
            status: inv.status,
            created_at: inv.created_at,
            updated_at: inv.updated_at,
            payment_id: null,
            bill_document_url: null,
          }));
        }

        return {
          profile,
          room,
          family_members: familyMembers || [],
          documents: documents || [],
          bills: finalBills,
        };
      } catch (error) {
        console.error("Dashboard data error:", error);
        return null;
      }
    },
    enabled: !!user?.id,
  });
};
