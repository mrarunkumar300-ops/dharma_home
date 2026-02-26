-- Add security_deposit column to tenants_profile table
-- This ensures the security_deposit column exists in both tenant tables

-- Add security_deposit column to tenants_profile table
ALTER TABLE public.tenants_profile 
ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2);

-- Add comment to the column
COMMENT ON COLUMN public.tenants_profile.security_deposit IS 'Security deposit amount for the tenant';

-- Update existing tenant profiles to have default security deposit of 0 if null
UPDATE public.tenants_profile 
SET security_deposit = 0 
WHERE security_deposit IS NULL;

-- Refresh materialized view that depends on tenants_profile
REFRESH MATERIALIZED VIEW CONCURRENTLY public.tenant_analytics;
