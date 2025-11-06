-- Migration: Add email integration support
-- Created: 2024
-- Dependencies: Requires migrations/001_add_users_and_auth.sql and migrations/002_ticket_priorities_slas.sql to be run first

-- Create email_accounts table for email service configuration
CREATE TABLE IF NOT EXISTS public.email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text,
  provider text NOT NULL CHECK (provider IN ('smtp', 'sendgrid', 'ses', 'mailgun', 'other')),
  smtp_host text,
  smtp_port integer,
  smtp_username text,
  smtp_password_encrypted text, -- Encrypted password
  api_key_encrypted text, -- Encrypted API key for cloud providers
  credentials_encrypted jsonb, -- Encrypted JSON for additional credentials
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false, -- Only one default account
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create email_messages table for storing email messages
CREATE TABLE IF NOT EXISTS public.email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  email_account_id uuid NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  message_id text, -- Email message ID (for threading)
  in_reply_to text, -- Parent message ID
  subject text NOT NULL,
  body_text text, -- Plain text body
  body_html text, -- HTML body
  from_email text NOT NULL,
  to_email text[] NOT NULL, -- Array of recipient emails
  cc_email text[], -- Array of CC emails
  bcc_email text[], -- Array of BCC emails
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'received', 'failed', 'draft', 'pending')),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  has_attachments boolean NOT NULL DEFAULT false,
  error_message text, -- For failed emails
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  received_at timestamptz
);

-- Create email_threads table for linking emails to tickets
CREATE TABLE IF NOT EXISTS public.email_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  email_message_id uuid NOT NULL REFERENCES public.email_messages(id) ON DELETE CASCADE,
  thread_position integer NOT NULL DEFAULT 1, -- Order in thread
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, email_message_id)
);

-- Add source column to tickets table to track ticket origin
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'email', 'api', 'chat', 'phone', 'social'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON public.email_accounts(email);
CREATE INDEX IF NOT EXISTS idx_email_accounts_is_active ON public.email_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_email_accounts_is_default ON public.email_accounts(is_default);

CREATE INDEX IF NOT EXISTS idx_email_messages_ticket_id ON public.email_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_email_account_id ON public.email_messages(email_account_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_message_id ON public.email_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_in_reply_to ON public.email_messages(in_reply_to);
CREATE INDEX IF NOT EXISTS idx_email_messages_status ON public.email_messages(status);
CREATE INDEX IF NOT EXISTS idx_email_messages_direction ON public.email_messages(direction);
CREATE INDEX IF NOT EXISTS idx_email_messages_from_email ON public.email_messages(from_email);
CREATE INDEX IF NOT EXISTS idx_email_messages_created_at ON public.email_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_email_threads_ticket_id ON public.email_threads(ticket_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_email_message_id ON public.email_threads(email_message_id);

CREATE INDEX IF NOT EXISTS idx_tickets_source ON public.tickets(source);

-- Add comments for documentation
COMMENT ON TABLE public.email_accounts IS 'Email service accounts for sending/receiving emails';
COMMENT ON TABLE public.email_messages IS 'Stores individual email messages linked to tickets';
COMMENT ON TABLE public.email_threads IS 'Links email messages to tickets maintaining thread order';
COMMENT ON COLUMN public.tickets.source IS 'Original source/channel where ticket was created';

