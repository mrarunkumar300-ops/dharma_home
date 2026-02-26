-- Super Admin Tenant Management Migration
-- Add super_admin role and permissions for comprehensive tenant management

-- Add super_admin role to the enum
ALTER TYPE public.app_role ADD VALUE 'super_admin';

-- Update tenant management permissions for Super Admin
-- Drop existing policies and recreate with Super Admin access

-- Drop existing tenant policies
DROP POLICY IF EXISTS "Tenants can view own profile" ON public.tenants_profile;
DROP POLICY IF EXISTS "Admins can view all tenant profiles" ON public.tenants_profile;
DROP POLICY IF EXISTS "Tenants can update own profile" ON public.tenants_profile;
DROP POLICY IF EXISTS "Admins can update all tenant profiles" ON public.tenants_profile;

-- Recreate policies with Super Admin access
CREATE POLICY "Tenants can view own profile" ON public.tenants_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all tenant profiles" ON public.tenants_profile FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Tenants can update own profile" ON public.tenants_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all tenant profiles" ON public.tenants_profile FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Super Admins can manage all tenant profiles" ON public.tenants_profile FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Update tenant_rooms policies
DROP POLICY IF EXISTS "Tenants can view own rooms" ON public.tenant_rooms;
DROP POLICY IF EXISTS "Admins can view all tenant rooms" ON public.tenant_rooms;

CREATE POLICY "Tenants can view own rooms" ON public.tenant_rooms FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all tenant rooms" ON public.tenant_rooms FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Super Admins can manage all tenant rooms" ON public.tenant_rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Update tenant_family_members policies
DROP POLICY IF EXISTS "Tenants can view own family members" ON public.tenant_family_members;
DROP POLICY IF EXISTS "Admins can view all tenant family members" ON public.tenant_family_members;
DROP POLICY IF EXISTS "Tenants can manage own family members" ON public.tenant_family_members;
DROP POLICY IF EXISTS "Admins can manage all tenant family members" ON public.tenant_family_members;

CREATE POLICY "Tenants can view own family members" ON public.tenant_family_members FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all tenant family members" ON public.tenant_family_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Tenants can manage own family members" ON public.tenant_family_members FOR ALL USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Super Admins can manage all tenant family members" ON public.tenant_family_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Update tenant_documents policies
DROP POLICY IF EXISTS "Tenants can view own documents" ON public.tenant_documents;
DROP POLICY IF EXISTS "Admins can view all tenant documents" ON public.tenant_documents;
DROP POLICY IF EXISTS "Tenants can manage own documents" ON public.tenant_documents;
DROP POLICY IF EXISTS "Admins can manage all tenant documents" ON public.tenant_documents;

CREATE POLICY "Tenants can view own documents" ON public.tenant_documents FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all tenant documents" ON public.tenant_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Tenants can manage own documents" ON public.tenant_documents FOR ALL USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Super Admins can manage all tenant documents" ON public.tenant_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Update tenant_bills policies
DROP POLICY IF EXISTS "Tenants can view own bills" ON public.tenant_bills;
DROP POLICY IF EXISTS "Admins can view all tenant bills" ON public.tenant_bills;

CREATE POLICY "Tenants can view own bills" ON public.tenant_bills FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all tenant bills" ON public.tenant_bills FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Super Admins can manage all tenant bills" ON public.tenant_bills FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Update tenant_payment_records policies
DROP POLICY IF EXISTS "Tenants can view own payment records" ON public.tenant_payment_records;
DROP POLICY IF EXISTS "Admins can view all tenant payment records" ON public.tenant_payment_records;

