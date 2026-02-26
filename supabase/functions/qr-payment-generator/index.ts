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

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { amount, bill_ids } = await req.json()

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Valid amount is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!bill_ids || !Array.isArray(bill_ids) || bill_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "Bill IDs are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get tenant profile
    const { data: tenantProfile, error: tenantError } = await supabase
      .from("tenants_profile")
      .select("id, full_name, email")
      .eq("user_id", user.id)
      .single()

    if (tenantError || !tenantProfile) {
      return new Response(
        JSON.stringify({ error: "Tenant profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Generate unique payment reference
    const { data: referenceData, error: referenceError } = await supabase
      .rpc("generate_payment_reference")

    if (referenceError || !referenceData) {
      return new Response(
        JSON.stringify({ error: "Failed to generate payment reference" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const paymentReference = referenceData

    // Configuration - you can update these with your actual details
    const upiId = "yourbusiness@upi" // Replace with your actual UPI ID
    const businessName = "YourProperty" // Replace with your property name

    // Generate UPI payment string
    const paymentString = `upi://pay?pa=${upiId}&pn=${businessName}&am=${amount}&cu=INR&tn=${paymentReference}`

    // Generate QR code URL using free QR code API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentString)}`

    // Set expiry time (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // Create QR payment record
    const { data: qrPayment, error: qrError } = await supabase
      .from("tenant_qr_payments")
      .insert({
        tenant_id: tenantProfile.id,
        bill_ids: bill_ids,
        amount: amount,
        qr_code_url: qrCodeUrl,
        upi_id: upiId,
        payment_reference: paymentReference,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (qrError) {
      console.error("QR payment creation error:", qrError)
      return new Response(
        JSON.stringify({ error: "Failed to create QR payment: " + qrError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Log the QR payment creation
    await supabase
      .from("activity_log")
      .insert({
        user_id: user.id,
        action: "QR_PAYMENT_GENERATED",
        entity_type: "tenant_qr_payments",
        entity_id: qrPayment.id,
        details: {
          payment_reference: paymentReference,
          amount: amount,
          bill_ids: bill_ids,
          tenant_name: tenantProfile.full_name,
        },
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          payment_reference: paymentReference,
          qr_code_url: qrCodeUrl,
          upi_id: upiId,
          expires_at: qrPayment.expires_at,
          amount: amount,
          business_name: businessName,
        },
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )

  } catch (error: any) {
    console.error("QR payment generation error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
