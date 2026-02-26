-- Add create_user_account column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS create_user_account BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.tenants.create_user_account IS 'Flag to indicate whether a user account should be created for this tenant';
