-- Create tenant bills table for tenant-facing billing
-- This table stores bills that tenants see in their portal

-- Create tenant_bills table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenant_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    bill_number TEXT NOT NULL,
    bill_type TEXT NOT NULL DEFAULT 'Rent',
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    bill_period_start DATE,
    bill_period_end DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'partial')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_tenant_bill UNIQUE(tenant_id, bill_number),
    CONSTRAINT check_bill_period CHECK (bill_period_end IS NULL OR bill_period_end >= bill_period_start)
);

-- Create tenant_payment_records table for tenant payment history
CREATE TABLE IF NOT EXISTS public.tenant_payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'Rent Payment',
    description TEXT,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    reference_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_bills_tenant_id ON public.tenant_bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_bills_status ON public.tenant_bills(status);
CREATE INDEX IF NOT EXISTS idx_tenant_bills_due_date ON public.tenant_bills(due_date);
CREATE INDEX IF NOT EXISTS idx_tenant_bills_bill_type ON public.tenant_bills(bill_type);

CREATE INDEX IF NOT EXISTS idx_tenant_payment_records_tenant_id ON public.tenant_payment_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_records_payment_date ON public.tenant_payment_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_records_status ON public.tenant_payment_records(status);

-- Enable RLS on new tables
ALTER TABLE public.tenant_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_payment_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_bills
CREATE POLICY "Tenants can view own bills" ON public.tenant_bills 
FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "System can create bills" ON public.tenant_bills 
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update bills" ON public.tenant_bills 
FOR UPDATE USING (true);

CREATE POLICY "System can delete bills" ON public.tenant_bills 
FOR DELETE USING (true);

-- RLS Policies for tenant_payment_records
CREATE POLICY "Tenants can view own payment records" ON public.tenant_payment_records 
FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "System can create payment records" ON public.tenant_payment_records 
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payment records" ON public.tenant_payment_records 
FOR UPDATE USING (true);

-- Add updated_at trigger for new tables
CREATE TRIGGER update_tenant_bills_updated_at 
BEFORE UPDATE ON public.tenant_bills 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_payment_records_updated_at 
BEFORE UPDATE ON public.tenant_payment_records 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.tenant_bills IS 'Bills that tenants see in their portal, synced from admin invoices';
COMMENT ON TABLE public.tenant_payment_records IS 'Payment history for tenants, automatically created when invoices are marked as paid';

COMMENT ON COLUMN public.tenant_bills.bill_type IS 'Type of bill: Rent, Utilities, Maintenance, etc.';
COMMENT ON COLUMN public.tenant_bills.bill_period_start IS 'Start date of the billing period';
COMMENT ON COLUMN public.tenant_bills.bill_period_end IS 'End date of the billing period';

COMMENT ON COLUMN public.tenant_payment_records.payment_type IS 'Type of payment: Rent Payment, Security Deposit, etc.';
COMMENT ON COLUMN public.tenant_payment_records.reference_number IS 'Transaction reference or confirmation number';
