
-- Add subscription/plan fields to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS plan_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_valid_until date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Add index on organization status for quick filtering
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- Super admins need full CRUD on organizations
CREATE POLICY "Super admins can update all orgs"
ON public.organizations FOR UPDATE
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete all orgs"
ON public.organizations FOR DELETE
USING (is_super_admin(auth.uid()));

-- Add unique constraint on user_roles to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Add unique constraint on user_permissions to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_permissions_user_id_permission_key'
  ) THEN
    ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_user_id_permission_key UNIQUE (user_id, permission);
  END IF;
END $$;
