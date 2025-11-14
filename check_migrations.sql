-- Check which migrations have been applied
-- Run this in Supabase SQL Editor to verify

-- Check if organizations table exists (migration 009)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'organizations'
    ) THEN '✅ Migration 009: organizations table EXISTS'
    ELSE '❌ Migration 009: organizations table MISSING - Run 009_organizations_and_super_admin.sql first!'
  END as migration_009_status;

-- Check if routing_rules table exists (migration 010)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'routing_rules'
    ) THEN '✅ Migration 010: routing_rules table EXISTS'
    ELSE '❌ Migration 010: routing_rules table MISSING'
  END as migration_010_status;

-- Check if tags table exists (migration 011)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tags'
    ) THEN '✅ Migration 011: tags table EXISTS'
    ELSE '❌ Migration 011: tags table MISSING'
  END as migration_011_status;

