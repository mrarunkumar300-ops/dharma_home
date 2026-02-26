
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2);
ALTER TABLE public.tenants_profile ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2);
