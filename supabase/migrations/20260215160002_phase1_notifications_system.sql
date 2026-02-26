-- Phase 1: Notifications System Database Schema
-- This migration creates the comprehensive notifications system

-- Create tenant_notifications table
CREATE TABLE IF NOT EXISTS public.tenant_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants_profile(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('rent_due', 'overdue', 'maintenance', 'agreement_expiry', 'announcement', 'payment_received', 'complaint_update', 'system')),
    title TEXT NOT NULL,
    message TEXT,
    action_url TEXT, -- Deep link for mobile app
    action_text TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    channels TEXT[] DEFAULT ARRAY['in_app'], -- in_app, email, sms, push
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants_profile(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'never')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, notification_type)
);

-- Add notification settings to tenants_profile
ALTER TABLE public.tenants_profile 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Add reminder settings to invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_reminder_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_reminder_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 3;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_notifications_tenant_id ON public.tenant_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_notifications_is_read ON public.tenant_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_tenant_notifications_created_at ON public.tenant_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_tenant_notifications_type ON public.tenant_notifications(type);
CREATE INDEX IF NOT EXISTS idx_tenant_notifications_priority ON public.tenant_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_tenant_notifications_expires_at ON public.tenant_notifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_tenant_id ON public.notification_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_notification_type ON public.notification_preferences(notification_type);

-- Enable RLS on new tables
ALTER TABLE public.tenant_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_notifications
CREATE POLICY "Tenants can view own notifications" ON public.tenant_notifications 
FOR SELECT USING (tenant_id IN (
    SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()
));

CREATE POLICY "System can create notifications" ON public.tenant_notifications 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Tenants can update own notifications" ON public.tenant_notifications 
FOR UPDATE USING (tenant_id IN (
    SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()
));

-- Staff can view notifications in their organization
CREATE POLICY "Staff can view notifications" ON public.tenant_notifications 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.organizations o ON o.id = ur.organization_id 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'manager', 'staff')
        AND o.id = (
            SELECT organization_id FROM public.tenants_profile tp 
            WHERE tp.id = public.tenant_notifications.tenant_id
        )
    )
);

-- RLS Policies for notification_preferences
CREATE POLICY "Tenants can manage own preferences" ON public.notification_preferences 
FOR ALL USING (tenant_id IN (
    SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()
));

-- Staff can view notification preferences in their organization
CREATE POLICY "Staff can view notification preferences" ON public.notification_preferences 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.organizations o ON o.id = ur.organization_id 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'manager', 'staff')
        AND o.id = (
            SELECT organization_id FROM public.tenants_profile tp 
            WHERE tp.id = public.notification_preferences.tenant_id
        )
    )
);

-- Add updated_at trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at 
BEFORE UPDATE ON public.notification_preferences 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    _tenant_id UUID,
    _type TEXT,
    _title TEXT,
    _message TEXT DEFAULT NULL,
    _priority TEXT DEFAULT 'normal',
    _channels TEXT[] DEFAULT ARRAY['in_app'],
    _action_url TEXT DEFAULT NULL,
    _action_text TEXT DEFAULT NULL,
    _metadata JSONB DEFAULT NULL,
    _expires_hours INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    notification_id UUID;
    pref RECORD;
