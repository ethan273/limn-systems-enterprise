-- =====================================================
-- Migration: Fix Business Relationships (SIMPLE VERSION)
-- Date: September 24, 2025
-- Purpose: Add project_id to orders and establish relationships
-- =====================================================

BEGIN;

-- 1. Add project_id to orders table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN project_id UUID REFERENCES projects(id);
        CREATE INDEX idx_orders_project_id ON orders(project_id);
    END IF;
END $$;

-- 2. Update existing orders to link to projects where possible
UPDATE orders o
SET project_id = (
    SELECT p.id 
    FROM projects p 
    WHERE p.customer_id = o.customer_id
    ORDER BY 
        CASE 
            WHEN o.created_at BETWEEN p.start_date AND COALESCE(p.end_date, CURRENT_DATE + INTERVAL '1 year') THEN 1
            WHEN p.start_date IS NULL THEN 2
            ELSE 3
        END,
        p.created_at DESC
    LIMIT 1
)
WHERE o.project_id IS NULL 
  AND o.customer_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM projects WHERE customer_id = o.customer_id);

-- 3. Create summary views
CREATE OR REPLACE VIEW project_orders_summary AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.customer_id,
    c.name as client_name,
    p.status as project_status,
    p.budget,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT oi.id) as total_order_items,
    SUM(o.total_amount) as total_order_value,
    MIN(o.created_at) as first_order_date,
    MAX(o.created_at) as last_order_date
FROM projects p
LEFT JOIN customers c ON p.customer_id = c.id
LEFT JOIN orders o ON o.project_id = p.id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY p.id, p.name, p.customer_id, c.name, p.status, p.budget;

-- 4. Create detailed view
CREATE OR REPLACE VIEW project_order_details AS
SELECT 
    c.id as client_id,
    c.name as client_name,
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    o.id as order_id,
    o.order_number,
    o.status as order_status,
    o.total_amount as order_total,
    oi.id as order_item_id,
    oi.item_id,
    i.name as item_name,
    oi.quantity,
    oi.unit_price,
    (oi.quantity * COALESCE(oi.unit_price, 0)) as line_total,
    oi.sku_full,
    oi.client_sku
FROM customers c
LEFT JOIN projects p ON p.customer_id = c.id
LEFT JOIN orders o ON o.project_id = p.id
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN items i ON oi.item_id = i.id;

-- 5. Create audit table
CREATE TABLE IF NOT EXISTS migration_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id UUID,
    issue_description TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Log orphaned orders (orders without projects)
INSERT INTO migration_audit_log (migration_name, entity_type, entity_id, issue_description, resolved)
SELECT 
    '003_fix_relationships_simple',
    'order',
    o.id,
    'Order ' || o.order_number || ' for customer ' || c.name || ' has no project',
    FALSE
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.project_id IS NULL AND o.customer_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 7. Add documentation
COMMENT ON COLUMN orders.project_id IS 'Links order to project (Clients → Projects → Orders → Order Items flow)';
COMMENT ON VIEW project_orders_summary IS 'Summary of orders grouped by project';
COMMENT ON VIEW project_order_details IS 'Full hierarchy: Clients → Projects → Orders → Order Items';

-- 8. Report results
DO $$
DECLARE
    total_orders INTEGER;
    orders_with_projects INTEGER;
    orphaned_orders INTEGER;
    clients_needing_projects INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_orders FROM orders;
    SELECT COUNT(*) INTO orders_with_projects FROM orders WHERE project_id IS NOT NULL;
    SELECT COUNT(*) INTO orphaned_orders FROM orders WHERE project_id IS NULL;
    SELECT COUNT(DISTINCT customer_id) INTO clients_needing_projects 
    FROM orders 
    WHERE project_id IS NULL AND customer_id IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '===== MIGRATION COMPLETE =====';
    RAISE NOTICE 'Total orders: %', total_orders;
    RAISE NOTICE 'Orders linked to projects: %', orders_with_projects;
    RAISE NOTICE 'Orphaned orders: %', orphaned_orders;
    
    IF orphaned_orders > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  % clients need projects created for their orphaned orders', clients_needing_projects;
        RAISE NOTICE 'Check migration_audit_log table for details';
    END IF;
END $$;

COMMIT;