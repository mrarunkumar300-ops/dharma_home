
-- Create a helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Allow super_admins to view ALL profiles (cross-org)
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Allow super_admins to update ALL profiles
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_super_admin(auth.uid()));

-- Allow super_admins to view ALL organizations
CREATE POLICY "Super admins can view all orgs"
ON public.organizations
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Allow super_admins to manage ALL user_roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Allow super_admins to view all activity logs
CREATE POLICY "Super admins can view all activity"
ON public.activity_log
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Allow super_admins to view all properties
CREATE POLICY "Super admins can view all properties"
ON public.properties
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Allow super_admins to view all tenants
CREATE POLICY "Super admins can view all tenants"
ON public.tenants
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Allow super_admins to view all units
CREATE POLICY "Super admins can view all units"
ON public.units
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Allow super_admins to view all invoices
CREATE POLICY "Super admins can view all invoices"
ON public.invoices
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Allow super_admins to view all payments
CREATE POLICY "Super admins can view all payments"
ON public.payments
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Allow super_admins INSERT on profiles (for managing users)
CREATE POLICY "Super admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));
