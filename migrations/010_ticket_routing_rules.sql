-- Migration: Add automatic ticket routing rules
-- Created: 2024
-- Dependencies: Requires migrations/009_organizations_and_super_admin.sql to be run first

-- Create routing_rules table
CREATE TABLE IF NOT EXISTS public.routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  priority integer NOT NULL DEFAULT 0, -- Higher priority rules are evaluated first
  is_active boolean NOT NULL DEFAULT true,
  
  -- Rule conditions (JSONB for flexibility)
  conditions jsonb NOT NULL DEFAULT '{}', -- {keywords: [], issue_types: [], tags: [], context: [], etc.}
  
  -- Routing action
  action_type text NOT NULL CHECK (action_type IN ('assign_to_agent', 'assign_to_group', 'set_priority', 'add_tag', 'set_category')),
  action_value text NOT NULL, -- Agent email, group name, priority value, tag name, category name
  
  -- Metadata
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create routing_logs table to track which rules were applied
CREATE TABLE IF NOT EXISTS public.routing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  routing_rule_id uuid NOT NULL REFERENCES public.routing_rules(id) ON DELETE SET NULL,
  rule_name text,
  action_taken text NOT NULL, -- What action was performed
  matched_conditions jsonb, -- Which conditions matched
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_routing_rules_organization_id ON public.routing_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_is_active ON public.routing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON public.routing_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_routing_logs_ticket_id ON public.routing_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_routing_logs_routing_rule_id ON public.routing_logs(routing_rule_id);

-- Add comments for documentation
COMMENT ON TABLE public.routing_rules IS 'Rules for automatically routing tickets based on keywords, issue types, tags, etc.';
COMMENT ON COLUMN public.routing_rules.conditions IS 'JSON object with conditions: {keywords: [], issue_types: [], tags: [], context: [], priority: []}';
COMMENT ON COLUMN public.routing_rules.action_type IS 'Type of action: assign_to_agent, assign_to_group, set_priority, add_tag, set_category';
COMMENT ON COLUMN public.routing_rules.action_value IS 'Value for the action (e.g., agent email, priority level, tag name)';
COMMENT ON TABLE public.routing_logs IS 'Log of routing actions applied to tickets for audit and debugging.';

