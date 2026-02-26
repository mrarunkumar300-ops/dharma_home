-- Update invoice table with missing fields
-- This migration adds payment_date and payment_method fields to match the form

-- Add payment_date field for tracking when invoices were paid
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Add payment_method field for tracking how invoices were paid
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Update the status field to be a proper enum with better constraints
-- First, create the enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter the status column to use the new enum
ALTER TABLE public.invoices 
ALTER COLUMN status TYPE public.invoice_status 
USING status::public.invoice_status;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_unit_id ON public.invoices(unit_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON public.invoices(organization_id);

-- Add constraint to ensure amount is positive
DO $$
BEGIN
    ALTER TABLE public.invoices 
    ADD CONSTRAINT check_invoices_amount_positive 
    CHECK (amount > 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add constraint to ensure due_date is after issue_date
DO $$
BEGIN
    ALTER TABLE public.invoices 
    ADD CONSTRAINT check_invoices_due_after_issue 
    CHECK (due_date >= issue_date);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing invoices to ensure data integrity
UPDATE public.invoices 
SET payment_date = due_date 
WHERE status = 'paid' AND payment_date IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.invoices.payment_date IS 'Date when the invoice was actually paid';
COMMENT ON COLUMN public.invoices.payment_method IS 'Method used to pay the invoice (cash, check, bank_transfer, credit_card, online, other)';
COMMENT ON COLUMN public.invoices.status IS 'Current status of the invoice: pending, paid, overdue, cancelled';