CREATE POLICY "Tenants can view own payment records" ON public.tenant_payment_records FOR SELECT USING (
  tenant_id IN (SELECT id FROM public.tenants_profile WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all tenant payment records" ON public.tenant_payment_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Super Admins can manage all tenant payment records" ON public.tenant_payment_records FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Create comprehensive tenant management functions for Super Admin

-- Function to get tenant statistics
CREATE OR REPLACE FUNCTION public.get_tenant_statistics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_tenants', (SELECT COUNT(*) FROM tenants_profile),
    'active_tenants', (SELECT COUNT(*) FROM tenants_profile WHERE status = 'active'),
    'inactive_tenants', (SELECT COUNT(*) FROM tenants_profile WHERE status = 'inactive'),
    'suspended_tenants', (SELECT COUNT(*) FROM tenants_profile WHERE status = 'suspended'),
    'total_rooms_assigned', (SELECT COUNT(*) FROM tenant_rooms WHERE status = 'active'),
    'total_family_members', (SELECT COUNT(*) FROM tenant_family_members),
    'total_documents', (SELECT COUNT(*) FROM tenant_documents),
    'pending_bills', (SELECT COUNT(*) FROM tenant_bills WHERE status = 'pending'),
    'overdue_bills', (SELECT COUNT(*) FROM tenant_bills WHERE status = 'overdue')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get detailed tenant information with all related data
CREATE OR REPLACE FUNCTION public.get_tenant_details(_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'tenant', row_to_json(t),
    'rooms', (SELECT json_agg(row_to_json(r)) FROM tenant_rooms r WHERE r.tenant_id = _tenant_id),
    'family_members', (SELECT json_agg(row_to_json(f)) FROM tenant_family_members f WHERE f.tenant_id = _tenant_id),
    'documents', (SELECT json_agg(row_to_json(d)) FROM tenant_documents d WHERE d.tenant_id = _tenant_id),
    'bills', (SELECT json_agg(row_to_json(b)) FROM tenant_bills b WHERE b.tenant_id = _tenant_id),
    'payment_records', (SELECT json_agg(row_to_json(p)) FROM tenant_payment_records pr 
                       JOIN payments p ON pr.payment_id = p.id WHERE pr.tenant_id = _tenant_id)
  ) INTO result
  FROM tenants_profile t
  WHERE t.id = _tenant_id;
  
  RETURN result;
END;
$$;

-- Function to create tenant with validation
CREATE OR REPLACE FUNCTION public.create_tenant_comprehensive(
  _user_id UUID,
  _full_name TEXT,
  _email TEXT,
  _phone TEXT DEFAULT NULL,
  _address TEXT DEFAULT NULL,
  _id_proof_type TEXT DEFAULT NULL,
  _id_proof_url TEXT DEFAULT NULL,
  _profile_photo_url TEXT DEFAULT NULL,
  _date_of_birth DATE DEFAULT NULL,
  _gender TEXT DEFAULT NULL,
  _emergency_contact_name TEXT DEFAULT NULL,
  _emergency_contact_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  tenant_code TEXT;
BEGIN
  -- Generate unique tenant code
  tenant_code := public.generate_tenant_code();
  
  -- Create tenant
  INSERT INTO tenants_profile (
    user_id, tenant_code, full_name, email, phone, address, 
    id_proof_type, id_proof_url, profile_photo_url, date_of_birth,
    gender, emergency_contact_name, emergency_contact_phone, status
  ) VALUES (
    _user_id, tenant_code, _full_name, _email, _phone, _address,
    _id_proof_type, _id_proof_url, _profile_photo_url, _date_of_birth,
    _gender, _emergency_contact_name, _emergency_contact_phone, 'active'
  ) RETURNING id INTO new_tenant_id;
  
  -- Log the creation
  INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'TENANT_CREATED',
    'tenants_profile',
    new_tenant_id,
    json_build_object(
      'tenant_code', tenant_code,
      'full_name', _full_name,
      'email', _email,
      'created_by', auth.uid()
    )
  );
  
  RETURN new_tenant_id;
END;
$$;

-- Function to update tenant status
CREATE OR REPLACE FUNCTION public.update_tenant_status(
  _tenant_id UUID,
  _new_status TEXT -- 'active', 'inactive', 'suspended'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate status
  IF _new_status NOT IN ('active', 'inactive', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status. Must be one of: active, inactive, suspended';
  END IF;
  
  -- Update tenant status
  UPDATE tenants_profile 
  SET status = _new_status, updated_at = now()
  WHERE id = _tenant_id;
  
  -- Log the status change
  INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'TENANT_STATUS_UPDATED',
    'tenants_profile',
    _tenant_id,
    json_build_object(
      'new_status', _new_status,
      'updated_by', auth.uid()
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Grant permissions to Super Admin
GRANT EXECUTE ON FUNCTION public.get_tenant_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_comprehensive TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tenant_status TO authenticated;

-- Update role validation to include super_admin
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
  allowed_roles TEXT[] := ARRAY['super_admin', 'admin', 'manager', 'user', 'tenant'];
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

-- Update validate_signup_role function
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
  allowed_roles TEXT[] := ARRAY['super_admin', 'admin', 'manager', 'user', 'tenant'];
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
  
  -- 🛡️ SECURITY: Additional validation for super_admin role
  IF normalized_role = 'super_admin' THEN
    -- Only allow super_admin creation if:
    -- 1. No super_admin exists yet (bootstrap), OR
    -- 2. Current user is super_admin
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'super_admin') THEN
      -- Bootstrap case - allow first super_admin
      NULL;
    ELSIF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
      RAISE EXCEPTION 'Only existing super_admin can create new super_admin accounts';
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_tenant_statistics IS '🏢 TENANT MANAGEMENT: Get comprehensive tenant statistics for Super Admin dashboard';
COMMENT ON FUNCTION public.get_tenant_details IS '🏢 TENANT MANAGEMENT: Get detailed tenant information including rooms, family, documents, bills';
COMMENT ON FUNCTION public.create_tenant_comprehensive IS '🏢 TENANT MANAGEMENT: Create new tenant with comprehensive validation and logging';
COMMENT ON FUNCTION public.update_tenant_status IS '🏢 TENANT MANAGEMENT: Update tenant status with audit logging';
