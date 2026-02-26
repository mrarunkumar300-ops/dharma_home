-- Add Cash Payment Support to Payment System
-- This migration adds support for cash payments in the existing payment system

-- Update payments table to include cash payments
ALTER TABLE public.payments 
ALTER COLUMN gateway_provider DROP CONSTRAINT;

-- Add new constraint that includes cash payments
ALTER TABLE public.payments 
ADD CONSTRAINT payments_gateway_provider_check 
CHECK (gateway_provider IN ('razorpay', 'stripe', 'paypal', 'manual', 'cash'));

-- Add cash payment specific fields
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS cash_receipt_url TEXT,
ADD COLUMN IF NOT EXISTS cash_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cash_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cash_notes TEXT;

-- Add cash payment method to tenant_payment_methods
ALTER TABLE public.tenant_payment_methods 
ALTER COLUMN method_type DROP CONSTRAINT;

-- Add new constraint that includes cash
ALTER TABLE public.tenant_payment_methods 
ADD CONSTRAINT tenant_payment_methods_method_type_check 
CHECK (method_type IN ('card', 'upi', 'bank_account', 'wallet', 'cash'));

-- Create cash payment receipts table for tracking cash payments
CREATE TABLE IF NOT EXISTS public.cash_payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants_profile(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL UNIQUE,
    receipt_url TEXT,
    receipt_uploaded_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for cash payment receipts
CREATE INDEX IF NOT EXISTS idx_cash_payment_receipts_payment_id ON public.cash_payment_receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_cash_payment_receipts_tenant_id ON public.cash_payment_receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_payment_receipts_receipt_number ON public.cash_payment_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_cash_payment_receipts_verified_by ON public.cash_payment_receipts(verified_by);

-- Update payment attempts table for cash payments
ALTER TABLE public.payment_attempts 
ALTER COLUMN status DROP CONSTRAINT;

-- Add new constraint that includes cash payment status
ALTER TABLE public.payment_attempts 
ADD CONSTRAINT payment_attempts_status_check 
CHECK (status IN ('initiated', 'processing', 'completed', 'failed', 'cancelled', 'cash_pending', 'cash_verified'));

-- Add RLS policies for cash payment receipts
ALTER TABLE public.cash_payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own cash receipts" ON public.cash_payment_receipts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tenants_profile tp
            WHERE tp.id = tenant_id 
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all cash receipts" ON public.cash_payment_receipts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.tenants_profile tp ON tp.user_id = ur.user_id
            WHERE tp.id = tenant_id 
            AND ur.role IN ('admin', 'super_admin')
        )
    );

-- Add comments
COMMENT ON COLUMN public.payments.gateway_provider IS 'Payment gateway used: razorpay, stripe, paypal, manual, or cash';
COMMENT ON COLUMN public.payments.payment_reference IS 'Reference number for manual payments';
COMMENT ON COLUMN public.payments.cash_receipt_url IS 'URL to uploaded cash receipt';
COMMENT ON COLUMN public.payments.cash_verified_by IS 'Admin who verified the cash payment';
COMMENT ON COLUMN public.payments.cash_verified_at IS 'When the cash payment was verified';
COMMENT ON COLUMN public.payments.cash_notes IS 'Notes about the cash payment';
COMMENT ON TABLE public.cash_payment_receipts IS 'Table for tracking cash payment receipts';
