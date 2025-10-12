#!/bin/bash

echo "🔧 Applying Business Relationships Fix"
echo "======================================"
echo ""

# Get database URL from .env file
export DATABASE_URL=$(grep DIRECT_URL .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

echo "1️⃣ Applying migration to fix relationships..."
psql "$DATABASE_URL" < migrations/003_fix_business_relationships.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
else
    echo "❌ Migration failed. Please check your database connection."
    exit 1
fi

echo ""
echo "2️⃣ Running validation queries..."
psql "$DATABASE_URL" << EOF
-- Show relationship summary
SELECT 'RELATIONSHIP SUMMARY' as report;
SELECT '===================' as divider;

-- Projects per client
SELECT 
    'Clients with Projects' as metric,
    COUNT(DISTINCT c.id) as count,
    COUNT(DISTINCT p.id) as total_projects
FROM customers c
LEFT JOIN projects p ON p.customer_id = c.id
WHERE p.id IS NOT NULL;

-- Orders per project
SELECT 
    'Projects with Orders' as metric,
    COUNT(DISTINCT p.id) as count,
    COUNT(DISTINCT o.id) as total_orders
FROM projects p
LEFT JOIN orders o ON o.project_id = p.id
WHERE o.id IS NOT NULL;

-- Orphaned orders
SELECT 
    'Orders without Projects' as metric,
    COUNT(*) as count
FROM orders
WHERE project_id IS NULL;

-- Show sample of new relationships
SELECT '' as blank;
SELECT 'SAMPLE PROJECT → ORDER RELATIONSHIPS' as report;
SELECT '====================================' as divider;
SELECT 
    p.name as project,
    COUNT(o.id) as orders,
    SUM(o.total_amount) as total_value
FROM projects p
LEFT JOIN orders o ON o.project_id = p.id
GROUP BY p.id, p.name
ORDER BY COUNT(o.id) DESC
LIMIT 5;
EOF

echo ""
echo "3️⃣ Pulling updated schema..."
npx prisma db pull

echo ""
echo "✅ Business relationships fixed!"
echo ""
echo "New flow established:"
echo "  Clients (customers) → Projects → Orders → Order Items"
echo ""
echo "Next steps:"
echo "  1. Review migration_audit_log for any orphaned orders"
echo "  2. Update tRPC routers to use project relationships"
echo "  3. Update UI components to show project context"