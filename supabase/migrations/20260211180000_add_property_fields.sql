-- Add missing fields to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS custom_id TEXT,
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS mobile TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add missing fields to units table
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS room_type TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
