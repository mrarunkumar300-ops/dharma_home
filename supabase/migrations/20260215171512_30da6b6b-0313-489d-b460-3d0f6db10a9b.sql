
-- Create tenant_notifications table
CREATE TABLE IF NOT EXISTS public.tenant_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants_profile(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  message text,
  action_url text,
  action_text text,
  is_read boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'normal',
  channels text[] DEFAULT '{"in_app"}',
  sent_at timestamptz,
  read_at timestamptz,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own notifications" ON public.tenant_notifications;
CREATE POLICY "Tenants can view own notifications" ON public.tenant_notifications
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenants can update own notifications" ON public.tenant_notifications;
CREATE POLICY "Tenants can update own notifications" ON public.tenant_notifications
  FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenants can delete own notifications" ON public.tenant_notifications;
CREATE POLICY "Tenants can delete own notifications" ON public.tenant_notifications
  FOR DELETE USING (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all tenant notifications" ON public.tenant_notifications;
CREATE POLICY "Admins can manage all tenant notifications" ON public.tenant_notifications
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants_profile(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  frequency text NOT NULL DEFAULT 'immediate',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, notification_type)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own preferences" ON public.notification_preferences;
CREATE POLICY "Tenants can view own preferences" ON public.notification_preferences
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenants can manage own preferences" ON public.notification_preferences;
CREATE POLICY "Tenants can manage own preferences" ON public.notification_preferences
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants_profile WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all preferences" ON public.notification_preferences;
CREATE POLICY "Admins can manage all preferences" ON public.notification_preferences
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Create mark_all_notifications_read function
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE tenant_notifications 
  SET is_read = true, read_at = now()
  WHERE tenant_id = _tenant_id AND is_read = false;
END;
$$;

-- Create create_notification function
CREATE OR REPLACE FUNCTION public.create_notification(
  _tenant_id uuid, _type text, _title text, _message text DEFAULT NULL,
  _priority text DEFAULT 'normal', _action_url text DEFAULT NULL,
  _action_text text DEFAULT NULL, _metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO tenant_notifications (tenant_id, type, title, message, priority, action_url, action_text, metadata, sent_at)
  VALUES (_tenant_id, _type, _title, _message, _priority, _action_url, _action_text, _metadata, now())
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- Add updated_at trigger for notification_preferences
CREATE OR REPLACE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
