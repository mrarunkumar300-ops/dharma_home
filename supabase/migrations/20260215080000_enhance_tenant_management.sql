-- Enhanced Tenant Management Schema for Phase 1
-- Add missing fields to support security deposits, agreement documents, and enhanced tenant management

-- Add new columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rent_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS agreement_document_url TEXT,
ADD COLUMN IF NOT EXISTS create_user_account BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_unit_id ON public.tenants(unit_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

-- Add constraint to ensure lease_end is after lease_start
ALTER TABLE public.tenants 
ADD CONSTRAINT lease_dates_check 
CHECK (lease_end IS NULL OR lease_start IS NULL OR lease_end > lease_start);

-- Update RLS policies to handle new fields
CREATE POLICY "Members can view tenant property assignments" ON public.tenants FOR SELECT USING (
  public.is_org_member(auth.uid(), organization_id)
);

-- Function to automatically update unit availability when tenant is assigned
CREATE OR REPLACE FUNCTION public.update_unit_availability_on_tenant_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.unit_id IS NOT NULL THEN
      UPDATE public.units 
      SET tenant_id = NEW.id, availability = 'occupied' 
      WHERE id = NEW.unit_id;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If unit changed
    IF OLD.unit_id IS DISTINCT FROM NEW.unit_id THEN
      -- Free up old unit
      IF OLD.unit_id IS NOT NULL THEN
        UPDATE public.units 
        SET tenant_id = NULL, availability = 'available' 
        WHERE id = OLD.unit_id;
      END IF;
      
      -- Assign new unit
      IF NEW.unit_id IS NOT NULL THEN
        UPDATE public.units 
        SET tenant_id = NEW.id, availability = 'occupied' 
        WHERE id = NEW.unit_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.unit_id IS NOT NULL THEN
      UPDATE public.units 
      SET tenant_id = NULL, availability = 'available' 
      WHERE id = OLD.unit_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic unit availability management
DROP TRIGGER IF EXISTS tenant_unit_availability_trigger ON public.tenants;
CREATE TRIGGER tenant_unit_availability_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_unit_availability_on_tenant_change();

-- Function to get tenant statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_tenant_statistics(_org_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_tenants', COUNT(*)::int,
    'active_tenants', COUNT(*) FILTER (WHERE status = 'active')::int,
    'inactive_tenants', COUNT(*) FILTER (WHERE status = 'inactive')::int,
    'expiring_tenants', COUNT(*) FILTER (WHERE status = 'expiring')::int,
    'tenants_with_units', COUNT(*) FILTER (WHERE unit_id IS NOT NULL)::int,
    'total_rent_collected', COALESCE(SUM(rent_amount), 0)::numeric,
    'total_security_deposits', COALESCE(SUM(security_deposit), 0)::numeric,
    'occupancy_rate', CASE 
      WHEN (SELECT COUNT(*) FROM public.units WHERE property_id IN (SELECT id FROM public.properties WHERE organization_id = _org_id)) > 0 
      THEN ROUND(
        (COUNT(*) FILTER (WHERE unit_id IS NOT NULL)::numeric / 
         (SELECT COUNT(*) FROM public.units WHERE property_id IN (SELECT id FROM public.properties WHERE organization_id = _org_id))::numeric * 100, 2
      )
      ELSE 0
    END
  )
  FROM public.tenants 
  WHERE organization_id = _org_id;
$$;

-- Function to check unit availability before assignment
CREATE OR REPLACE FUNCTION public.check_unit_availability(_unit_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT availability = 'available' OR availability = 'vacant' 
  FROM public.units 
  WHERE id = _unit_id;
$$;

-- Function to get available units for a property
CREATE OR REPLACE FUNCTION public.get_available_units(_property_id UUID)
RETURNS TABLE (
  id UUID,
  unit_number TEXT,
  rent NUMERIC,
  availability TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id,
    u.unit_number,
    u.rent,
    u.availability
  FROM public.units u
  WHERE u.property_id = _property_id 
    AND (u.availability = 'available' OR u.availability = 'vacant')
  ORDER BY u.unit_number;
$$;
