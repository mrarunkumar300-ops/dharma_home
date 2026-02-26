
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  units_count INTEGER NOT NULL DEFAULT 0,
  occupied_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  image_emoji TEXT DEFAULT '🏢',
  revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  lease_start DATE,
  lease_end DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Units table
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  rent NUMERIC(10,2) NOT NULL DEFAULT 0,
  availability TEXT NOT NULL DEFAULT 'available',
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance tickets table
CREATE TABLE public.maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ticket comments
CREATE TABLE public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant documents
CREATE TABLE public.tenant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  document_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Helper: check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get user org
CREATE OR REPLACE FUNCTION public.get_user_org(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = _user_id
$$;

-- Helper: is member of org
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND organization_id = _org_id
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_tickets_updated_at BEFORE UPDATE ON public.maintenance_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view org members" ON public.profiles FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Organizations
CREATE POLICY "Members can view org" ON public.organizations FOR SELECT USING (public.is_org_member(auth.uid(), id));
CREATE POLICY "Authenticated can create org" ON public.organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update org" ON public.organizations FOR UPDATE USING (public.is_org_member(auth.uid(), id) AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete org" ON public.organizations FOR DELETE USING (public.is_org_member(auth.uid(), id) AND public.has_role(auth.uid(), 'admin'));

-- Properties
CREATE POLICY "Members can view properties" ON public.properties FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can create properties" ON public.properties FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can update properties" ON public.properties FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admins can delete properties" ON public.properties FOR DELETE USING (public.is_org_member(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin'));

-- Tenants
CREATE POLICY "Members can view tenants" ON public.tenants FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can create tenants" ON public.tenants FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can update tenants" ON public.tenants FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admins can delete tenants" ON public.tenants FOR DELETE USING (public.is_org_member(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin'));

-- Units
CREATE POLICY "Members can view units" ON public.units FOR SELECT USING (
  public.is_org_member(auth.uid(), (SELECT organization_id FROM public.properties WHERE id = property_id))
);
CREATE POLICY "Members can create units" ON public.units FOR INSERT WITH CHECK (
  public.is_org_member(auth.uid(), (SELECT organization_id FROM public.properties WHERE id = property_id))
);
CREATE POLICY "Members can update units" ON public.units FOR UPDATE USING (
  public.is_org_member(auth.uid(), (SELECT organization_id FROM public.properties WHERE id = property_id))
);
CREATE POLICY "Admins can delete units" ON public.units FOR DELETE USING (
  public.is_org_member(auth.uid(), (SELECT organization_id FROM public.properties WHERE id = property_id))
  AND public.has_role(auth.uid(), 'admin')
);

-- Invoices
CREATE POLICY "Members can view invoices" ON public.invoices FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can create invoices" ON public.invoices FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can update invoices" ON public.invoices FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admins can delete invoices" ON public.invoices FOR DELETE USING (public.is_org_member(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin'));

-- Payments
CREATE POLICY "Members can view payments" ON public.payments FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can create payments" ON public.payments FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can update payments" ON public.payments FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admins can delete payments" ON public.payments FOR DELETE USING (public.is_org_member(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin'));

-- Expenses
CREATE POLICY "Members can view expenses" ON public.expenses FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can create expenses" ON public.expenses FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can update expenses" ON public.expenses FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admins can delete expenses" ON public.expenses FOR DELETE USING (public.is_org_member(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin'));

-- Maintenance tickets
CREATE POLICY "Members can view tickets" ON public.maintenance_tickets FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can create tickets" ON public.maintenance_tickets FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can update tickets" ON public.maintenance_tickets FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admins can delete tickets" ON public.maintenance_tickets FOR DELETE USING (public.is_org_member(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin'));

-- Ticket comments
CREATE POLICY "Members can view comments" ON public.ticket_comments FOR SELECT USING (
  public.is_org_member(auth.uid(), (SELECT organization_id FROM public.maintenance_tickets WHERE id = ticket_id))
);
CREATE POLICY "Members can create comments" ON public.ticket_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  public.is_org_member(auth.uid(), (SELECT organization_id FROM public.maintenance_tickets WHERE id = ticket_id))
);
CREATE POLICY "Users can update own comments" ON public.ticket_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete comments" ON public.ticket_comments FOR DELETE USING (
  public.is_org_member(auth.uid(), (SELECT organization_id FROM public.maintenance_tickets WHERE id = ticket_id))
  AND public.has_role(auth.uid(), 'admin')
);

-- Tenant documents
CREATE POLICY "Members can view documents" ON public.tenant_documents FOR SELECT USING (
  public.is_org_member(auth.uid(), (SELECT organization_id FROM public.tenants WHERE id = tenant_id))
);
CREATE POLICY "Members can create documents" ON public.tenant_documents FOR INSERT WITH CHECK (
  public.is_org_member(auth.uid(), (SELECT organization_id FROM public.tenants WHERE id = tenant_id))
);
CREATE POLICY "Members can update documents" ON public.tenant_documents FOR UPDATE USING (
  public.is_org_member(auth.uid(), (SELECT organization_id FROM public.tenants WHERE id = tenant_id))
);
CREATE POLICY "Admins can delete documents" ON public.tenant_documents FOR DELETE USING (
  public.is_org_member(auth.uid(), (SELECT organization_id FROM public.tenants WHERE id = tenant_id))
  AND public.has_role(auth.uid(), 'admin')
);

-- Activity log
CREATE POLICY "Members can view activity" ON public.activity_log FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can create activity" ON public.activity_log FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
