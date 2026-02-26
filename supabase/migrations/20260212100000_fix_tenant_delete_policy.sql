-- Fix tenant deletion policy to allow managers to delete tenants
DROP POLICY IF EXISTS "Admins can delete tenants" ON public.tenants;

CREATE POLICY "Members can delete tenants" ON public.tenants FOR DELETE USING (public.is_org_member(auth.uid(), organization_id));
