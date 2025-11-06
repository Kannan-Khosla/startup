-- Migration: Add attachments and file storage support
-- Created: 2024
-- Dependencies: Requires migrations/001_add_users_and_auth.sql and migrations/002_ticket_priorities_slas.sql to be run first

-- Create attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL, -- Path in Supabase Storage
  file_size bigint NOT NULL CHECK (file_size > 0), -- Size in bytes
  mime_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_public boolean NOT NULL DEFAULT false, -- Whether file is publicly accessible
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON public.attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON public.attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON public.attachments(created_at);
CREATE INDEX IF NOT EXISTS idx_attachments_mime_type ON public.attachments(mime_type);

-- Add comment for documentation
COMMENT ON TABLE public.attachments IS 'Stores file attachments linked to tickets and messages';
COMMENT ON COLUMN public.attachments.file_path IS 'Storage path in Supabase Storage bucket';

-- Note: Storage buckets should be created in Supabase Dashboard:
-- 1. Go to Storage section
-- 2. Create bucket named 'attachments'
-- 3. Set bucket to public or private based on your needs
-- 4. Configure bucket policies for access control

