import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useOrganization = () => {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  const setupOrganization = async (name: string) => {
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name })
      .select()
      .single();

    if (orgError) throw orgError;

    // Link profile to org
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("id", profile!.id);

    if (profileError) throw profileError;

    // Assign admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: profile!.id, role: "admin" as any });

    if (roleError) throw roleError;

    return org;
  };

  const ensureOrganization = async () => {
    if (orgId) return orgId;

    // Check directly in case of stale cache
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id) return profile.organization_id;

    // Auto-setup a default organization if none exists
    const defaultOrg = await setupOrganization(`${user.email?.split("@")[0]}'s Workspace`);
    return defaultOrg.id;
  };

  return { orgId, setupOrganization, ensureOrganization };
};
