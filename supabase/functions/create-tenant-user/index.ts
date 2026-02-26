import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user from their JWT
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Check if user is admin or super_admin
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (roleError || !userRole || !['admin', 'super_admin'].includes(userRole.role)) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const tenantData = await req.json()
    const { name, email, password, phone, lease_start, lease_end, status, organization_id, property_id, unit_id, rent_amount } = tenantData

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Name, email, and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get organization_id if not provided
    let orgId = organization_id
    if (!orgId && userRole.role === 'admin') {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single()
      orgId = profile?.organization_id
    }

    if (!orgId) {
      return new Response(
        JSON.stringify({ error: "Organization ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 1. Create auth user using admin API
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (createUserError || !newUser?.user) {
      console.error("Auth user creation error:", createUserError)
      return new Response(
        JSON.stringify({ error: createUserError?.message || "Failed to create auth user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const newUserId = newUser.user.id

    // 2. Assign tenant role
    const { error: roleInsertError } = await supabase
      .from("user_roles")
      .insert({ user_id: newUserId, role: "tenant" })

    if (roleInsertError) {
      console.error("Role assignment error:", roleInsertError)
      // Cleanup auth user on failure
      await supabase.auth.admin.deleteUser(newUserId)
      return new Response(
        JSON.stringify({ error: "Failed to assign tenant role: " + roleInsertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 3. Create tenant record in tenants table (for admin management)
    const { data: tenantRecord, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name,
        email,
        phone: phone || null,
        lease_start: lease_start || null,
        lease_end: lease_end || null,
        status: status || "active",
        organization_id: orgId,
      })
      .select()
      .single()

    if (tenantError) {
      console.error("Tenant record creation error:", tenantError)
      await supabase.auth.admin.deleteUser(newUserId)
      return new Response(
        JSON.stringify({ error: tenantError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 4. Create tenants_profile record (for tenant dashboard/portal)
    const tenantCode = "TEN" + Date.now().toString().slice(-8)
    const { data: tenantProfile, error: profileCreateError } = await supabase
      .from("tenants_profile")
      .insert({
        user_id: newUserId,
        tenant_code: tenantCode,
        full_name: name,
        email,
        phone: phone || null,
        status: status || "active",
        tenant_record_id: tenantRecord.id,
      } as any)
      .select()
      .single()

    if (profileCreateError) {
      console.error("Tenant profile creation error:", profileCreateError)
      // Don't rollback entirely - the tenant and auth user exist, just log
    }

    // 5. Assign unit and create room if provided
    if (unit_id && tenantRecord) {
      // Update unit with tenant_id
      const { error: unitError } = await supabase
        .from("units")
        .update({ tenant_id: tenantRecord.id })
        .eq("id", unit_id)

      if (unitError) {
        console.error("Unit assignment error:", unitError)
      }

      // Create tenant_rooms record if we have a profile and property
      if (tenantProfile && property_id) {
        // Get unit details for room number
        const { data: unitData } = await supabase
          .from("units")
          .select("unit_number, rent")
          .eq("id", unit_id)
          .single()

        const { error: roomError } = await supabase
          .from("tenant_rooms")
          .insert({
            tenant_id: tenantProfile.id,
            property_id,
            unit_id,
            room_number: unitData?.unit_number || "N/A",
            rent_amount: rent_amount || unitData?.rent || 0,
            agreement_start_date: lease_start || new Date().toISOString().split('T')[0],
            agreement_end_date: lease_end || null,
            status: "active",
          })

        if (roomError) {
          console.error("Room assignment error:", roomError)
        }
      }
    }

    // 6. Update profile with organization_id
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ organization_id: orgId })
      .eq("id", newUserId)

    if (profileError) {
      console.error("Profile update error:", profileError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tenant user created successfully",
        data: tenantRecord,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    console.error("Create tenant user error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
