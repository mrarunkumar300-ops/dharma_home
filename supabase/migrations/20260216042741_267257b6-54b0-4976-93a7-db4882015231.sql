-- Fix 1: Restrict organization creation to super_admin only
DROP POLICY IF EXISTS "Authenticated can create org" ON public.organizations;
CREATE POLICY "Super admins can create org" ON public.organizations 
FOR INSERT WITH CHECK (
  public.is_super_admin(auth.uid())
);

-- Fix 2: Create storage buckets with proper security
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('complaint-images', 'complaint-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('tenant-documents', 'tenant-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('agreement-documents', 'agreement-documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Complaint images
CREATE POLICY "Tenants upload own complaint images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'complaint-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Tenants view own complaint images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'complaint-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Staff view all complaint images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'complaint-images' AND
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'staff')
);

-- Storage RLS: Tenant documents
CREATE POLICY "Tenants upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Tenants view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Staff view all tenant documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'staff'))
);

-- Storage RLS: Agreement documents
CREATE POLICY "Tenants upload own agreements"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agreement-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Tenants view own agreements"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'agreement-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Staff view all agreements"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'agreement-documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'staff'))
);

-- Staff/Admin can upload to tenant-documents and agreement-documents
CREATE POLICY "Staff upload tenant documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'staff'))
);

CREATE POLICY "Staff upload agreements"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agreement-documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'staff'))
);