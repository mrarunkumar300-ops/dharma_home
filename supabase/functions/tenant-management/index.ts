import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
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

    // Check if user is super_admin
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (roleError || userRole?.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden - Super Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const url = new URL(req.url)
    const method = req.method
    const path = url.pathname.split("/").pop()

    switch (method) {
      case "GET":
        if (path === "statistics") {
          // Get tenant statistics
          const { data, error } = await supabase.rpc("get_tenant_statistics")
          if (error) throw error
          return new Response(
            JSON.stringify({ data }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        } else if (path === "tenants") {
          // Get all tenants with pagination
          const page = parseInt(url.searchParams.get("page") || "1")
          const limit = parseInt(url.searchParams.get("limit") || "10")
          const search = url.searchParams.get("search") || ""
          const status = url.searchParams.get("status")

          let query = supabase
            .from("tenants_profile")
            .select(`
              *,
              tenant_rooms(count),
              tenant_family_members(count),
              tenant_documents(count),
              tenant_bills(count)
            `, { count: "exact" })

          if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,tenant_code.ilike.%${search}%`)
          }

          if (status) {
            query = query.eq("status", status)
          }

          const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range((page - 1) * limit, page * limit - 1)

          if (error) throw error

          return new Response(
            JSON.stringify({ 
              data,
              pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil((count || 0) / limit)
              }
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        } else if (url.searchParams.has("id")) {
          // Get specific tenant details
          const tenantId = url.searchParams.get("id")
          const { data, error } = await supabase.rpc("get_tenant_details", { _tenant_id: tenantId })
          if (error) throw error
          return new Response(
            JSON.stringify({ data }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }
        break

      case "POST":
        if (path === "tenants") {
          // Create new tenant
          const tenantData = await req.json()
          
          const { data, error } = await supabase.rpc("create_tenant_comprehensive", {
            _user_id: tenantData.user_id,
            _full_name: tenantData.full_name,
            _email: tenantData.email,
            _phone: tenantData.phone || null,
            _address: tenantData.address || null,
            _id_proof_type: tenantData.id_proof_type || null,
            _id_proof_url: tenantData.id_proof_url || null,
            _profile_photo_url: tenantData.profile_photo_url || null,
            _date_of_birth: tenantData.date_of_birth || null,
            _gender: tenantData.gender || null,
            _emergency_contact_name: tenantData.emergency_contact_name || null,
            _emergency_contact_phone: tenantData.emergency_contact_phone || null
          })

          if (error) throw error

          return new Response(
            JSON.stringify({ data: { id: data } }),
            { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }
        break

      case "PUT":
        if (path === "tenants" && url.searchParams.has("id")) {
          // Update tenant
          const tenantId = url.searchParams.get("id")
          const updateData = await req.json()

          if (updateData.status) {
            // Update tenant status
            const { data, error } = await supabase.rpc("update_tenant_status", {
              _tenant_id: tenantId,
              _new_status: updateData.status
            })
            if (error) throw error

            return new Response(
              JSON.stringify({ data }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
          } else {
            // Update tenant details
            const { data: updateResult, error } = await supabase
              .from("tenants_profile")
              .update(updateData)
              .eq("id", tenantId)
              .select()
              .single()
            if (error) throw error

            return new Response(
              JSON.stringify({ data: updateResult }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
          }
        }
        break

      case "DELETE":
        if (path === "tenants" && url.searchParams.has("id")) {
          // Delete tenant (soft delete by setting status to inactive)
          const tenantId = url.searchParams.get("id")
          
          const { data, error } = await supabase.rpc("update_tenant_status", {
            _tenant_id: tenantId,
            _new_status: "inactive"
          })
          if (error) throw error

          return new Response(
            JSON.stringify({ message: "Tenant deactivated successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }

    return new Response(
      JSON.stringify({ error: "Endpoint not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error: any) {
    console.error("Tenant management error:", error)
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.details || null
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
