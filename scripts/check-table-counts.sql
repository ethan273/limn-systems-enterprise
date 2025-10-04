-- Check row counts for all tables to identify which need seeding
SELECT
    schemaname,
    tablename,
    (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT
    table_name AS tablename,
    table_schema AS schemaname,
    query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I.%I', table_schema, table_name), false, true, '') AS xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
) t
ORDER BY row_count DESC, tablename;
