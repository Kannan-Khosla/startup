-- Migration: Fix messages table sender constraint to allow 'admin'
-- Created: 2024
-- Dependencies: Requires migrations/001_add_users_and_auth.sql to be run first

-- Drop existing check constraint if it exists (may have different names)
DO $$ 
BEGIN
    -- Try to drop old constraint
    ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_check;
    ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS check_sender;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Add new constraint that allows 'customer', 'ai', and 'admin'
ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_check 
CHECK (sender IN ('customer', 'ai', 'admin'));

-- Add comment for documentation
COMMENT ON COLUMN public.messages.sender IS 'Sender type: customer, ai, or admin';

