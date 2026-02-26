-- Fix security_deposit column in tenants table
-- Ensure the security_deposit column exists and is properly configured

-- Add security_deposit column if it doesn't exist
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2);

-- Add comment to the column
COMMENT ON COLUMN public.tenants.security_deposit IS 'Security deposit amount for the tenant';

-- Update existing tenants to have default security deposit of 0 if null
UPDATE public.tenants 
SET security_deposit = 0 
WHERE security_deposit IS NULL;

-- Refresh materialized view that depends on tenants
REFRESH MATERIALIZED VIEW CONCURRENTLY public.tenant_analytics;
