-- Migration: Add soft delete functionality for tickets
-- Created: 2024
-- Dependencies: Requires all previous migrations to be run first

-- Add soft delete columns to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Create index for filtering deleted tickets
CREATE INDEX IF NOT EXISTS idx_tickets_is_deleted ON public.tickets(is_deleted);
CREATE INDEX IF NOT EXISTS idx_tickets_deleted_at ON public.tickets(deleted_at);

-- Add comment for documentation
COMMENT ON COLUMN public.tickets.deleted_at IS 'Timestamp when ticket was soft deleted. Tickets are kept for 30 days before permanent deletion.';
COMMENT ON COLUMN public.tickets.is_deleted IS 'Flag indicating if ticket is soft deleted (in trash).';

