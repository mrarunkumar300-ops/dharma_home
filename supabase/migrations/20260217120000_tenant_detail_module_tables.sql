-- Tenant Detail Module Database Schema
-- Adds support for family members, documents, electricity meter readings
-- and enhanced tenant profile management

-- Family Members Table
CREATE TABLE IF NOT EXISTS public.tenant_family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT NOT NULL, -- 'spouse', 'child', 'parent', 'sibling', 'other'
  mobile_number TEXT,
  date_of_birth DATE,
  occupation TEXT,
  is_emergency_contact BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents Table
CREATE TABLE IF NOT EXISTS public.tenant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'aadhar', 'pan', 'agreement', 'passport', 'driving_license', 'other'
  document_number TEXT,
  document_name TEXT NOT NULL,
  file_url TEXT,
  file_size NUMERIC, -- in bytes
  file_type TEXT, -- 'pdf', 'jpg', 'png', etc.
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Electricity Meter Readings Table
CREATE TABLE IF NOT EXISTS public.electricity_meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  reading_month DATE NOT NULL, -- First day of the month
  previous_reading NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_reading NUMERIC(10,2) NOT NULL DEFAULT 0,
  units_used NUMERIC(10,2) GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
  unit_rate NUMERIC(8,4) NOT NULL DEFAULT 0, -- Rate per unit
  total_amount NUMERIC(10,2) GENERATED ALWAYS AS (units_used * unit_rate) STORED,
  reading_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES auth.users(id),
  is_final BOOLEAN DEFAULT FALSE, -- Mark as final billing reading
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, unit_id, reading_month) -- One reading per tenant per unit per month
);

-- Enhanced Emergency Contact in tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_mobile TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_family_members_tenant_id ON public.tenant_family_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_family_members_org_id ON public.tenant_family_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_tenant_id ON public.tenant_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_org_id ON public.tenant_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_type ON public.tenant_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_electricity_meter_readings_tenant_id ON public.electricity_meter_readings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_electricity_meter_readings_unit_id ON public.electricity_meter_readings(unit_id);
CREATE INDEX IF NOT EXISTS idx_electricity_meter_readings_month ON public.electricity_meter_readings(reading_month);

-- Row Level Security Policies

-- Family Members RLS
ALTER TABLE public.tenant_family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view family members" ON public.tenant_family_members FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id)
);

