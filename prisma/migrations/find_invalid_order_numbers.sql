-- Find orders with invalid order number formats
-- Expected format: ORD-XXXXXX (ORD- followed by exactly 6 digits)

SELECT
  id,
  order_number,
  customer_id,
  status,
  created_at,
  CASE
    WHEN order_number IS NULL THEN 'NULL order_number'
    WHEN order_number !~ '^ORD-' THEN 'Missing ORD- prefix'
    WHEN order_number !~ '^ORD-[0-9]+$' THEN 'Contains non-digits after ORD-'
    WHEN order_number ~ '^ORD-[0-9]{1,5}$' THEN 'Too few digits (less than 6)'
    WHEN order_number ~ '^ORD-[0-9]{7,}$' THEN 'Too many digits (more than 6)'
    ELSE 'Other format issue'
  END as issue_type
FROM orders
WHERE order_number !~ '^ORD-[0-9]{6}$'
ORDER BY created_at DESC;

-- Count by issue type
SELECT
  CASE
    WHEN order_number IS NULL THEN 'NULL order_number'
    WHEN order_number !~ '^ORD-' THEN 'Missing ORD- prefix'
    WHEN order_number !~ '^ORD-[0-9]+$' THEN 'Contains non-digits after ORD-'
    WHEN order_number ~ '^ORD-[0-9]{1,5}$' THEN 'Too few digits (less than 6)'
    WHEN order_number ~ '^ORD-[0-9]{7,}$' THEN 'Too many digits (more than 6)'
    ELSE 'Other format issue'
  END as issue_type,
  COUNT(*) as count
FROM orders
WHERE order_number !~ '^ORD-[0-9]{6}$'
GROUP BY issue_type
ORDER BY count DESC;
