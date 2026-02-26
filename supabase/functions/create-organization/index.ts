import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check super_admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Super Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { org_name, plan_price, plan_valid_until, admin_email, admin_password, admin_full_name } = await req.json();

    if (!org_name) {
      return new Response(JSON.stringify({ error: "org_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Create organization
    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .insert({
        name: org_name,
        plan_price: plan_price || 0,
        plan_valid_until: plan_valid_until || null,
        status: "active",
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Step 2: Create org admin user if credentials provided
    let adminUserId = null;
    if (admin_email && admin_password) {
      const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
        email: admin_email,
        password: admin_password,
        email_confirm: true,
        user_metadata: { full_name: admin_full_name || "", role: "admin" },
      });

      if (createError) throw createError;

      adminUserId = userData.user.id;

      // Link profile to organization
      await adminClient
        .from("profiles")
        .upsert({
          id: adminUserId,
          email: admin_email,
          full_name: admin_full_name || "",
          organization_id: org.id,
        }, { onConflict: "id" });

      // Assign admin role
      await adminClient
        .from("user_roles")
        .upsert({ user_id: adminUserId, role: "admin" }, { onConflict: "user_id,role" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: admin_email ? "Organization and Admin created successfully" : "Organization created successfully",
        organizationId: org.id,
        adminUserId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
