-- Add property_id and unit_id columns to tenants table
-- These columns are needed for the frontend tenant management functionality

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rent_amount NUMERIC(10,2);

-- Add comments for documentation
COMMENT ON COLUMN public.tenants.property_id IS 'Reference to the property where the tenant resides';
COMMENT ON COLUMN public.tenants.unit_id IS 'Reference to the specific unit rented by the tenant';
COMMENT ON COLUMN public.tenants.rent_amount IS 'Monthly rent amount for the tenant';

-- Update RLS policies to handle the new columns
-- No policy changes needed as the existing organization-based policies will cover these columns

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_unit_id ON public.tenants(unit_id);
