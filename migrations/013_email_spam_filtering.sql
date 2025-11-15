-- Migration: Add spam filtering support
-- Created: 2024
-- Dependencies: Requires migrations/004_email_integration.sql to be run first

-- Update email_messages status constraint to include 'filtered'
ALTER TABLE public.email_messages 
DROP CONSTRAINT IF EXISTS email_messages_status_check;

ALTER TABLE public.email_messages 
ADD CONSTRAINT email_messages_status_check 
CHECK (status IN ('sent', 'received', 'failed', 'draft', 'pending', 'filtered'));

-- Add comment
COMMENT ON COLUMN public.email_messages.status IS 'Email status: sent, received, failed, draft, pending, or filtered (spam/promotion)';

