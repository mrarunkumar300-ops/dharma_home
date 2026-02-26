
-- Drop the old trigger and function with CASCADE
DROP FUNCTION IF EXISTS public.sync_invoice_to_tenant_bill() CASCADE;

-- Recreate the fixed sync function
CREATE OR REPLACE FUNCTION public.sync_invoice_to_tenant_bill()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile_id uuid;
BEGIN
  IF NEW.tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO _profile_id
  FROM public.tenants_profile
  WHERE tenant_record_id = NEW.tenant_id
  LIMIT 1;

  IF _profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.tenant_bills (
    tenant_id, bill_number, bill_type, amount, due_date,
    bill_period_start, bill_period_end, status
  ) VALUES (
    _profile_id, NEW.invoice_number, 'Rent', NEW.amount, NEW.due_date,
    DATE_TRUNC('month', NEW.due_date)::date,
    (DATE_TRUNC('month', NEW.due_date) + INTERVAL '1 month - 1 day')::date,
    NEW.status
  )
  ON CONFLICT (tenant_id, bill_number) 
  DO UPDATE SET
    amount = EXCLUDED.amount,
    due_date = EXCLUDED.due_date,
    status = EXCLUDED.status,
    updated_at = now();

  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'paid') THEN
    INSERT INTO public.payments (
      organization_id, amount, payment_method, invoice_id, status, payment_date
    ) VALUES (
      NEW.organization_id, NEW.amount, 'Bank Transfer', NEW.id, 'completed', CURRENT_DATE
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER sync_invoice_tenant_bill
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_invoice_to_tenant_bill();

-- Add unique constraint for upsert
DO $$
BEGIN
  ALTER TABLE public.tenant_bills 
  ADD CONSTRAINT uq_tenant_bills_tenant_bill_number 
  UNIQUE (tenant_id, bill_number);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
