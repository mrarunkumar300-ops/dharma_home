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

    // Check user role - must be admin or super_admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (roleError || !userRoles || !userRoles.some(r => ['admin', 'super_admin'].includes(r.role))) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'User not associated with an organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const tenantId = pathParts[pathParts.length - 2] // Get tenant ID from URL
    const action = pathParts[pathParts.length - 1] // Get action from URL

    // Route handling
    if (req.method === 'GET' && tenantId && !action) {
      // Get complete tenant profile
      const { data: tenantData, error: tenantError } = await supabase
        .rpc('get_tenant_complete_profile', { _tenant_id: tenantId })

      if (tenantError) {
        return new Response(
          JSON.stringify({ error: tenantError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: tenantData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET' && tenantId && action === 'bills') {
      // Get tenant bills with payments
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

    if (req.method === 'POST' && tenantId && action === 'family') {
      // Add family member
      const body = await req.json()
      
      const { data: familyData, error: familyError } = await supabase
        .from('tenant_family_members')
        .insert({
          tenant_id: tenantId,
          name: body.name,
          relation: body.relation,
          mobile_number: body.mobile_number,
          date_of_birth: body.date_of_birth,
          occupation: body.occupation,
          is_emergency_contact: body.is_emergency_contact || false
        })
        .select()
        .single()

      if (familyError) {
        return new Response(
          JSON.stringify({ error: familyError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: familyData }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST' && tenantId && action === 'documents') {
      // Add document
      const body = await req.json()
      
      const { data: docData, error: docError } = await supabase
        .from('tenant_documents')
        .insert({
          tenant_id: tenantId,
          document_type: body.document_type,
          document_number: body.document_number,
          document_name: body.document_name,
          file_url: body.file_url,
          file_size: body.file_size,
          file_type: body.file_type,
          expiry_date: body.expiry_date
        })
        .select()
        .single()

      if (docError) {
        return new Response(
          JSON.stringify({ error: docError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: docData }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'PUT' && tenantId && action === 'room') {
      // Update room information
      const body = await req.json()
      
      const { data: roomData, error: roomError } = await supabase
        .from('tenants')
        .update({
          property_id: body.property_id,
          unit_id: body.unit_id,
          lease_start: body.lease_start,
          lease_end: body.lease_end,
          rent_amount: body.rent_amount,
          security_deposit: body.security_deposit
        })
        .eq('id', tenantId)
        .select()
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

    if (req.method === 'POST' && tenantId && action === 'bills') {
      // Create new bill
      const body = await req.json()
      
      const { data: billData, error: billError } = await supabase
        .from('invoices')
        .insert({
          tenant_id: tenantId,
          organization_id: profile.organization_id,
          invoice_number: body.invoice_number,
          bill_type: body.bill_type || 'Rent',
          amount: body.amount,
          due_date: body.due_date,
          unit_id: body.unit_id
        })
        .select()
        .single()

      if (billError) {
        return new Response(
          JSON.stringify({ error: billError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: billData }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST' && tenantId && action === 'meter') {
      // Add electricity meter reading
      const body = await req.json()
      
      const { data: meterData, error: meterError } = await supabase
        .from('electricity_meter_readings')
        .insert({
          tenant_id: tenantId,
          unit_id: body.unit_id,
          reading_month: body.reading_month,
          previous_reading: body.previous_reading,
          current_reading: body.current_reading,
          unit_rate: body.unit_rate,
          recorded_by: user.id
        })
        .select()
        .single()

      if (meterError) {
        return new Response(
          JSON.stringify({ error: meterError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: meterData }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'PUT' && action && action.startsWith('family-')) {
      // Update family member
      const familyId = action.replace('family-', '')
      const body = await req.json()
      
      const { data: updateData, error: updateError } = await supabase
        .from('tenant_family_members')
        .update({
          name: body.name,
          relation: body.relation,
          mobile_number: body.mobile_number,
          date_of_birth: body.date_of_birth,
          occupation: body.occupation,
          is_emergency_contact: body.is_emergency_contact
        })
        .eq('id', familyId)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: updateData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'DELETE' && action && action.startsWith('family-')) {
      // Delete family member
      const familyId = action.replace('family-', '')
      
      const { error: deleteError } = await supabase
        .from('tenant_family_members')
        .delete()
        .eq('id', familyId)
        .eq('tenant_id', tenantId)

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Family member deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'DELETE' && action && action.startsWith('document-')) {
      // Delete document
      const docId = action.replace('document-', '')
      
      const { error: deleteError } = await supabase
        .from('tenant_documents')
        .delete()
        .eq('id', docId)
        .eq('tenant_id', tenantId)

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Document deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin-tenant-management function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
