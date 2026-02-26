
-- Fix: Revert invoice status column back to text if it was changed to enum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'status' 
    AND data_type = 'USER-DEFINED'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.invoices 
    ALTER COLUMN status TYPE text 
    USING status::text;
  END IF;
END $$;

-- Fix: Revert payment_method column back to text if it was changed to enum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'payment_method' 
    AND data_type = 'USER-DEFINED'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.payments 
    ALTER COLUMN payment_method TYPE text 
    USING payment_method::text;
  END IF;
END $$;

-- Drop the problematic enum types that conflict with app_role
DROP TYPE IF EXISTS public.invoice_status CASCADE;
DROP TYPE IF EXISTS public.payment_method_type CASCADE;

-- Drop the problematic view that depends on enum columns
DROP VIEW IF EXISTS public.invoice_payment_summary CASCADE;

-- Ensure invoices table has the needed columns as TEXT (not enum)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Fix tenant_payment_records - remove columns that shouldn't exist
-- The existing schema only has: id, tenant_id, payment_id, payment_type, description, created_at
DO $$
BEGIN
  ALTER TABLE public.tenant_payment_records DROP COLUMN IF EXISTS amount;
  ALTER TABLE public.tenant_payment_records DROP COLUMN IF EXISTS payment_date;
  ALTER TABLE public.tenant_payment_records DROP COLUMN IF EXISTS payment_method;
  ALTER TABLE public.tenant_payment_records DROP COLUMN IF EXISTS status;
  ALTER TABLE public.tenant_payment_records DROP COLUMN IF EXISTS reference_number;
  ALTER TABLE public.tenant_payment_records DROP COLUMN IF EXISTS updated_at;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Remove CHECK constraints that reference enums
DO $$
BEGIN
  ALTER TABLE public.tenant_bills DROP CONSTRAINT IF EXISTS tenant_bills_status_check;
  ALTER TABLE public.tenant_bills DROP CONSTRAINT IF EXISTS check_bill_period;
  ALTER TABLE public.tenant_bills DROP CONSTRAINT IF EXISTS tenant_bills_amount_check;
  ALTER TABLE public.tenant_payment_records DROP CONSTRAINT IF EXISTS tenant_payment_records_amount_check;
  ALTER TABLE public.tenant_payment_records DROP CONSTRAINT IF EXISTS tenant_payment_records_status_check;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Drop duplicate unique constraint if it exists (keep the one from the original migration)
DO $$
BEGIN
  ALTER TABLE public.tenant_bills DROP CONSTRAINT IF EXISTS unique_tenant_bill;
EXCEPTION WHEN others THEN NULL;
END $$;
