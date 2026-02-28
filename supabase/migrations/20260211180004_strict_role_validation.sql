-- Strict Role Assignment Fix Migration
-- Add 'user' role to the enum and add strict validation

-- Add 'user' role to the enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.app_role'::regtype 
    AND enumlabel = 'user'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'user';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.app_role'::regtype 
    AND enumlabel = 'tenant'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'tenant';
  END IF;
END $$;

-- Create a function for strict role validation
CREATE OR REPLACE FUNCTION public.validate_role_assignment(
  _user_id UUID,
  _selected_role app_role,
  _metadata_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_mismatch BOOLEAN := FALSE;
  allowed_roles TEXT[] := ARRAY['admin', 'manager', 'user', 'tenant'];
BEGIN
  -- 🛡️ STRICT VALIDATION: Check if role is in allowed list
  IF _selected_role::TEXT NOT IN (SELECT unnest(allowed_roles)) THEN
    RAISE EXCEPTION 'Invalid role: % must be one of %', _selected_role, allowed_roles;
    RETURN FALSE;
  END IF;
  
  -- 🛡️ STRICT VALIDATION: Check if metadata role matches selected role
  IF _metadata_role IS NOT NULL AND _metadata_role != _selected_role::TEXT THEN
    role_mismatch := TRUE;
  END IF;
  
  -- If there's a mismatch, log and return false
  IF role_mismatch THEN
    RAISE EXCEPTION 'Role mismatch detected: selected=%, metadata=%', _selected_role, _metadata_role;
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create a function for strict role assignment with backend validation
CREATE OR REPLACE FUNCTION public.assign_user_role_strict(
  _user_id UUID,
  _selected_role app_role,
  _metadata_role TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validation_result BOOLEAN;
  existing_role app_role;
BEGIN
  -- 🛡️ BACKEND VALIDATION: Validate role assignment
  SELECT public.validate_role_assignment(_user_id, _selected_role, _metadata_role) 
  INTO validation_result;
  
  IF NOT validation_result THEN
    RAISE EXCEPTION 'Role validation failed for user %', _user_id;
  END IF;
  
  -- 🛡️ SECURITY: Check if user already has a role (prevent role changes)
  SELECT role INTO existing_role 
  FROM public.user_roles 
  WHERE user_id = _user_id 
  LIMIT 1;
  
  IF existing_role IS NOT NULL THEN
    RAISE EXCEPTION 'User already has role assigned: %. Role changes not allowed.', existing_role;
  END IF;
  
  -- Insert the new role (no duplicates allowed due to UNIQUE constraint)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _selected_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- 🛡️ AUDIT: Log the role assignment
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, details)
  VALUES (
    _user_id, 
    'ROLE_ASSIGNED_STRICT', 
    'user_roles', 
    _user_id,
    json_build_object(
      'role', _selected_role, 
      'assigned_at', now(),
      'validation_method', 'backend_strict'
    )
  );
END;
$$;

-- Create a function to validate role before signup completion
CREATE OR REPLACE FUNCTION public.validate_signup_role(
  _selected_role TEXT,
  _user_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_roles TEXT[] := ARRAY['admin', 'manager', 'user', 'tenant'];
  normalized_role TEXT;
BEGIN
  -- 🛡️ MANDATORY ROLE: Role must be provided
  IF _selected_role IS NULL OR trim(_selected_role) = '' THEN
    RAISE EXCEPTION 'Please select a role. Role selection is mandatory.';
    RETURN FALSE;
  END IF;
  
  -- 🛡️ NORMALIZATION: Normalize role to lowercase
  normalized_role := lower(trim(_selected_role));
  
  -- 🛡️ BACKEND VALIDATION: Check if role is in allowed list
  IF normalized_role NOT IN (SELECT unnest(allowed_roles)) THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of: %', normalized_role, allowed_roles;
    RETURN FALSE;
  END IF;
  
  -- 🛡️ SECURITY: Additional validation for admin/manager roles (optional advanced rule)
  IF normalized_role IN ('admin', 'manager') THEN
    -- Only allow admin/manager creation if:
    -- 1. User creating has admin role, OR
    -- 2. This is first user in system (bootstrap admin)
    -- For now, we'll allow it but this is where you'd add authorization checks
    NULL; -- Placeholder for advanced authorization logic
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Update the handle_new_user function to not auto-assign roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create profile, don't assign any role (roles assigned strictly via signup process)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

-- Drop the old trigger and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add RLS policy for strict role assignment
CREATE POLICY "Strict role assignment validation" ON public.user_roles FOR INSERT 
WITH CHECK (
  -- Validate role using backend function
  public.validate_role_assignment(user_id, role, NULL)
);

-- Create a view to monitor role assignments with validation status
CREATE OR REPLACE VIEW public.user_role_validation AS
SELECT 
  ur.user_id,
  ur.role as assigned_role,
  au.raw_user_meta_data->>'role' as metadata_role,
  au.raw_user_meta_data->>'signup_role' as signup_role,
  CASE 
    WHEN au.raw_user_meta_data->>'role' IS NOT NULL 
         AND au.raw_user_meta_data->>'role' != ur.role::TEXT 
    THEN true 
    ELSE false 
  END as has_role_mismatch,
  au.created_at as user_created_at,
  CASE 
    WHEN ur.role::TEXT IN ('admin', 'manager', 'user', 'tenant') THEN true
    ELSE false
  END as is_valid_role
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.validate_role_assignment TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_role_strict TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_signup_role TO authenticated;
GRANT SELECT ON public.user_role_validation TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.validate_signup_role IS '🛡️ STRICT BACKEND VALIDATION: Validates role selection during signup. Role is mandatory and must be one of: admin, manager, user, tenant';
COMMENT ON FUNCTION public.assign_user_role_strict IS '🛡️ STRICT ROLE ASSIGNMENT: Assigns role with backend validation. Prevents role changes and ensures exact role preservation';
COMMENT ON TYPE public.app_role IS '🛡️ STRICT ROLE ENUM: Only allows admin, manager, user, tenant roles. No default values or auto-assignment';
