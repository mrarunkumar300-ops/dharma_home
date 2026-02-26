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

    if (req.method === "POST") {
      // Verify QR payment
      const { payment_id, status, admin_notes } = await req.json()

      if (!payment_id) {
        return new Response(
          JSON.stringify({ error: "Payment ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      if (!status || !['approved', 'rejected'].includes(status)) {
        return new Response(
          JSON.stringify({ error: "Status must be 'approved' or 'rejected'" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Verify the payment
      const { data, error } = await supabase.rpc("verify_qr_payment", {
        payment_id: payment_id,
        verification_status: status,
        admin_notes: admin_notes || null,
      })

      if (error) {
        console.error("QR payment verification error:", error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Get payment details for logging
      const { data: paymentDetails } = await supabase
        .from("tenant_qr_payments")
        .select("*, tenants_profile(full_name, email)")
        .eq("id", payment_id)
        .single()

      // Log the verification action
      await supabase
        .from("activity_log")
        .insert({
          user_id: user.id,
          action: `QR_PAYMENT_${status.toUpperCase()}`,
          entity_type: "tenant_qr_payments",
          entity_id: payment_id,
          details: {
            payment_reference: paymentDetails?.payment_reference,
            amount: paymentDetails?.amount,
            tenant_name: paymentDetails?.tenants_profile?.full_name,
            admin_notes: admin_notes,
          },
        })

      return new Response(
        JSON.stringify({
          success: true,
          message: `Payment ${status} successfully`,
          data: data,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )

    } else if (req.method === "GET") {
      // Get pending QR payments for admin verification
      const { data, error } = await supabase.rpc("get_pending_qr_payments")

      if (error) {
        console.error("Get pending QR payments error:", error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )

    } else if (req.method === "PUT") {
      // Upload payment screenshot (tenant side)
      const { payment_reference, screenshot_url, verification_notes } = await req.json()

      if (!payment_reference || !screenshot_url) {
        return new Response(
          JSON.stringify({ error: "Payment reference and screenshot URL are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Update payment record with screenshot
      const { data, error } = await supabase
        .from("tenant_qr_payments")
        .update({
          payment_screenshot_url: screenshot_url,
          verification_notes: verification_notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("payment_reference", payment_reference)
        .eq("status", "pending")
        .select()
        .single()

      if (error) {
        console.error("Screenshot upload error:", error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Log the screenshot upload
      await supabase
        .from("activity_log")
        .insert({
          user_id: user.id,
          action: "QR_PAYMENT_SCREENSHOT_UPLOADED",
          entity_type: "tenant_qr_payments",
          entity_id: data.id,
          details: {
            payment_reference: payment_reference,
            screenshot_url: screenshot_url,
          },
        })

      return new Response(
        JSON.stringify({
          success: true,
          message: "Screenshot uploaded successfully",
          data: data,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )

    } else {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

  } catch (error: any) {
    console.error("QR payment verification error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