BEGIN
    -- Check tenant's notification preferences
    SELECT * INTO pref 
    FROM public.notification_preferences 
    WHERE tenant_id = _tenant_id AND notification_type = _type;
    
    -- If no preferences exist, use defaults
    IF NOT FOUND THEN
        INSERT INTO public.notification_preferences (tenant_id, notification_type)
        VALUES (_tenant_id, _type)
        ON CONFLICT (tenant_id, notification_type) DO NOTHING;
        
        pref.email_enabled := TRUE;
        pref.sms_enabled := FALSE;
        pref.push_enabled := TRUE;
        pref.in_app_enabled := TRUE;
        pref.frequency := 'immediate';
    END IF;
    
    -- Only create if in_app is enabled
    IF pref.in_app_enabled THEN
        INSERT INTO public.tenant_notifications (
            tenant_id, type, title, message, priority, channels, 
            action_url, action_text, metadata, expires_at
        )
        VALUES (
            _tenant_id, _type, _title, _message, _priority, _channels,
            _action_url, _action_text, _metadata,
            CASE WHEN _expires_hours IS NOT NULL 
                 THEN now() + INTERVAL '1 hour' * _expires_hours 
                 ELSE NULL END
        )
        RETURNING id INTO notification_id;
        
        -- TODO: Send email/SMS/push notifications based on preferences
        -- This would be handled by separate notification service
        
        RETURN notification_id;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(_notification_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.tenant_notifications 
    SET is_read = TRUE, read_at = now()
    WHERE id = _notification_id AND tenant_id = _tenant_id;
    
    RETURN FOUND;
END;
$$;

-- Function to mark all notifications as read for tenant
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.tenant_notifications 
    SET is_read = TRUE, read_at = now()
    WHERE tenant_id = _tenant_id AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(_tenant_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.tenant_notifications 
  WHERE tenant_id = _tenant_id 
    AND is_read = FALSE 
    AND (expires_at IS NULL OR expires_at > now());
$$;

-- Function to cleanup expired notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.tenant_notifications 
    WHERE expires_at IS NOT NULL AND expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Function to create rent due notifications (for scheduled jobs)
CREATE OR REPLACE FUNCTION public.create_rent_due_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    notification_count INTEGER := 0;
    tenant_record RECORD;
BEGIN
    -- Find tenants with rent due in next 7 days
    FOR tenant_record IN 
        SELECT tp.id, tp.full_name, i.invoice_number, i.due_date, i.amount
        FROM public.tenants_profile tp
        JOIN public.invoices i ON i.tenant_id = tp.tenant_record_id
        WHERE i.status != 'paid'
          AND i.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          AND i.reminder_sent = FALSE
    LOOP
        -- Create notification
        PERFORM public.create_notification(
            tenant_record.id,
            'rent_due',
            'Rent Payment Due',
            format('Your rent payment of $%s is due on %s', tenant_record.amount, tenant_record.due_date),
            'high',
            ARRAY['in_app', 'email'],
            '/tenant/bills',
            'View Bills',
            json_build_object('invoice_number', tenant_record.invoice_number),
            168 -- Expires in 7 days
        );
        
        -- Mark reminder as sent
        UPDATE public.invoices 
        SET reminder_sent = TRUE, last_reminder_date = now()
        WHERE invoice_number = tenant_record.invoice_number;
        
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$;

-- Function to create overdue notifications
CREATE OR REPLACE FUNCTION public.create_overdue_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    notification_count INTEGER := 0;
    tenant_record RECORD;
BEGIN
    -- Find tenants with overdue payments
    FOR tenant_record IN 
        SELECT tp.id, tp.full_name, i.invoice_number, i.due_date, i.amount,
               (CURRENT_DATE - i.due_date) as days_overdue
        FROM public.tenants_profile tp
        JOIN public.invoices i ON i.tenant_id = tp.tenant_record_id
        WHERE i.status != 'paid'
          AND i.due_date < CURRENT_DATE
          AND i.due_date >= CURRENT_DATE - INTERVAL '3 days' -- Only notify for recent overdue
    LOOP
        -- Create overdue notification
        PERFORM public.create_notification(
            tenant_record.id,
            'overdue',
            'Payment Overdue',
            format('Your rent payment of $%s was due %s days ago. Please pay immediately to avoid late fees.', 
                   tenant_record.amount, tenant_record.days_overdue),
            'urgent',
            ARRAY['in_app', 'email', 'sms'],
            '/tenant/payments',
            'Pay Now',
            json_build_object('invoice_number', tenant_record.invoice_number, 'days_overdue', tenant_record.days_overdue),
            72 -- Expires in 3 days
        );
        
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$;

-- Function to create complaint update notifications
CREATE OR REPLACE FUNCTION public.create_complaint_update_notification(
    _complaint_id UUID,
    _update_type TEXT,
    _message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    notification_id UUID;
    complaint RECORD;
BEGIN
    -- Get complaint details
    SELECT tc.*, tp.full_name, tp.user_id
    INTO complaint
    FROM public.tenant_complaints tc
    JOIN public.tenants_profile tp ON tp.id = tc.tenant_id
    WHERE tc.id = _complaint_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Create notification
    notification_id := public.create_notification(
        complaint.tenant_id,
        'complaint_update',
        format('Complaint %s: %s', _update_type, complaint.title),
        _message,
        'normal',
        ARRAY['in_app', 'email'],
        format('/tenant/complaints/%s', _complaint_id),
        'View Complaint',
        json_build_object('complaint_id', _complaint_id, 'update_type', _update_type),
        168 -- Expires in 7 days
    );
    
    RETURN notification_id;
END;
$$;

-- Initialize default notification preferences for all existing tenants
INSERT INTO public.notification_preferences (tenant_id, notification_type)
SELECT DISTINCT tp.id, 'rent_due'
FROM public.tenants_profile tp
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences np 
    WHERE np.tenant_id = tp.id AND np.notification_type = 'rent_due'
);

INSERT INTO public.notification_preferences (tenant_id, notification_type)
SELECT DISTINCT tp.id, 'overdue'
FROM public.tenants_profile tp
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences np 
    WHERE np.tenant_id = tp.id AND np.notification_type = 'overdue'
);

INSERT INTO public.notification_preferences (tenant_id, notification_type)
SELECT DISTINCT tp.id, 'complaint_update'
FROM public.tenants_profile tp
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences np 
    WHERE np.tenant_id = tp.id AND np.notification_type = 'complaint_update'
);

-- Add comments for documentation
COMMENT ON TABLE public.tenant_notifications IS 'Notifications sent to tenants across multiple channels';
COMMENT ON TABLE public.notification_preferences IS 'Tenant preferences for different types of notifications';

COMMENT ON COLUMN public.tenant_notifications.type IS 'Type of notification: rent_due, overdue, maintenance, etc.';
COMMENT ON COLUMN public.tenant_notifications.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN public.tenant_notifications.channels IS 'Delivery channels: in_app, email, sms, push';
COMMENT ON COLUMN public.tenant_notifications.action_url IS 'Deep link for mobile app or web navigation';
COMMENT ON COLUMN public.tenant_notifications.expires_at IS 'When notification should be automatically cleaned up';

COMMENT ON COLUMN public.notification_preferences.frequency IS 'How often to send: immediate, daily, weekly, never';
COMMENT ON COLUMN public.tenants_profile.phone_verified IS 'Whether tenant phone number has been verified';
COMMENT ON COLUMN public.tenants_profile.email_verified IS 'Whether tenant email has been verified';
COMMENT ON COLUMN public.invoices.reminder_sent IS 'Whether reminder notification has been sent for this invoice';
COMMENT ON COLUMN public.invoices.grace_period_days IS 'Number of days after due date before late fees apply';
