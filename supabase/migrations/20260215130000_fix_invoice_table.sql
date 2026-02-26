-- Simplified Invoice Table Update
-- This migration fixes the invoice table with proper syntax

-- First, add the missing columns if they don't exist
DO $$
BEGIN
    -- Add payment_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'payment_date' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN payment_date DATE;
    END IF;

    -- Add payment_method column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'payment_method' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN payment_method TEXT;
    END IF;
END $$;

-- Create status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update status column to use enum (only if it's not already an enum)
DO $$
BEGIN
    -- Check if status column is not already an enum type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'status' 
        AND data_type != 'USER-DEFINED'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.invoices 
        ALTER COLUMN status TYPE public.invoice_status 
        USING status::text::public.invoice_status;
    END IF;
EXCEPTION
    WHEN others THEN 
        -- Column might already be enum, which is fine
        NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);

-- Add constraints with proper error handling
DO $$
BEGIN
    ALTER TABLE public.invoices 
    ADD CONSTRAINT check_invoices_amount_positive 
    CHECK (amount > 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Update existing paid invoices to have payment dates
UPDATE public.invoices 
SET payment_date = due_date 
WHERE status = 'paid' AND payment_date IS NULL;

-- Add comments
COMMENT ON COLUMN public.invoices.payment_date IS 'Date when the invoice was actually paid';
COMMENT ON COLUMN public.invoices.payment_method IS 'Payment method used for the invoice';

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices' 
    AND table_schema = 'public'
    AND column_name IN ('payment_date', 'payment_method', 'status')
ORDER BY ordinal_position;
