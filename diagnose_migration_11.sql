-- Diagnostic query to check the state of tables before running migration 011
-- Run this first to see what exists

-- Check if tags table exists and its columns
SELECT 
  'tags' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'tags'
    ) THEN 'EXISTS'
    ELSE 'DOES NOT EXIST'
  END as table_status,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'tags' 
        AND column_name = 'organization_id'
    ) THEN 'HAS organization_id column'
    ELSE 'MISSING organization_id column'
  END as column_status;

-- Check if categories table exists and its columns
SELECT 
  'categories' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'categories'
    ) THEN 'EXISTS'
    ELSE 'DOES NOT EXIST'
  END as table_status,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'organization_id'
    ) THEN 'HAS organization_id column'
    ELSE 'MISSING organization_id column'
  END as column_status;

-- Show all columns in tags table if it exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tags'
ORDER BY ordinal_position;

-- Show all columns in categories table if it exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'categories'
ORDER BY ordinal_position;

