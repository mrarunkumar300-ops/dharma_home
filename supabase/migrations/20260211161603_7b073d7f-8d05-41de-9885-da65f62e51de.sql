
-- Fix overly permissive organizations INSERT policy
DROP POLICY "Authenticated can create org" ON public.organizations;
CREATE POLICY "Authenticated can create org" ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
