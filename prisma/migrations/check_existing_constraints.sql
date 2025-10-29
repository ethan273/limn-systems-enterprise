-- Check what constraints currently exist
SELECT
  constraint_name,
  table_name
FROM information_schema.constraint_column_usage
WHERE constraint_name LIKE '%orders%'
  AND constraint_name NOT LIKE '%pkey%'
  AND constraint_name NOT LIKE '%fkey%'
ORDER BY table_name, constraint_name;
