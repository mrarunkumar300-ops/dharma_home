-- Fix strict role validation to support platform and additional roles

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
  allowed_roles TEXT[] := ARRAY['super_admin', 'admin', 'manager', 'user', 'tenant', 'staff', 'guest'];
BEGIN
  IF _selected_role::TEXT NOT IN (SELECT unnest(allowed_roles)) THEN
    RAISE EXCEPTION 'Invalid role: % must be one of %', _selected_role, allowed_roles;
    RETURN FALSE;
  END IF;

  IF _metadata_role IS NOT NULL AND _metadata_role != _selected_role::TEXT THEN
    role_mismatch := TRUE;
  END IF;

  IF role_mismatch THEN
    RAISE EXCEPTION 'Role mismatch detected: selected=%, metadata=%', _selected_role, _metadata_role;
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

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
  allowed_roles TEXT[] := ARRAY['super_admin', 'admin', 'manager', 'user', 'tenant', 'staff', 'guest'];
  normalized_role TEXT;
BEGIN
  IF _selected_role IS NULL OR trim(_selected_role) = '' THEN
    RAISE EXCEPTION 'Please select a role. Role selection is mandatory.';
    RETURN FALSE;
  END IF;

  normalized_role := lower(trim(_selected_role));

  IF normalized_role NOT IN (SELECT unnest(allowed_roles)) THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of: %', normalized_role, allowed_roles;
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

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
  ur.created_at as role_assigned_at,
  au.created_at as user_created_at,
  CASE 
    WHEN ur.role::TEXT IN ('super_admin', 'admin', 'manager', 'user', 'tenant', 'staff', 'guest') THEN true
    ELSE false
  END as is_valid_role
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id;
