-- Create function to sync invoices to tenant bills
-- This function will be called when admin creates/updates invoices

CREATE OR REPLACE FUNCTION public.sync_invoice_to_tenant_bill()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update tenant bill when invoice is created/updated
    INSERT INTO public.tenant_bills (
        tenant_id,
        bill_number,
        bill_type,
        amount,
        due_date,
        bill_period_start,
        bill_period_end,
        status,
        created_at,
        updated_at
    )
    SELECT 
        tp.id as tenant_id,
        i.invoice_number as bill_number,
        'Rent' as bill_type,
        i.amount as amount,
        i.due_date as due_date,
        DATE_TRUNC('month', i.due_date) as bill_period_start,
        (DATE_TRUNC('month', i.due_date) + INTERVAL '1 month - 1 day') as bill_period_end,
        i.status as status,
        i.created_at as created_at,
        i.updated_at as updated_at
    FROM public.invoices i
    JOIN public.tenants t ON i.tenant_id = t.id
    JOIN public.tenants_profile tp ON t.id = tp.tenant_id
    WHERE i.id = NEW.id
    ON CONFLICT (tenant_id, bill_number) 
    DO UPDATE SET
        amount = EXCLUDED.amount,
        due_date = EXCLUDED.due_date,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at;
    
    -- Also create payment record when invoice is marked as paid
    IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
        INSERT INTO public.tenant_payment_records (
            tenant_id,
            payment_type,
            description,
            amount,
            payment_date,
            payment_method,
            status,
            created_at
        )
        SELECT 
            tp.id as tenant_id,
            'Rent Payment' as payment_type,
            'Payment for invoice ' || i.invoice_number as description,
            i.amount as amount,
            i.updated_at as payment_date,
            'Bank Transfer' as payment_method,
            'completed' as status,
            i.updated_at as created_at
        FROM public.invoices i
        JOIN public.tenants t ON i.tenant_id = t.id  
        JOIN public.tenants_profile tp ON t.id = tp.tenant_id
        WHERE i.id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync invoices to tenant bills
DROP TRIGGER IF EXISTS sync_invoice_to_tenant_bill_trigger ON public.invoices;
CREATE TRIGGER sync_invoice_to_tenant_bill_trigger
    AFTER INSERT OR UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_invoice_to_tenant_bill();
