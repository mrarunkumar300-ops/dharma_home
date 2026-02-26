-- Phase 1: Enhanced Payment System Database Schema
-- This migration adds payment gateway integration and enhanced payment features

-- Add payment gateway fields to existing payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_provider TEXT CHECK (gateway_provider IN ('razorpay', 'stripe', 'paypal', 'manual')),
ADD COLUMN IF NOT EXISTS gateway_status TEXT,
ADD COLUMN IF NOT EXISTS gateway_response JSONB,
ADD COLUMN IF NOT EXISTS refund_id TEXT,
ADD COLUMN IF NOT EXISTS late_fee NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_payment BOOLEAN DEFAULT FALSE;

-- Create payment_attempts table for tracking failed/successful attempts
CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants_profile(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    gateway_provider TEXT NOT NULL,
    gateway_transaction_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('initiated', 'processing', 'completed', 'failed', 'cancelled')),
    gateway_response JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Create tenant_payment_methods table for saved payment methods
CREATE TABLE IF NOT EXISTS public.tenant_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants_profile(id) ON DELETE CASCADE,
    method_type TEXT NOT NULL CHECK (method_type IN ('card', 'upi', 'bank_account', 'wallet')),
    provider TEXT NOT NULL,
    method_identifier TEXT NOT NULL, -- Last 4 digits for cards, UPI ID, etc.
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    gateway_customer_id TEXT,
    gateway_payment_method_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_attempts_tenant_id ON public.payment_attempts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON public.payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_gateway_provider ON public.payment_attempts(gateway_provider);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at ON public.payment_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_tenant_payment_methods_tenant_id ON public.tenant_payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_methods_is_default ON public.tenant_payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_methods_is_active ON public.tenant_payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_methods_method_type ON public.tenant_payment_methods(method_type);

-- Enable RLS on new tables
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_attempts
CREATE POLICY "Tenants can view own payment attempts" ON public.payment_attempts 
FOR SELECT USING (tenant_id IN (
    SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()
));

CREATE POLICY "System can create payment attempts" ON public.payment_attempts 
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payment attempts" ON public.payment_attempts 
FOR UPDATE USING (true);

-- Staff can view payment attempts in their organization
CREATE POLICY "Staff can view payment attempts" ON public.payment_attempts 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.organizations o ON o.id = ur.organization_id 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'manager', 'staff')
        AND o.id = (
            SELECT organization_id FROM public.tenants_profile tp 
            WHERE tp.id = public.payment_attempts.tenant_id
        )
    )
);

-- RLS Policies for tenant_payment_methods
CREATE POLICY "Tenants can manage own payment methods" ON public.tenant_payment_methods 
FOR ALL USING (tenant_id IN (
    SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()
));

-- Staff can view payment methods in their organization
CREATE POLICY "Staff can view payment methods" ON public.tenant_payment_methods 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.organizations o ON o.id = ur.organization_id 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'manager', 'staff')
        AND o.id = (
            SELECT organization_id FROM public.tenants_profile tp 
            WHERE tp.id = public.tenant_payment_methods.tenant_id
        )
    )
);

-- Add updated_at trigger for new tables
CREATE TRIGGER update_payment_attempts_updated_at 
BEFORE UPDATE ON public.payment_attempts 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_payment_methods_updated_at 
BEFORE UPDATE ON public.tenant_payment_methods 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one default payment method per tenant
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    -- If this payment method is being set as default, unset all others for this tenant
    IF NEW.is_default = TRUE THEN
        UPDATE public.tenant_payment_methods 
        SET is_default = FALSE 
        WHERE tenant_id = NEW.tenant_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for single default payment method
DROP TRIGGER IF EXISTS single_default_payment_method_trigger ON public.tenant_payment_methods;
CREATE TRIGGER single_default_payment_method_trigger
    BEFORE INSERT OR UPDATE ON public.tenant_payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_payment_method();

