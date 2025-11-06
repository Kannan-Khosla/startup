-- Migration: Add ticket priorities, SLAs, and time tracking
-- Created: 2024
-- Dependencies: Requires migrations/001_add_users_and_auth.sql to be run first

-- Create SLA definitions table FIRST (before referencing it)
CREATE TABLE IF NOT EXISTS public.sla_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  response_time_minutes integer NOT NULL DEFAULT 480, -- 8 hours default
  resolution_time_minutes integer NOT NULL DEFAULT 2880, -- 48 hours default
  business_hours_only boolean NOT NULL DEFAULT false,
  business_hours_start time, -- e.g., '09:00:00'
  business_hours_end time, -- e.g., '17:00:00'
  business_days integer[] DEFAULT ARRAY[1,2,3,4,5], -- Monday to Friday (1=Monday, 7=Sunday)
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

-- Add priority column to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add SLA foreign key to tickets table (now that sla_definitions exists)
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS sla_id uuid REFERENCES public.sla_definitions(id) ON DELETE SET NULL;

-- Add timestamp columns for tracking response and resolution times
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
ADD COLUMN IF NOT EXISTS last_response_at timestamptz,
ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Create SLA violations table for tracking SLA breaches
CREATE TABLE IF NOT EXISTS public.sla_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sla_id uuid NOT NULL REFERENCES public.sla_definitions(id) ON DELETE CASCADE,
  violation_type text NOT NULL CHECK (violation_type IN ('response_time', 'resolution_time')),
  expected_time timestamptz NOT NULL,
  actual_time timestamptz,
  violation_minutes integer, -- How many minutes past SLA
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create time entries table for tracking time spent on tickets
CREATE TABLE IF NOT EXISTS public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  description text,
  entry_type text NOT NULL DEFAULT 'work' CHECK (entry_type IN ('work', 'waiting', 'research', 'communication', 'other')),
  billable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_id ON public.tickets(sla_id);
CREATE INDEX IF NOT EXISTS idx_tickets_first_response_at ON public.tickets(first_response_at);
CREATE INDEX IF NOT EXISTS idx_tickets_last_response_at ON public.tickets(last_response_at);
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON public.tickets(resolved_at);
CREATE INDEX IF NOT EXISTS idx_tickets_priority_status ON public.tickets(priority, status);

CREATE INDEX IF NOT EXISTS idx_sla_definitions_priority ON public.sla_definitions(priority);
CREATE INDEX IF NOT EXISTS idx_sla_definitions_is_active ON public.sla_definitions(is_active);

CREATE INDEX IF NOT EXISTS idx_sla_violations_ticket_id ON public.sla_violations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_violations_sla_id ON public.sla_violations(sla_id);
CREATE INDEX IF NOT EXISTS idx_sla_violations_violation_type ON public.sla_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_sla_violations_is_resolved ON public.sla_violations(is_resolved);
CREATE INDEX IF NOT EXISTS idx_sla_violations_created_at ON public.sla_violations(created_at);

CREATE INDEX IF NOT EXISTS idx_time_entries_ticket_id ON public.time_entries(ticket_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_entry_type ON public.time_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_time_entries_created_at ON public.time_entries(created_at);

-- Add comment for documentation
COMMENT ON TABLE public.sla_definitions IS 'Defines SLA policies for different ticket priorities';
COMMENT ON TABLE public.sla_violations IS 'Tracks instances where SLAs are breached';
COMMENT ON TABLE public.time_entries IS 'Tracks time spent by users on tickets for billing and reporting';

