-- Migration: Add email templates system
-- Created: 2024
-- Dependencies: Requires migrations/004_email_integration.sql to be run first

-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  subject text NOT NULL,
  body_text text NOT NULL,
  body_html text,
  template_type text NOT NULL CHECK (template_type IN ('ticket_created', 'ticket_reply', 'ticket_closed', 'ticket_assigned', 'custom')),
  variables jsonb, -- Available variables for this template
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON public.email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_template_type ON public.email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

-- Add comments
COMMENT ON TABLE public.email_templates IS 'Email templates for automated email sending';
COMMENT ON COLUMN public.email_templates.variables IS 'JSON object describing available template variables';

