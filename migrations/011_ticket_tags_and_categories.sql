-- Migration: Add tags and categories for ticket organization
-- Created: 2024
-- Dependencies: Requires migrations/009_organizations_and_super_admin.sql to be run first

-- Drop existing tables if they exist (in case of previous failed migration)
-- This is safe because these are new tables with no data yet
DROP TABLE IF EXISTS public.ticket_tags CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Create tags table
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, -- NULL means global tag
  name text NOT NULL,
  color text, -- Hex color code for UI display (e.g., '#3b82f6')
  description text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name) -- Tag names must be unique within an organization
);

-- Create ticket_tags junction table
CREATE TABLE public.ticket_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  added_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, tag_id)
);

-- Add category column to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS category text;

-- Create categories table (optional - for predefined categories)
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, -- NULL means global category
  name text NOT NULL,
  description text,
  color text, -- Hex color code for UI display
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name) -- Category names must be unique within an organization
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_organization_id ON public.tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_ticket_tags_ticket_id ON public.ticket_tags(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_tags_tag_id ON public.ticket_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);
CREATE INDEX IF NOT EXISTS idx_categories_organization_id ON public.categories(organization_id);

-- Add comments for documentation
COMMENT ON TABLE public.tags IS 'Tags for categorizing and organizing tickets. Can be organization-specific or global.';
COMMENT ON TABLE public.ticket_tags IS 'Junction table linking tickets to tags. A ticket can have multiple tags.';
COMMENT ON COLUMN public.tickets.category IS 'Category assigned to the ticket (e.g., "Technical", "Billing", "Feature Request")';
COMMENT ON TABLE public.categories IS 'Predefined categories for tickets. Can be organization-specific or global.';