CREATE POLICY "Admins can insert family members" ON public.tenant_family_members FOR INSERT WITH CHECK (
  public.is_org_member(auth.uid(), organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN auth.users u ON ur.user_id = u.id 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update family members" ON public.tenant_family_members FOR UPDATE USING (
  public.is_org_member(auth.uid(), organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN auth.users u ON ur.user_id = u.id 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete family members" ON public.tenant_family_members FOR DELETE USING (
  public.is_org_member(auth.uid(), organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN auth.users u ON ur.user_id = u.id 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
  )
);

-- Documents RLS
ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view documents" ON public.tenant_documents FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id)
);

CREATE POLICY "Admins can insert documents" ON public.tenant_documents FOR INSERT WITH CHECK (
  public.is_org_member(auth.uid(), organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN auth.users u ON ur.user_id = u.id 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update documents" ON public.tenant_documents FOR UPDATE USING (
  public.is_org_member(auth.uid(), organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN auth.users u ON ur.user_id = u.id 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete documents" ON public.tenant_documents FOR DELETE USING (
  public.is_org_member(auth.uid(), organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN auth.users u ON ur.user_id = u.id 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
  )
);

-- Electricity Meter Readings RLS
ALTER TABLE public.electricity_meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view meter readings" ON public.electricity_meter_readings FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id)
);

CREATE POLICY "Admins can insert meter readings" ON public.electricity_meter_readings FOR INSERT WITH CHECK (
  public.is_org_member(auth.uid(), organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN auth.users u ON ur.user_id = u.id 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update meter readings" ON public.electricity_meter_readings FOR UPDATE USING (
  public.is_org_member(auth.uid(), organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN auth.users u ON ur.user_id = u.id 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete meter readings" ON public.electricity_meter_readings FOR DELETE USING (
  public.is_org_member(auth.uid(), organization_id) AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN auth.users u ON ur.user_id = u.id 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
  )
);

-- Helper Functions

-- Function to get tenant complete profile
CREATE OR REPLACE FUNCTION public.get_tenant_complete_profile(_tenant_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'tenant', (
      SELECT json_build_object(
        'id', t.id,
        'name', t.name,
        'email', t.email,
        'phone', t.phone,
        'address', t.address,
        'emergency_contact_name', t.emergency_contact_name,
        'emergency_contact_relation', t.emergency_contact_relation,
        'emergency_contact_mobile', t.emergency_contact_mobile,
        'lease_start', t.lease_start,
        'lease_end', t.lease_end,
        'rent_amount', t.rent_amount,
        'security_deposit', t.security_deposit,
        'status', t.status,
        'property_id', t.property_id,
        'unit_id', t.unit_id
      )
      FROM public.tenants t WHERE t.id = _tenant_id
    ),
    'family_members', (
      SELECT json_agg(
        json_build_object(
          'id', fm.id,
          'name', fm.name,
          'relation', fm.relation,
          'mobile_number', fm.mobile_number,
          'date_of_birth', fm.date_of_birth,
          'occupation', fm.occupation,
          'is_emergency_contact', fm.is_emergency_contact
        )
      )
      FROM public.tenant_family_members fm WHERE fm.tenant_id = _tenant_id
    ),
    'documents', (
      SELECT json_agg(
        json_build_object(
          'id', d.id,
          'document_type', d.document_type,
          'document_number', d.document_number,
          'document_name', d.document_name,
          'file_url', d.file_url,
          'file_size', d.file_size,
          'file_type', d.file_type,
          'upload_date', d.upload_date,
          'expiry_date', d.expiry_date,
          'is_verified', d.is_verified
        )
      )
      FROM public.tenant_documents d WHERE d.tenant_id = _tenant_id
    ),
    'room_info', (
      SELECT json_build_object(
        'unit', u.unit_number,
        'property', p.name,
        'property_address', p.address,
        'floor', u.floor,
        'rent', u.rent,
        'join_date', t.lease_start,
        'end_date', t.lease_end,
        'security_deposit', t.security_deposit,
        'monthly_rent', t.rent_amount
      )
      FROM public.tenants t
      JOIN public.units u ON t.unit_id = u.id
      JOIN public.properties p ON u.property_id = p.id
      WHERE t.id = _tenant_id
    ),
    'recent_meter_readings', (
      SELECT json_agg(
        json_build_object(
          'id', emr.id,
          'reading_month', emr.reading_month,
          'previous_reading', emr.previous_reading,
          'current_reading', emr.current_reading,
          'units_used', emr.units_used,
          'unit_rate', emr.unit_rate,
          'total_amount', emr.total_amount,
          'reading_date', emr.reading_date
        )
        ORDER BY emr.reading_month DESC
        LIMIT 6
      )
      FROM public.electricity_meter_readings emr WHERE emr.tenant_id = _tenant_id
    )
  );
$$;

-- Function to get tenant bills with payment history
CREATE OR REPLACE FUNCTION public.get_tenant_bills_with_payments(_tenant_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_agg(
    json_build_object(
      'id', i.id,
      'invoice_number', i.invoice_number,
      'bill_type', COALESCE(i.bill_type, 'Rent'),
      'amount', i.amount,
      'issue_date', i.issue_date,
      'due_date', i.due_date,
      'status', i.status,
      'payments', (
        SELECT json_agg(
          json_build_object(
            'id', p.id,
            'amount', p.amount,
            'payment_date', p.payment_date,
            'payment_method', p.payment_method,
            'status', p.status
          )
        )
        FROM public.payments p WHERE p.invoice_id = i.id
      ),
      'total_paid', COALESCE((
        SELECT SUM(p.amount) FROM public.payments p WHERE p.invoice_id = i.id
      ), 0),
      'remaining_balance', i.amount - COALESCE((
        SELECT SUM(p.amount) FROM public.payments p WHERE p.invoice_id = i.id
      ), 0)
    )
  )
  FROM public.invoices i WHERE i.tenant_id = _tenant_id
  ORDER BY i.issue_date DESC;
$$;

-- Add bill_type column to invoices if not exists
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS bill_type TEXT DEFAULT 'Rent';

-- Trigger to automatically set organization_id for new records
CREATE OR REPLACE FUNCTION public.set_tenant_related_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id based on tenant
  IF TG_TABLE_NAME = 'tenant_family_members' THEN
    NEW.organization_id := (SELECT organization_id FROM public.tenants WHERE id = NEW.tenant_id);
  ELSIF TG_TABLE_NAME = 'tenant_documents' THEN
    NEW.organization_id := (SELECT organization_id FROM public.tenants WHERE id = NEW.tenant_id);
  ELSIF TG_TABLE_NAME = 'electricity_meter_readings' THEN
    NEW.organization_id := (SELECT organization_id FROM public.tenants WHERE id = NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS set_family_member_org_id_trigger ON public.tenant_family_members;
CREATE TRIGGER set_family_member_org_id_trigger
  BEFORE INSERT ON public.tenant_family_members
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_related_organization_id();

DROP TRIGGER IF EXISTS set_document_org_id_trigger ON public.tenant_documents;
CREATE TRIGGER set_document_org_id_trigger
  BEFORE INSERT ON public.tenant_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_related_organization_id();

DROP TRIGGER IF EXISTS set_meter_reading_org_id_trigger ON public.electricity_meter_readings;
CREATE TRIGGER set_meter_reading_org_id_trigger
  BEFORE INSERT ON public.electricity_meter_readings
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_related_organization_id();
