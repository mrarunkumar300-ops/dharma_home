-- Fix the circular dependency issue in user_roles RLS policies
-- The original policies create a chicken-and-egg problem where you need to be an admin to read roles,
-- but you need to read roles to know if you're an admin.

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create new policies that allow users to read their own roles without circular dependency
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own roles (needed during signup)
CREATE POLICY "Users can insert own roles" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow admins to manage all roles (but only if they can already read their own admin role)
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
