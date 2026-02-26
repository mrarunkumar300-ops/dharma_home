import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PaymentMethod {
  id: string;
  tenant_id: string;
  method_type: "card" | "upi" | "bank_account" | "wallet" | "cash";
  provider: string;
  method_identifier: string;
  is_default: boolean;
  is_active: boolean;
  gateway_customer_id?: string;
  gateway_payment_method_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentAttempt {
  id: string;
  payment_id?: string;
  tenant_id: string;
  amount: number;
  gateway_provider: string;
  gateway_transaction_id?: string;
  status: "initiated" | "processing" | "completed" | "failed" | "cancelled";
  gateway_response?: Record<string, any>;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface PaymentRequest {
  bill_ids: string[];
  amount: number;
  payment_method_id?: string;
  gateway: "razorpay" | "stripe" | "cash";
  auto_payment?: boolean;
}

export interface PaymentInitiationResponse {
  payment_id: string;
  gateway_order_id: string;
  gateway_metadata: Record<string, any>;
  payment_url?: string;
  amount: number;
  currency: string;
}

export interface UpcomingPayment {
  invoice_id: string;
  bill_number: string;
  amount: number;
  due_date: string;
  days_until_due: number;
  late_fee: number;
}

export const useTenantPayments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get tenant profile ID
  const getTenantProfileId = async () => {
    if (!user?.id) return null;
    
    const { data: profile } = await supabase
      .from('tenants_profile')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    return profile?.id;
  };

  // Get saved payment methods
  const {
    data: paymentMethods = [],
    isLoading: methodsLoading,
    error: methodsError,
  } = useQuery({
    queryKey: ["tenant-payment-methods", user?.id],
    queryFn: async () => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) return [];

      const { data, error } = await supabase
        .from('tenant_payment_methods')
        .select('*')
        .eq('tenant_id', tenantProfileId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get payment attempts history
  const {
    data: paymentAttempts = [],
    isLoading: attemptsLoading,
  } = useQuery({
    queryKey: ["tenant-payment-attempts", user?.id],
    queryFn: async () => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) return [];

      const { data, error } = await supabase
        .from('payment_attempts')
        .select(`
          *,
          payments(id, amount, payment_date, payment_method, status)
        `)
        .eq('tenant_id', tenantProfileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get upcoming payments
  const {
    data: upcomingPayments = [],
    isLoading: upcomingLoading,
  } = useQuery({
    queryKey: ["upcoming-payments", user?.id],
    queryFn: async () => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) return [];

      const { data, error } = await supabase
        .rpc('get_upcoming_payments', {
          _tenant_id: tenantProfileId,
          _days_ahead: 30,
        });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get payment statistics
  const {
    data: paymentStats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["tenant-payment-stats", user?.id],
    queryFn: async () => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) return null;

      const { data, error } = await supabase
        .rpc('get_tenant_payment_statistics', {
          _tenant_id: tenantProfileId,
        });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Initiate payment
  const initiatePayment = useMutation({
    mutationFn: async (paymentRequest: PaymentRequest): Promise<PaymentInitiationResponse> => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) throw new Error("Tenant profile not found");

      // Create payment record
      // Get org id from tenant's linked tenant record
      const { data: tenantProfile } = await supabase
        .from('tenants_profile')
        .select('tenant_record_id')
        .eq('id', tenantProfileId)
        .single();
      
      let orgId = '';
      if (tenantProfile?.tenant_record_id) {
        const { data: tenantRecord } = await supabase
          .from('tenants')
          .select('organization_id')
          .eq('id', tenantProfile.tenant_record_id)
          .single();
        orgId = tenantRecord?.organization_id || '';
      }

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          organization_id: orgId,
          amount: paymentRequest.amount,
          payment_method: paymentRequest.gateway,
          status: 'pending',
          auto_payment: paymentRequest.auto_payment || false,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Create payment attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('payment_attempts')
        .insert({
          payment_id: payment.id,
          tenant_id: tenantProfileId,
          amount: paymentRequest.amount,
          gateway_provider: paymentRequest.gateway,
          status: 'initiated',
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      // Initialize payment gateway
      let gatewayResponse;
      if (paymentRequest.gateway === 'razorpay') {
        gatewayResponse = await initializeRazorpayPayment(paymentRequest, payment.id);
      } else if (paymentRequest.gateway === 'stripe') {
        gatewayResponse = await initializeStripePayment(paymentRequest, payment.id);
      } else if (paymentRequest.gateway === 'cash') {
        // For cash payments, create a manual response
        gatewayResponse = {
          gateway_order_id: `CASH-${payment.id}`,
          gateway_metadata: { payment_method: 'cash', manual: true },
          payment_url: null,
        };
      } else {
        throw new Error('Unsupported payment gateway');
      }

      // Update payment attempt with gateway response
      await supabase
        .from('payment_attempts')
        .update({
          gateway_transaction_id: gatewayResponse.gateway_order_id,
          gateway_response: gatewayResponse,
          status: paymentRequest.gateway === 'cash' ? 'completed' : 'processing',
        })
        .eq('id', attempt.id);

      return {
        payment_id: payment.id,
        gateway_order_id: gatewayResponse.gateway_order_id,
        gateway_metadata: gatewayResponse,
        payment_url: gatewayResponse.payment_url,
        amount: paymentRequest.amount,
        currency: 'INR',
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payment-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-payments"] });
    },
  });

  // Process payment callback (for webhooks)
  const processPaymentCallback = useMutation({
    mutationFn: async ({ gateway, callbackData }: {
      gateway: string;
      callbackData: Record<string, any>;
    }) => {
      // Verify webhook signature
      const isValid = await verifyWebhookSignature(gateway, callbackData);
      if (!isValid) throw new Error('Invalid webhook signature');

      // Find the payment attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('payment_attempts')
        .select('*')
        .eq('gateway_transaction_id', callbackData.order_id || callbackData.payment_intent_id)
        .single();

      if (attemptError) throw attemptError;

      // Update payment attempt
      const status = callbackData.status === 'captured' || callbackData.status === 'succeeded' 
        ? 'completed' 
        : 'failed';

      const { error: updateError } = await supabase
        .from('payment_attempts')
        .update({
          status,
          gateway_response: callbackData,
          completed_at: new Date().toISOString(),
          error_message: status === 'failed' ? callbackData.error?.description : null,
        })
        .eq('id', attempt.id);

      if (updateError) throw updateError;

      // Update payment record if successful
      if (status === 'completed' && attempt.payment_id) {
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            payment_date: new Date().toISOString().split('T')[0],
            gateway_transaction_id: callbackData.payment_id || callbackData.id,
            gateway_provider: gateway,
            gateway_response: callbackData,
          })
          .eq('id', attempt.payment_id);

        // Update invoice status
        if (attempt.payment_id) {
          const { data: payment } = await supabase
            .from('payments')
            .select('invoice_id')
            .eq('id', attempt.payment_id)
            .single();

          if (payment?.invoice_id) {
            await supabase
              .from('invoices')
              .update({ status: 'paid' })
              .eq('id', payment.invoice_id);
          }
        }
      }

      return { success: true, status };
    },
  });

  // Save payment method
  const savePaymentMethod = useMutation({
    mutationFn: async (methodData: {
      method_type: PaymentMethod["method_type"];
      provider: string;
      method_identifier: string;
      is_default?: boolean;
      gateway_token?: string;
    }) => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) throw new Error("Tenant profile not found");

      const { data, error } = await supabase
        .from('tenant_payment_methods')
        .insert({
          tenant_id: tenantProfileId,
          ...methodData,
          metadata: methodData.gateway_token ? { gateway_token: methodData.gateway_token } : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payment-methods"] });
    },
  });

  // Delete payment method
  const deletePaymentMethod = useMutation({
    mutationFn: async (methodId: string) => {
      const { error } = await supabase
        .from('tenant_payment_methods')
        .update({ is_active: false })
        .eq('id', methodId);

      if (error) throw error;
      return methodId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payment-methods"] });
    },
  });

  // Set default payment method
  const setDefaultPaymentMethod = useMutation({
    mutationFn: async (methodId: string) => {
      const { error } = await supabase
        .from('tenant_payment_methods')
        .update({ is_default: true })
        .eq('id', methodId);

      if (error) throw error;
      return methodId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payment-methods"] });
    },
  });

  // Helper functions for payment gateways
  const initializeRazorpayPayment = async (request: PaymentRequest, paymentId: string) => {
    // This would call your backend API to create a Razorpay order
    const response = await fetch('/api/v1/payments/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: request.amount,
        receipt: `receipt_${paymentId}`,
        notes: {
          payment_id: paymentId,
          bill_ids: request.bill_ids,
          tenant_id: user?.id,
        },
      }),
    });

    if (!response.ok) throw new Error('Failed to create Razorpay order');
    return response.json();
  };

  const initializeStripePayment = async (request: PaymentRequest, paymentId: string) => {
    // This would call your backend API to create a Stripe payment intent
    const response = await fetch('/api/v1/payments/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: request.amount,
        metadata: {
          payment_id: paymentId,
          bill_ids: request.bill_ids,
          tenant_id: user?.id,
        },
      }),
    });

    if (!response.ok) throw new Error('Failed to create Stripe payment intent');
    return response.json();
  };

  const verifyWebhookSignature = async (gateway: string, callbackData: Record<string, any>) => {
    // This would verify the webhook signature on your backend
    const response = await fetch(`/api/v1/payments/${gateway}/verify-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callbackData),
    });

    return response.ok;
  };

  return {
    paymentMethods,
    methodsLoading,
    methodsError,
    paymentAttempts,
    attemptsLoading,
    upcomingPayments,
    upcomingLoading,
    paymentStats,
    statsLoading,
    initiatePayment,
    processPaymentCallback,
    savePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
  };
};
