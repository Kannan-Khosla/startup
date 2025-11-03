-- Migration: Add users table and authentication support
-- Created: 2024

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, message_id, user_id)
);

-- Create human_escalations table
CREATE TABLE IF NOT EXISTS public.human_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE(ticket_id, user_id)
);

-- Add user_id to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Update messages table to support 'admin' sender
-- Note: This is a schema constraint update - the column already exists
-- We'll handle validation in application code

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_ratings_ticket_id ON public.ratings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ratings_message_id ON public.ratings(message_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_escalations_ticket_id ON public.human_escalations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_escalations_user_id ON public.human_escalations(user_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON public.human_escalations(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);

