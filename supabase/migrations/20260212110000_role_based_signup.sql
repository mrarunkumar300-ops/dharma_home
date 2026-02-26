-- Create role-based signup system with proper RLS policies

-- Enable RLS on all tables if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Organization members can view profiles" ON public.profiles FOR SELECT 
USING (public.is_org_member(auth.uid(), organization_id));

-- User roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles" ON public.user_roles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organization members can view roles" ON public.user_roles FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = user_roles.user_id 
  AND public.is_org_member(auth.uid(), profiles.organization_id)
));

-- Organizations policies
DROP POLICY IF EXISTS "Users can view own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update own organizations" ON public.organizations;

CREATE POLICY "Users can view own organizations" ON public.organizations FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.organization_id = organizations.id 
  AND auth.uid() = profiles.id
));

CREATE POLICY "Admins can update own organizations" ON public.organizations FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE p.organization_id = organizations.id 
  AND auth.uid() = p.id
  AND ur.role = 'admin'
));

-- Function to check if user is organization member
CREATE OR REPLACE FUNCTION public.is_org_member(user_id UUID, org_id UUID) 
RETURNS BOOLEAN 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND organization_id = org_id
  );
$$;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT) 
RETURNS BOOLEAN 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id AND role = role_name
  );
$$;

-- Function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_org(user_id UUID) 
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT organization_id FROM public.profiles 
  WHERE id = user_id LIMIT 1;
$$;
