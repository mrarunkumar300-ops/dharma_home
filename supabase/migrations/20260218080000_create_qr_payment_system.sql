-- Create QR Code Payment System
-- This migration adds QR code payment functionality for tenant payments

-- Create tenant_qr_payments table
CREATE TABLE IF NOT EXISTS public.tenant_qr_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants_profile(id) ON DELETE CASCADE,
    bill_ids TEXT[] NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    qr_code_url TEXT NOT NULL,
    upi_id TEXT NOT NULL,
    payment_reference TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
    paid_at TIMESTAMPTZ,
    payment_screenshot_url TEXT,
    verified_by UUID REFERENCES public.auth.users(id),
    verification_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT check_positive_amount CHECK (amount > 0),
    CONSTRAINT check_future_expiry CHECK (expires_at > created_at)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_qr_payments_tenant_id ON public.tenant_qr_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_qr_payments_status ON public.tenant_qr_payments(status);
CREATE INDEX IF NOT EXISTS idx_tenant_qr_payments_reference ON public.tenant_qr_payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_tenant_qr_payments_expires_at ON public.tenant_qr_payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_tenant_qr_payments_created_at ON public.tenant_qr_payments(created_at DESC);

-- Enable RLS on the new table
ALTER TABLE public.tenant_qr_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_qr_payments
CREATE POLICY "Tenants can view own QR payments" ON public.tenant_qr_payments 
FOR SELECT USING (tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()));

CREATE POLICY "Tenants can create own QR payments" ON public.tenant_qr_payments 
FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()));

CREATE POLICY "Tenants can update own QR payments (limited)" ON public.tenant_qr_payments 
FOR UPDATE USING (tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()));

-- Admin/Super Admin can manage all QR payments
CREATE POLICY "Admins can view all QR payments" ON public.tenant_qr_payments 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can update all QR payments" ON public.tenant_qr_payments 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Add updated_at trigger
CREATE TRIGGER update_tenant_qr_payments_updated_at 
BEFORE UPDATE ON public.tenant_qr_payments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique payment reference
CREATE OR REPLACE FUNCTION public.generate_payment_reference()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    reference TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    WHILE attempts < max_attempts LOOP
        reference := 'PAY' || to_char(now(), 'YYMMDD') || upper(substr(md5(random()::text), 1, 8));
        
        -- Check if reference already exists
        IF NOT EXISTS (SELECT 1 FROM public.tenant_qr_payments WHERE payment_reference = reference) THEN
            RETURN reference;
        END IF;
        
        attempts := attempts + 1;
    END LOOP;
    
    RAISE EXCEPTION 'Failed to generate unique payment reference after % attempts', max_attempts;
END;
$$;

-- Function to get pending QR payments for admin verification
CREATE OR REPLACE FUNCTION public.get_pending_qr_payments()
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    tenant_name TEXT,
    tenant_email TEXT,
    bill_ids TEXT[],
    amount NUMERIC,
    payment_reference TEXT,
    status TEXT,
    payment_screenshot_url TEXT,
    verification_notes TEXT,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    time_ago TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qr.id,
        qr.tenant_id,
        tp.full_name as tenant_name,
        tp.email as tenant_email,
        qr.bill_ids,
        qr.amount,
        qr.payment_reference,
        qr.status,
        qr.payment_screenshot_url,
        qr.verification_notes,
        qr.created_at,
        qr.expires_at,
        CASE 
            WHEN qr.created_at > now() - interval '1 hour' THEN 'Just now'
            WHEN qr.created_at > now() - interval '24 hours' THEN floor(extract(epoch from (now() - qr.created_at))/3600) || ' hours ago'
            ELSE floor(extract(epoch from (now() - qr.created_at))/86400) || ' days ago'
        END as time_ago
    FROM public.tenant_qr_payments qr
    JOIN public.tenants_profile tp ON qr.tenant_id = tp.id
    WHERE qr.status = 'pending'
    ORDER BY qr.created_at DESC;
END;
$$;

-- Function to verify QR payment
CREATE OR REPLACE FUNCTION public.verify_qr_payment(
    payment_id UUID,
    verification_status TEXT, -- 'approved' or 'rejected'
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payment_record RECORD;
    bill_id UUID;
BEGIN
    -- Validate verification status
    IF verification_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid verification status: %', verification_status;
    END IF;
    
    -- Get payment record
    SELECT * INTO payment_record 
    FROM public.tenant_qr_payments 
    WHERE id = payment_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found or already processed';
    END IF;
    
    -- Update payment record
    UPDATE public.tenant_qr_payments 
    SET 
        status = CASE 
            WHEN verification_status = 'approved' THEN 'paid'
            ELSE 'cancelled'
        END,
        verified_by = auth.uid(),
        admin_notes = admin_notes,
        updated_at = now()
    WHERE id = payment_id;
    
    -- If approved, update bill statuses
    IF verification_status = 'approved' THEN
        -- Update each bill to paid status
        FOREACH bill_id IN ARRAY payment_record.bill_ids
        LOOP
            -- Update tenant_bills table
            UPDATE public.tenant_bills 
            SET status = 'paid'
            WHERE id = bill_id AND tenant_id = payment_record.tenant_id;
            
            -- Create payment record
            INSERT INTO public.tenant_payment_records (
                tenant_id,
                payment_type,
                description,
                amount,
                payment_date,
                payment_method,
                status,
                reference_number
            ) VALUES (
                payment_record.tenant_id,
                'QR Payment',
                'Payment via QR Code - Ref: ' || payment_record.payment_reference,
                payment_record.amount,
                CURRENT_DATE,
                'UPI',
                'completed',
                payment_record.payment_reference
            );
        END LOOP;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Function to expire old QR payments
CREATE OR REPLACE FUNCTION public.expire_old_qr_payments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired payments
    UPDATE public.tenant_qr_payments 
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending' AND expires_at < now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_payment_reference TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_qr_payments TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_qr_payment TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_old_qr_payments TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.tenant_qr_payments IS 'QR code payment records for tenant UPI payments';
COMMENT ON COLUMN public.tenant_qr_payments.payment_reference IS 'Unique payment reference number';
COMMENT ON COLUMN public.tenant_qr_payments.qr_code_url IS 'URL to the generated QR code image';
COMMENT ON COLUMN public.tenant_qr_payments.upi_id IS 'UPI ID for payment';
COMMENT ON COLUMN public.tenant_qr_payments.payment_screenshot_url IS 'URL to uploaded payment screenshot';
COMMENT ON COLUMN public.tenant_qr_payments.verified_by IS 'Admin user who verified the payment';
COMMENT ON COLUMN public.tenant_qr_payments.verification_notes IS 'Notes provided by tenant during payment';

COMMENT ON FUNCTION public.generate_payment_reference IS 'Generate unique payment reference for QR payments';
COMMENT ON FUNCTION public.get_pending_qr_payments IS 'Get all pending QR payments for admin verification';
COMMENT ON FUNCTION public.verify_qr_payment IS 'Verify and process QR payment (approve/reject)';
COMMENT ON FUNCTION public.expire_old_qr_payments IS 'Mark expired QR payments as expired';
