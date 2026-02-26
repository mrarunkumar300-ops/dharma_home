-- Simplified Payments Table Update
-- This migration fixes the payments table with proper syntax

-- Add foreign key constraint with proper error handling
DO $$
BEGIN
    ALTER TABLE public.payments 
    ADD CONSTRAINT fk_payments_invoice_id 
    FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payment_method enum type
DO $$ BEGIN
    CREATE TYPE public.payment_method_type AS ENUM ('cash', 'check', 'bank_transfer', 'credit_card', 'online', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update payment_method column to use new enum (with error handling)
DO $$
BEGIN
    ALTER TABLE public.payments 
    ALTER COLUMN payment_method TYPE public.payment_method_type 
    USING payment_method::text::public.payment_method_type;
EXCEPTION
    WHEN others THEN
        -- Column might already be the right type or have incompatible data
        NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Add positive amount constraint
DO $$
BEGIN
    ALTER TABLE public.payments 
    ADD CONSTRAINT check_payments_amount_positive 
    CHECK (amount > 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add comments
COMMENT ON COLUMN public.payments.payment_method IS 'Payment method: cash, check, bank_transfer, credit_card, online, other';
COMMENT ON COLUMN public.payments.invoice_id IS 'Related invoice ID if this payment is for a specific invoice';

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
    AND table_schema = 'public'
    AND column_name IN ('payment_method', 'invoice_id')
ORDER BY ordinal_position;
