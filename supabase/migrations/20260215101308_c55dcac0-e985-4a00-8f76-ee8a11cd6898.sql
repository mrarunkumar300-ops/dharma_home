
-- 1. Add tenant_record_id column to link tenants_profile with tenants table
ALTER TABLE public.tenants_profile 
ADD COLUMN IF NOT EXISTS tenant_record_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;

-- 2. Backfill: create tenants_profile records for existing tenants that have auth users
-- Match by email between tenants and profiles (auth users)
INSERT INTO public.tenants_profile (user_id, tenant_code, full_name, email, phone, status, tenant_record_id)
SELECT 
  p.id as user_id,
  'TEN' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 8, '0') || row_number() OVER () as tenant_code,
  t.name as full_name,
  t.email,
  t.phone,
  t.status,
  t.id as tenant_record_id
FROM public.tenants t
JOIN public.profiles p ON LOWER(p.email) = LOWER(t.email)
JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'tenant'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants_profile tp WHERE tp.user_id = p.id
)
AND t.email IS NOT NULL;

-- 3. Create trigger function to sync invoices to tenant_bills
CREATE OR REPLACE FUNCTION public.sync_invoice_to_tenant_bill()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_profile_id uuid;
BEGIN
  -- Only process if invoice has a tenant_id
  IF NEW.tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the tenant_profile id linked to this tenant
  SELECT tp.id INTO _tenant_profile_id
  FROM tenants_profile tp
  WHERE tp.tenant_record_id = NEW.tenant_id
  LIMIT 1;

  -- If no profile found, skip
  IF _tenant_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO tenant_bills (
      tenant_id, bill_type, bill_number, amount, 
      bill_period_start, bill_period_end, due_date, status
    ) VALUES (
      _tenant_profile_id,
      'Invoice',
      NEW.invoice_number,
      NEW.amount,
      NEW.issue_date,
      NEW.due_date,
      NEW.due_date,
      NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE tenant_bills
    SET 
      amount = NEW.amount,
      due_date = NEW.due_date,
      status = NEW.status,
      updated_at = now()
    WHERE bill_number = NEW.invoice_number 
      AND tenant_id = _tenant_profile_id;
      
    -- If no rows updated (bill doesn't exist yet), insert it
    IF NOT FOUND THEN
      INSERT INTO tenant_bills (
        tenant_id, bill_type, bill_number, amount,
        bill_period_start, bill_period_end, due_date, status
      ) VALUES (
        _tenant_profile_id,
        'Invoice',
        NEW.invoice_number,
        NEW.amount,
        NEW.issue_date,
        NEW.due_date,
        NEW.due_date,
        NEW.status
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_invoice_to_tenant_bill ON public.invoices;
CREATE TRIGGER trigger_sync_invoice_to_tenant_bill
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_invoice_to_tenant_bill();

-- 5. Create trigger function to clean up tenant_bills on invoice delete
CREATE OR REPLACE FUNCTION public.delete_tenant_bill_on_invoice_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM tenant_bills WHERE bill_number = OLD.invoice_number;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_delete_tenant_bill ON public.invoices;
CREATE TRIGGER trigger_delete_tenant_bill
  AFTER DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_tenant_bill_on_invoice_delete();

-- 6. Backfill existing invoices into tenant_bills
INSERT INTO tenant_bills (tenant_id, bill_type, bill_number, amount, bill_period_start, bill_period_end, due_date, status)
SELECT 
  tp.id,
  'Invoice',
  i.invoice_number,
  i.amount,
  i.issue_date,
  i.due_date,
  i.due_date,
  i.status
FROM invoices i
JOIN tenants_profile tp ON tp.tenant_record_id = i.tenant_id
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_bills tb WHERE tb.bill_number = i.invoice_number AND tb.tenant_id = tp.id
);

-- 7. Add RLS policy for tenant_bills INSERT by admins
CREATE POLICY "Admins can create tenant bills"
ON public.tenant_bills
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- 8. Add RLS policy for tenant_bills UPDATE by admins
CREATE POLICY "Admins can update tenant bills"
ON public.tenant_bills
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- 9. Add RLS policy for tenant_bills DELETE by admins
CREATE POLICY "Admins can delete tenant bills"
ON public.tenant_bills
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  )
);
