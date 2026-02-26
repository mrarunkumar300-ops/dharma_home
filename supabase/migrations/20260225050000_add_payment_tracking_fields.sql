-- Add Payment Tracking Fields to Payments Table
-- This migration adds fields to track who paid, who received, and payment time

-- Add new columns to payments table for enhanced tracking
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS paid_by TEXT NOT NULL DEFAULT 'System',
ADD COLUMN IF NOT EXISTS received_by TEXT NOT NULL DEFAULT 'System',
ADD COLUMN IF NOT EXISTS payment_time TIME NOT NULL DEFAULT CURRENT_TIME;

-- Add indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_payments_paid_by ON public.payments(paid_by);
CREATE INDEX IF NOT EXISTS idx_payments_received_by ON public.payments(received_by);
CREATE INDEX IF NOT EXISTS idx_payments_payment_time ON public.payments(payment_time);

-- Add comments for documentation
COMMENT ON COLUMN public.payments.paid_by IS 'Name of the person who made the payment';
COMMENT ON COLUMN public.payments.received_by IS 'Name of the person who received the payment';
COMMENT ON COLUMN public.payments.payment_time IS 'Time when the payment was made (HH:MM:SS format)';

-- Create a function to automatically set payment_time if not provided
CREATE OR REPLACE FUNCTION public.set_payment_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_time IS NULL OR NEW.payment_time = CURRENT_TIME THEN
        NEW.payment_time := CURRENT_TIME;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set payment_time
DROP TRIGGER IF EXISTS trigger_set_payment_time ON public.payments;
CREATE TRIGGER trigger_set_payment_time
    BEFORE INSERT OR UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_payment_time();

-- Update existing payments to have default values for new fields
UPDATE public.payments 
SET 
    paid_by = COALESCE(paid_by, 'System'),
    received_by = COALESCE(received_by, 'System'),
    payment_time = COALESCE(payment_time, CURRENT_TIME)
WHERE paid_by IS NULL OR received_by IS NULL OR payment_time IS NULL;

-- Create a view for payment tracking summary
CREATE OR REPLACE VIEW public.payment_tracking_summary AS
SELECT 
    p.id as payment_id,
    p.amount,
    p.payment_method,
    p.payment_date,
    p.payment_time,
    p.paid_by,
    p.received_by,
    p.status,
    p.description,
    i.invoice_number,
    tp.name as tenant_name,
    tp.property_name,
    tp.room_number,
    p.created_at,
    p.updated_at
FROM public.payments p
LEFT JOIN public.invoices i ON p.invoice_id = i.id
LEFT JOIN public.tenants_profile tp ON p.tenant_id = tp.id
ORDER BY p.payment_date DESC, p.payment_time DESC;

-- Add RLS policy for the new view
ALTER TABLE public.payment_tracking_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view payment tracking summary" ON public.payment_tracking_summary 
FOR SELECT USING (
    public.is_org_member(auth.uid(), (SELECT organization_id FROM public.payments WHERE id = payment_id))
);

COMMENT ON VIEW public.payment_tracking_summary IS 'Enhanced payment tracking view with payer and receiver information';