-- Function to get payment statistics for tenant
CREATE OR REPLACE FUNCTION public.get_tenant_payment_statistics(_tenant_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_paid', COALESCE(SUM(amount), 0)::numeric,
    'payments_this_month', COUNT(*) FILTER (
      WHERE payment_date >= date_trunc('month', CURRENT_DATE)
    )::int,
    'successful_payments', COUNT(*) FILTER (WHERE status = 'completed')::int,
    'failed_payments', COUNT(*) FILTER (WHERE status = 'failed')::int,
    'saved_payment_methods', (SELECT COUNT(*) FROM public.tenant_payment_methods WHERE tenant_id = _tenant_id AND is_active = TRUE)::int,
    'auto_payment_enabled', COALESCE(
      (SELECT COUNT(*) FROM public.tenant_payment_methods WHERE tenant_id = _tenant_id AND is_default = TRUE AND is_active = TRUE) > 0, 
      FALSE
    )
  )
  FROM public.payments 
  WHERE invoice_id IN (
    SELECT id FROM public.invoices 
    WHERE tenant_id IN (
      SELECT tenant_record_id FROM public.tenants_profile WHERE id = _tenant_id
    )
  );
$$;

-- Function to calculate late fees
CREATE OR REPLACE FUNCTION public.calculate_late_fee(_invoice_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN CURRENT_DATE > due_date + grace_period_days THEN
        (amount * 0.02) * (CURRENT_DATE - due_date - grace_period_days) -- 2% per day after grace period
      ELSE 0
    END
  FROM public.invoices 
  WHERE id = _invoice_id;
$$;

-- Function to get upcoming payments for tenant
CREATE OR REPLACE FUNCTION public.get_upcoming_payments(_tenant_id UUID, _days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  invoice_id UUID,
  bill_number TEXT,
  amount NUMERIC,
  due_date DATE,
  days_until_due INTEGER,
  late_fee NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.invoice_number,
    i.amount,
    i.due_date,
    EXTRACT(DAYS FROM i.due_date - CURRENT_DATE)::INTEGER as days_until_due,
    public.calculate_late_fee(i.id) as late_fee
  FROM public.invoices i
  WHERE i.tenant_id IN (
    SELECT tenant_record_id FROM public.tenants_profile WHERE id = _tenant_id
  )
    AND i.status != 'paid'
    AND i.due_date <= CURRENT_DATE + INTERVAL '1 day' * _days_ahead
    AND i.due_date >= CURRENT_DATE - INTERVAL '7 days' -- Include recent overdue
  ORDER BY i.due_date ASC;
$$;

-- Add comments for documentation
COMMENT ON TABLE public.payment_attempts IS 'Tracks all payment attempts including failures and retries';
COMMENT ON TABLE public.tenant_payment_methods IS 'Saved payment methods for recurring payments';

COMMENT ON COLUMN public.payments.gateway_transaction_id IS 'Transaction ID from payment gateway';
COMMENT ON COLUMN public.payments.gateway_provider IS 'Payment gateway used: razorpay, stripe, paypal, manual';
COMMENT ON COLUMN public.payments.gateway_response IS 'Full response from payment gateway as JSON';
COMMENT ON COLUMN public.payments.late_fee IS 'Late fee charged for overdue payments';
COMMENT ON COLUMN public.payments.discount_amount IS 'Any discount applied to this payment';
COMMENT ON COLUMN public.payments.auto_payment IS 'Whether this was an automatic recurring payment';

COMMENT ON COLUMN public.payment_attempts.gateway_transaction_id IS 'Gateway transaction ID for this attempt';
COMMENT ON COLUMN public.payment_attempts.status IS 'Status of this specific attempt: initiated, processing, completed, failed, cancelled';
COMMENT ON COLUMN public.payment_attempts.error_message IS 'Error message if payment failed';

COMMENT ON COLUMN public.tenant_payment_methods.method_type IS 'Type of payment method: card, upi, bank_account, wallet';
COMMENT ON COLUMN public.tenant_payment_methods.method_identifier IS 'Display identifier: last 4 digits for cards, UPI ID, etc.';
COMMENT ON COLUMN public.tenant_payment_methods.gateway_customer_id IS 'Customer ID from payment gateway';
COMMENT ON COLUMN public.tenant_payment_methods.gateway_payment_method_id IS 'Payment method ID from payment gateway';
