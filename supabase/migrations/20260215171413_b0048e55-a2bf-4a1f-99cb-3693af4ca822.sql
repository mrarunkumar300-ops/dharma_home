
-- 1. Add unit_id column to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS rent_amount numeric;

-- 2. Create tenant_payment_methods table
CREATE TABLE IF NOT EXISTS public.tenant_payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants_profile(id) ON DELETE CASCADE,
  method_type text NOT NULL,
  provider text NOT NULL,
  method_identifier text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  gateway_customer_id text,
  gateway_payment_method_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own payment methods" ON public.tenant_payment_methods;
CREATE POLICY "Tenants can view own payment methods" ON public.tenant_payment_methods
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenants can manage own payment methods" ON public.tenant_payment_methods;
CREATE POLICY "Tenants can manage own payment methods" ON public.tenant_payment_methods
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all payment methods" ON public.tenant_payment_methods;
CREATE POLICY "Admins can view all payment methods" ON public.tenant_payment_methods
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- 3. Create payment_attempts table
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants_profile(id),
  amount numeric NOT NULL,
  gateway_provider text NOT NULL,
  gateway_transaction_id text,
  status text NOT NULL DEFAULT 'initiated',
  gateway_response jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own payment attempts" ON public.payment_attempts;
CREATE POLICY "Tenants can view own payment attempts" ON public.payment_attempts
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenants can create payment attempts" ON public.payment_attempts;
CREATE POLICY "Tenants can create payment attempts" ON public.payment_attempts
  FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenants can update own payment attempts" ON public.payment_attempts;
CREATE POLICY "Tenants can update own payment attempts" ON public.payment_attempts
  FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all payment attempts" ON public.payment_attempts;
CREATE POLICY "Admins can view all payment attempts" ON public.payment_attempts
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- 4. Create tenant_complaints table
CREATE TABLE IF NOT EXISTS public.tenant_complaints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants_profile(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  image_urls text[] DEFAULT '{}',
  assigned_to uuid,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own complaints" ON public.tenant_complaints;
CREATE POLICY "Tenants can view own complaints" ON public.tenant_complaints
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenants can create complaints" ON public.tenant_complaints;
CREATE POLICY "Tenants can create complaints" ON public.tenant_complaints
  FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenants can update own complaints" ON public.tenant_complaints;
CREATE POLICY "Tenants can update own complaints" ON public.tenant_complaints
  FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all complaints" ON public.tenant_complaints;
CREATE POLICY "Admins can manage all complaints" ON public.tenant_complaints
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- 5. Create get_upcoming_payments function
CREATE OR REPLACE FUNCTION public.get_upcoming_payments(_tenant_id uuid, _days_ahead integer DEFAULT 30)
RETURNS TABLE(invoice_id uuid, bill_number text, amount numeric, due_date date, days_until_due integer, late_fee numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tb.id as invoice_id,
    tb.bill_number,
    tb.amount,
    tb.due_date,
    (tb.due_date - CURRENT_DATE)::integer as days_until_due,
    0::numeric as late_fee
  FROM tenant_bills tb
  WHERE tb.tenant_id = _tenant_id
    AND tb.status IN ('pending', 'overdue')
    AND tb.due_date <= CURRENT_DATE + (_days_ahead || ' days')::interval
  ORDER BY tb.due_date ASC;
END;
$$;

-- 6. Create get_tenant_payment_statistics function
CREATE OR REPLACE FUNCTION public.get_tenant_payment_statistics(_tenant_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_paid', COALESCE((SELECT SUM(p.amount) FROM payments p JOIN tenant_payment_records tpr ON tpr.payment_id = p.id WHERE tpr.tenant_id = _tenant_id), 0),
    'pending_amount', COALESCE((SELECT SUM(tb.amount) FROM tenant_bills tb WHERE tb.tenant_id = _tenant_id AND tb.status = 'pending'), 0),
    'overdue_amount', COALESCE((SELECT SUM(tb.amount) FROM tenant_bills tb WHERE tb.tenant_id = _tenant_id AND tb.status = 'overdue'), 0),
    'total_bills', (SELECT COUNT(*) FROM tenant_bills WHERE tenant_id = _tenant_id),
    'paid_bills', (SELECT COUNT(*) FROM tenant_bills WHERE tenant_id = _tenant_id AND status = 'paid')
  ) INTO result;
  RETURN result;
END;
$$;

-- 7. Add updated_at triggers
CREATE OR REPLACE TRIGGER update_tenant_payment_methods_updated_at
  BEFORE UPDATE ON public.tenant_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_tenant_complaints_updated_at
  BEFORE UPDATE ON public.tenant_complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
