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
    const email = Deno.env.get("SUPER_ADMIN_EMAIL")!;
    const password = Deno.env.get("SUPER_ADMIN_PASSWORD")!;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD secrets must be set" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create the user via admin API
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Super Admin", role: "super_admin" },
    });

    if (createError) {
      // If user already exists, try to find them
      if (createError.message?.includes("already been registered")) {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users?.find((u) => u.email === email);
        if (!existingUser) throw new Error("User exists but could not be found");

        // Ensure super_admin role exists
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert({ user_id: existingUser.id, role: "super_admin" }, { onConflict: "user_id,role" });

        // Ensure profile exists
        await supabase
          .from("profiles")
          .upsert({ id: existingUser.id, email, full_name: "Super Admin" }, { onConflict: "id" });

        return new Response(
          JSON.stringify({ success: true, message: "Super Admin role assigned to existing user", userId: existingUser.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createError;
    }

    const userId = userData.user.id;

    // Create profile
    await supabase
      .from("profiles")
      .upsert({ id: userId, email, full_name: "Super Admin" }, { onConflict: "id" });

    // Assign super_admin role
    await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "super_admin" });

    return new Response(
      JSON.stringify({ success: true, message: "Super Admin created successfully", userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
