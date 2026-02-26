import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get auth token and verify user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user role - must be tenant
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (roleError || !userRoles || !userRoles.some(r => r.role === 'tenant')) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Tenant role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get tenant profile from user ID
    const { data: tenantProfile, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (tenantError || !tenantProfile) {
      return new Response(
        JSON.stringify({ error: 'Tenant profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tenantId = tenantProfile.id
    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    // Route handling - TENANT VIEW ONLY ACCESS
    if (req.method === 'GET' && !action || action === 'profile') {
      // Get tenant complete profile
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_tenant_complete_profile', { _tenant_id: tenantId })

      if (profileError) {
        return new Response(
          JSON.stringify({ error: profileError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: profileData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET' && action === 'room') {
      // Get room information
      const { data: roomData, error: roomError } = await supabase
        .from('tenants')
        .select(`
          id,
          lease_start,
          lease_end,
          rent_amount,
          security_deposit,
          property_id,
          unit_id,
          properties:property_id (
            id,
            name,
            address
          ),
          units:unit_id (
            id,
            unit_number,
            floor,
            rent
          )
        `)
        .eq('id', tenantId)
        .single()

      if (roomError) {
        return new Response(
          JSON.stringify({ error: roomError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: roomData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET' && action === 'bills') {
      // Get bills with payment history
      const { data: billsData, error: billsError } = await supabase
        .rpc('get_tenant_bills_with_payments', { _tenant_id: tenantId })

      if (billsError) {
        return new Response(
          JSON.stringify({ error: billsError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: billsData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET' && action === 'payments') {
      // Get payment history
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          payment_method,
          status,
          invoices:invoice_id (
            id,
            invoice_number,
            bill_type
          )
        `)
        .eq('tenant_id', tenantId)
        .order('payment_date', { ascending: false })

      if (paymentError) {
        return new Response(
          JSON.stringify({ error: paymentError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: paymentData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET' && action === 'meter') {
      // Get electricity meter readings
      const { data: meterData, error: meterError } = await supabase
        .from('electricity_meter_readings')
        .select(`
          id,
          reading_month,
          previous_reading,
          current_reading,
          units_used,
          unit_rate,
          total_amount,
          reading_date,
          units:unit_id (
            id,
            unit_number
          )
        `)
        .eq('tenant_id', tenantId)
        .order('reading_month', { ascending: false })
        .limit(12) // Last 12 months

      if (meterError) {
        return new Response(
          JSON.stringify({ error: meterError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: meterData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Block all modification attempts for tenants
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Tenants have view-only access.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in tenant-tenant-management function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
