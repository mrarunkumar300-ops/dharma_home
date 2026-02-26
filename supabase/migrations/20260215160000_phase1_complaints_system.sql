-- Phase 1: Tenant Complaints System Database Schema
-- This migration creates the complaint management system for tenants

-- Create tenant_complaints table
CREATE TABLE IF NOT EXISTS public.tenant_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants_profile(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('electricity', 'water', 'cleaning', 'plumbing', 'carpentry', 'painting', 'pest_control', 'security', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled')),
    image_urls TEXT[],
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create complaint_comments table for communication
CREATE TABLE IF NOT EXISTS public.complaint_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.tenant_complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal comments vs tenant-visible
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_tenant_id ON public.tenant_complaints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_status ON public.tenant_complaints(status);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_priority ON public.tenant_complaints(priority);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_created_at ON public.tenant_complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_category ON public.tenant_complaints(category);

CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON public.complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_user_id ON public.complaint_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_created_at ON public.complaint_comments(created_at);

-- Enable RLS on new tables
ALTER TABLE public.tenant_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_complaints
CREATE POLICY "Tenants can view own complaints" ON public.tenant_complaints 
FOR SELECT USING (tenant_id IN (
    SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()
));

CREATE POLICY "Tenants can create own complaints" ON public.tenant_complaints 
FOR INSERT WITH CHECK (tenant_id IN (
    SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()
));

CREATE POLICY "Tenants can update own complaints" ON public.tenant_complaints 
FOR UPDATE USING (tenant_id IN (
    SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()
));

-- Admin/Staff can view all complaints in their organization
CREATE POLICY "Staff can view all complaints" ON public.tenant_complaints 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.organizations o ON o.id = ur.organization_id 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'manager', 'staff')
        AND o.id = (
            SELECT organization_id FROM public.tenants_profile tp 
            WHERE tp.id = public.tenant_complaints.tenant_id
        )
    )
);

CREATE POLICY "Staff can update complaints" ON public.tenant_complaints 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.organizations o ON o.id = ur.organization_id 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'manager', 'staff')
        AND o.id = (
            SELECT organization_id FROM public.tenants_profile tp 
            WHERE tp.id = public.tenant_complaints.tenant_id
        )
    )
);

-- RLS Policies for complaint_comments
CREATE POLICY "Tenants can view comments on own complaints" ON public.complaint_comments 
FOR SELECT USING (
    complaint_id IN (
        SELECT id FROM public.tenant_complaints 
        WHERE tenant_id IN (
            SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()
        )
    )
    AND is_internal = FALSE
);

CREATE POLICY "Tenants can create comments on own complaints" ON public.complaint_comments 
FOR INSERT WITH CHECK (
    complaint_id IN (
        SELECT id FROM public.tenant_complaints 
        WHERE tenant_id IN (
            SELECT id FROM public.tenants_profile WHERE user_id = auth.uid()
        )
    )
    AND user_id = auth.uid()
    AND is_internal = FALSE
);

-- Staff can view all comments
CREATE POLICY "Staff can view all comments" ON public.complaint_comments 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'manager', 'staff')
    )
);

CREATE POLICY "Staff can create comments" ON public.complaint_comments 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'manager', 'staff')
    )
);

-- Add updated_at trigger for new tables
CREATE TRIGGER update_tenant_complaints_updated_at 
BEFORE UPDATE ON public.tenant_complaints 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically set resolved_at when status changes to resolved
CREATE OR REPLACE FUNCTION public.set_complaint_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is being set to resolved and it wasn't resolved before
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at = now();
    ELSIF NEW.status != 'resolved' AND OLD.status = 'resolved' THEN
        -- If status is being changed away from resolved, clear resolved_at
        NEW.resolved_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic resolved_at management
DROP TRIGGER IF EXISTS complaint_resolved_at_trigger ON public.tenant_complaints;
CREATE TRIGGER complaint_resolved_at_trigger
    BEFORE UPDATE ON public.tenant_complaints
    FOR EACH ROW EXECUTE FUNCTION public.set_complaint_resolved_at();

-- Function to get complaint statistics
CREATE OR REPLACE FUNCTION public.get_complaint_statistics(_org_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_complaints', COUNT(*)::int,
    'pending_complaints', COUNT(*) FILTER (WHERE status = 'pending')::int,
    'in_progress_complaints', COUNT(*) FILTER (WHERE status = 'in_progress')::int,
    'resolved_complaints', COUNT(*) FILTER (WHERE status = 'resolved')::int,
    'urgent_complaints', COUNT(*) FILTER (WHERE priority = 'urgent')::int,
    'high_priority_complaints', COUNT(*) FILTER (WHERE priority = 'high')::int,
    'average_resolution_time', EXTRACT(EPOCH FROM AVG(resolved_at - created_at))/3600 
  )
  FROM public.tenant_complaints tc
  JOIN public.tenants_profile tp ON tp.id = tc.tenant_id
  WHERE tp.organization_id = _org_id;
$$;

-- Add comments for documentation
COMMENT ON TABLE public.tenant_complaints IS 'Complaints raised by tenants for maintenance and other issues';
COMMENT ON TABLE public.complaint_comments IS 'Comments and communication threads for complaints';

COMMENT ON COLUMN public.tenant_complaints.category IS 'Type of complaint: electricity, water, cleaning, etc.';
COMMENT ON COLUMN public.tenant_complaints.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN public.tenant_complaints.status IS 'Current status: pending, in_progress, resolved, cancelled';
COMMENT ON COLUMN public.tenant_complaints.image_urls IS 'Array of image URLs uploaded by tenant';
COMMENT ON COLUMN public.complaint_comments.is_internal IS 'True for internal staff comments, False for tenant-visible comments';
