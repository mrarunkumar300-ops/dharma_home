-- Tenant User Integration Migration
-- Connect admin tenant creation with user account creation

-- Function to create tenant with user account
CREATE OR REPLACE FUNCTION public.create_tenant_with_user(
  _name TEXT,
  _email TEXT,
  _password TEXT,
  _phone TEXT DEFAULT NULL,
  _lease_start DATE DEFAULT NULL,
  _lease_end DATE DEFAULT NULL,
  _status TEXT DEFAULT 'active',
  _organization_id UUID DEFAULT NULL,
  _property_id UUID DEFAULT NULL,
  _unit_id UUID DEFAULT NULL,
  _rent_amount NUMERIC(10,2) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  new_tenant_id UUID;
  new_tenant_profile_id UUID;
  tenant_code TEXT;
  result JSON;
BEGIN
  -- Validate inputs
  IF _name IS NULL OR trim(_name) = '' THEN
    RAISE EXCEPTION 'Tenant name is required';
  END IF;
  
  IF _email IS NULL OR trim(_email) = '' THEN
    RAISE EXCEPTION 'Tenant email is required';
  END IF;
  
  IF _password IS NULL OR trim(_password) = '' THEN
    RAISE EXCEPTION 'Password is required';
  END IF;
  
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = _email) THEN
    RAISE EXCEPTION 'Email already exists: %', _email;
  END IF;
  
  -- Create user account
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    _email,
    crypt(_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('full_name', _name, 'role', 'tenant')
  ) RETURNING id INTO new_user_id;
  
  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    organization_id
  ) VALUES (
    new_user_id,
    _email,
    _name,
    _organization_id
  );
  
  -- Assign tenant role
  INSERT INTO public.user_roles (
    user_id,
    role
  ) VALUES (
    new_user_id,
    'tenant'
  );
  
  -- Create tenant record (admin side)
  INSERT INTO public.tenants (
    name,
    email,
    phone,
    lease_start,
    lease_end,
    status,
    organization_id
  ) VALUES (
    _name,
    _email,
    _phone,
    _lease_start,
    _lease_end,
    _status,
    _organization_id
  ) RETURNING id INTO new_tenant_id;
  
  -- Generate tenant code
  tenant_code := public.generate_tenant_code();
  
  -- Create tenant profile (user side)
  INSERT INTO public.tenants_profile (
    user_id,
    tenant_code,
    full_name,
    email,
    phone,
    status
  ) VALUES (
    new_user_id,
    tenant_code,
    _name,
    _email,
    _phone,
    'active'
  ) RETURNING id INTO new_tenant_profile_id;
  
  -- Create room assignment if provided
  IF _unit_id IS NOT NULL AND _property_id IS NOT NULL THEN
    INSERT INTO public.tenant_rooms (
      tenant_id,
      property_id,
      unit_id,
      room_number,
      rent_amount,
      agreement_start_date,
      agreement_end_date,
      status
    ) VALUES (
      new_tenant_profile_id,
      _property_id,
      _unit_id,
      (SELECT unit_number FROM public.units WHERE id = _unit_id),
      COALESCE(_rent_amount, (SELECT rent FROM public.units WHERE id = _unit_id)),
      COALESCE(_lease_start, CURRENT_DATE),
      _lease_end,
      'active'
    );
    
    -- Update unit with tenant assignment
    UPDATE public.units 
    SET tenant_id = new_tenant_id 
    WHERE id = _unit_id;
  END IF;
  
  -- Log creation
  INSERT INTO public.activity_log (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    auth.uid(),
    'TENANT_USER_CREATED',
    'tenants_profile',
    new_tenant_profile_id,
    jsonb_build_object(
      'tenant_name', _name,
      'tenant_email', _email,
      'tenant_code', tenant_code,
      'user_id', new_user_id,
      'tenant_id', new_tenant_id,
      'created_by', auth.uid()
    )
  );
  
  -- Build result
  result := jsonb_build_object(
    'success', true,
    'message', 'Tenant user created successfully',
    'data', jsonb_build_object(
      'user_id', new_user_id,
      'tenant_id', new_tenant_id,
      'tenant_profile_id', new_tenant_profile_id,
      'tenant_code', tenant_code,
      'email', _email,
      'password', _password -- Return password for admin to give to tenant
    )
  );
  
  RETURN result;
END;
$$;

-- Function to get tenant data for dashboard
CREATE OR REPLACE FUNCTION public.get_tenant_dashboard_data(_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_profile_id UUID;
  result JSON;
BEGIN
  -- Get tenant profile ID
  SELECT id INTO tenant_profile_id 
  FROM public.tenants_profile 
  WHERE user_id = _user_id;
  
  IF tenant_profile_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Tenant profile not found');
  END IF;
  
  -- Build comprehensive dashboard data
  SELECT jsonb_build_object(
    'profile', row_to_json(tp),
    'room', (
      SELECT jsonb_build_object(
        'id', tr.id,
        'room_number', tr.room_number,
        'floor_number', tr.floor_number,
        'rent_amount', tr.rent_amount,
        'agreement_start_date', tr.agreement_start_date,
        'agreement_end_date', tr.agreement_end_date,
        'property', jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'address', p.address
        ),
        'unit', jsonb_build_object(
          'id', u.id,
          'unit_number', u.unit_number
        )
      )
      FROM public.tenant_rooms tr
      JOIN public.properties p ON tr.property_id = p.id
      JOIN public.units u ON tr.unit_id = u.id
      WHERE tr.tenant_id = tenant_profile_id AND tr.status = 'active'
      LIMIT 1
    ),
    'family_members', (
      SELECT jsonb_agg(row_to_json(tfm))
      FROM public.tenant_family_members tfm
      WHERE tfm.tenant_id = tenant_profile_id
    ),
    'documents', (
      SELECT jsonb_agg(row_to_json(td))
      FROM public.tenant_documents td
      WHERE td.tenant_id = tenant_profile_id
    ),
    'bills', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', tb.id,
          'bill_type', tb.bill_type,
          'amount', tb.amount,
          'due_date', tb.due_date,
          'status', tb.status,
          'bill_period_start', tb.bill_period_start,
          'bill_period_end', tb.bill_period_end
        )
      )
      FROM public.tenant_bills tb
      WHERE tb.tenant_id = tenant_profile_id
      ORDER BY tb.due_date DESC
    ),
    'payments', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'amount', p.amount,
          'payment_date', p.payment_date,
          'payment_method', p.payment_method,
          'status', p.status
        )
      )
      FROM public.tenant_payment_records tpr
      JOIN public.payments p ON tpr.payment_id = p.id
      WHERE tpr.tenant_id = tenant_profile_id
      ORDER BY p.payment_date DESC
    )
  ) INTO result
  FROM public.tenants_profile tp
  WHERE tp.id = tenant_profile_id;
  
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_tenant_with_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_dashboard_data TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.create_tenant_with_user IS '🏢 TENANT INTEGRATION: Create tenant with user account, linking admin and user systems';
COMMENT ON FUNCTION public.get_tenant_dashboard_data IS '🏢 TENANT INTEGRATION: Get comprehensive dashboard data for logged-in tenant';
