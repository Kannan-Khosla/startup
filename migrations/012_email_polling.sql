-- Migration: Add IMAP email polling support
-- Created: 2024
-- Dependencies: Requires migrations/004_email_integration.sql to be run first

-- Add IMAP configuration columns to email_accounts table
ALTER TABLE public.email_accounts 
ADD COLUMN IF NOT EXISTS imap_host text,
ADD COLUMN IF NOT EXISTS imap_port integer,
ADD COLUMN IF NOT EXISTS imap_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS last_polled_at timestamptz;

-- Create index on last_polled_at for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_accounts_last_polled_at ON public.email_accounts(last_polled_at);
CREATE INDEX IF NOT EXISTS idx_email_accounts_imap_enabled ON public.email_accounts(imap_enabled);

-- Add comments for documentation
COMMENT ON COLUMN public.email_accounts.imap_host IS 'IMAP server hostname (e.g., imap.gmail.com). Auto-detected for Gmail/Outlook if not provided.';
COMMENT ON COLUMN public.email_accounts.imap_port IS 'IMAP server port (typically 993 for SSL). Auto-detected for Gmail/Outlook if not provided.';
COMMENT ON COLUMN public.email_accounts.imap_enabled IS 'Whether to enable automatic email polling for this account.';
COMMENT ON COLUMN public.email_accounts.last_polled_at IS 'Timestamp of last successful email poll for this account.';

