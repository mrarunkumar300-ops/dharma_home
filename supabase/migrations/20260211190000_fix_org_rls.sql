-- Fix RLS policy for organizations to allow authenticated users to create their first org
DROP POLICY IF EXISTS "Authenticated can create org" ON public.organizations;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.organizations;

CREATE POLICY "Allow authenticated users to insert"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
