-- Multi-Tenant System Schema
-- Add tenant role to existing enum
ALTER TYPE public.app_role ADD VALUE 'tenant';

-- Tenants table (for tenant registration and management)
CREATE TABLE public.tenants_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_code VARCHAR(20) UNIQUE NOT NULL, -- Unique tenant identifier
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  id_proof_type TEXT, -- 'aadhar', 'passport', 'driving_license', etc.
  id_proof_url TEXT,
  profile_photo_url TEXT,
  date_of_birth DATE,
  gender TEXT, -- 'male', 'female', 'other'
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant room assignments
CREATE TABLE public.tenant_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants_profile(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  room_number TEXT NOT NULL,
  floor_number INTEGER,
  rent_amount NUMERIC(10,2) NOT NULL,
  security_deposit NUMERIC(10,2),
  agreement_start_date DATE NOT NULL,
  agreement_end_date DATE,
  agreement_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'vacated', 'pending'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant family members
CREATE TABLE public.tenant_family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants_profile(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- 'spouse', 'child', 'parent', 'sibling', etc.
  age INTEGER,
  gender TEXT,
  phone TEXT,
  id_proof_type TEXT,
  id_proof_url TEXT,
  photo_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant documents
CREATE TABLE IF NOT EXISTS public.tenant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants_profile(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL, -- 'id_proof', 'agreement', 'photo', 'other'
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant bills (electricity, water, maintenance, etc.)
CREATE TABLE public.tenant_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants_profile(id) ON DELETE CASCADE NOT NULL,
  bill_type TEXT NOT NULL, -- 'electricity', 'water', 'maintenance', 'other'
  bill_number TEXT,
  bill_period_start DATE NOT NULL,
  bill_period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
  bill_document_url TEXT,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant-specific payments (link to main payments table)
CREATE TABLE public.tenant_payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants_profile(id) ON DELETE CASCADE NOT NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
  payment_type TEXT NOT NULL, -- 'rent', 'deposit', 'bill', 'maintenance'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.tenants_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_payment_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants_profile
CREATE POLICY "Tenants can view own profile" ON public.tenants_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all tenant profiles" ON public.tenants_profile FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Tenants can update own profile" ON public.tenants_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all tenant profiles" ON public.tenants_profile FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for tenant_rooms
CREATE POLICY "Tenants can view own rooms" ON public.tenant_rooms FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all tenant rooms" ON public.tenant_rooms FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for tenant_family_members
CREATE POLICY "Tenants can view own family members" ON public.tenant_family_members FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all tenant family members" ON public.tenant_family_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Tenants can manage own family members" ON public.tenant_family_members FOR ALL USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all tenant family members" ON public.tenant_family_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for tenant_documents
CREATE POLICY "Tenants can view own documents" ON public.tenant_documents FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all tenant documents" ON public.tenant_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Tenants can manage own documents" ON public.tenant_documents FOR ALL USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all tenant documents" ON public.tenant_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for tenant_bills
CREATE POLICY "Tenants can view own bills" ON public.tenant_bills FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all tenant bills" ON public.tenant_bills FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for tenant_payment_records
CREATE POLICY "Tenants can view own payment records" ON public.tenant_payment_records FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all tenant payment records" ON public.tenant_payment_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Helper function to get tenant ID from user ID
CREATE OR REPLACE FUNCTION public.get_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.tenants_profile WHERE user_id = _user_id LIMIT 1;
$$;

-- Function to generate unique tenant code
CREATE OR REPLACE FUNCTION public.generate_tenant_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'TEN' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 8, '0');
    SELECT EXISTS(SELECT 1 FROM public.tenants_profile WHERE tenant_code = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_tenants_profile_updated_at BEFORE UPDATE ON public.tenants_profile FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenant_rooms_updated_at BEFORE UPDATE ON public.tenant_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenant_family_members_updated_at BEFORE UPDATE ON public.tenant_family_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenant_documents_updated_at BEFORE UPDATE ON public.tenant_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenant_bills_updated_at BEFORE UPDATE ON public.tenant_bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
