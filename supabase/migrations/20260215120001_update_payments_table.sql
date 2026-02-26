-- Update payments table to better align with invoice system
-- This migration improves the payments table structure

-- Add invoice_id constraint to ensure payment is linked to an invoice when applicable
DO $$
BEGIN
    ALTER TABLE public.payments 
    ADD CONSTRAINT fk_payments_invoice_id 
    FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Check payment methods enum
SELECT typname, typcategory, typlabel 
FROM pg_type 
WHERE typname = 'payment_method_type';

-- Create payment_method enum type for consistency
DO $$ BEGIN
    CREATE TYPE public.payment_method_type AS ENUM ('cash', 'check', 'bank_transfer', 'credit_card', 'online', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update payment_method column to use the new enum
ALTER TABLE public.payments 
ALTER COLUMN payment_method TYPE public.payment_method_type 
USING payment_method::public.payment_method_type;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON public.payments(organization_id);

-- Add constraint to ensure amount is positive
DO $$
BEGIN
    ALTER TABLE public.payments 
    ADD CONSTRAINT check_payments_amount_positive 
    CHECK (amount > 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.payments.payment_method IS 'Payment method: cash, check, bank_transfer, credit_card, online, other';
COMMENT ON COLUMN public.payments.invoice_id IS 'Related invoice ID if this payment is for a specific invoice';
COMMENT ON COLUMN public.payments.status IS 'Payment status: completed, pending, failed, refunded';

-- Create a view for invoice payments summary
CREATE OR REPLACE VIEW public.invoice_payment_summary AS
SELECT 
    i.id as invoice_id,
    i.invoice_number,
    i.amount as invoice_amount,
    COALESCE(SUM(p.amount), 0) as total_paid,
    i.amount - COALESCE(SUM(p.amount), 0) as balance_due,
    i.status as invoice_status,
    i.due_date,
    i.payment_date as invoice_payment_date,
    COUNT(p.id) as payment_count,
    MAX(p.payment_date) as last_payment_date
FROM public.invoices i
LEFT JOIN public.payments p ON i.id = p.invoice_id
GROUP BY i.id, i.invoice_number, i.amount, i.status, i.due_date, i.payment_date;

-- Add RLS policy for the new view
ALTER TABLE public.invoice_payment_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invoice payment summary" ON public.invoice_payment_summary 
FOR SELECT USING (
    public.is_org_member(auth.uid(), (SELECT organization_id FROM public.invoices WHERE id = invoice_id))
);

COMMENT ON VIEW public.invoice_payment_summary IS 'Summary view showing invoice status and payment information';
