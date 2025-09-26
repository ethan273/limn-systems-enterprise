-- =====================================================
-- Migration: Fix Business Relationships
-- Date: September 24, 2025
-- Purpose: Establish correct flow: Clients → Projects → Orders → Order Items
-- =====================================================

BEGIN;

-- 1. Add project_id to orders table (critical missing relationship)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_project_id ON orders(project_id);

-- 3. Update existing orders to link to projects based on customer
-- This attempts to match orders to projects by customer and date range
UPDATE orders o
SET project_id = (
    SELECT p.id 
    FROM projects p 
    WHERE p.customer_id = o.customer_id
    AND (o.created_at BETWEEN p.start_date AND COALESCE(p.end_date, CURRENT_DATE)
         OR (p.start_date IS NULL AND p.end_date IS NULL))
    ORDER BY p.created_at DESC
    LIMIT 1
)
WHERE o.project_id IS NULL 
  AND o.customer_id IS NOT NULL;

-- 4. Add status columns if missing
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_status VARCHAR(50) DEFAULT 'active'
CHECK (project_status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled'));

-- 5. Add project tracking fields
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS actual_budget DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS project_manager_id UUID,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 6. Create project_orders_summary view for reporting
CREATE OR REPLACE VIEW project_orders_summary AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.customer_id,
    c.name as client_name,
    p.status as project_status,
    p.budget,
    p.actual_budget,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT oi.id) as total_order_items,
    SUM(o.total_amount) as total_order_value,
    MIN(o.created_at) as first_order_date,
    MAX(o.created_at) as last_order_date,
    p.start_date,
    p.end_date,
    p.completion_percentage
FROM projects p
LEFT JOIN customers c ON p.customer_id = c.id
LEFT JOIN orders o ON o.project_id = p.id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY p.id, p.name, p.customer_id, c.name, p.status, p.budget, 
         p.actual_budget, p.start_date, p.end_date, p.completion_percentage;

-- 7. Create a proper project_order_items view for easy querying
CREATE OR REPLACE VIEW project_order_items_detail AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    o.id as order_id,
    o.order_number,
    o.status as order_status,
    oi.id as order_item_id,
    oi.item_id,
    i.name as item_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    oi.sku_full,
    oi.client_sku,
    c.id as client_id,
    c.name as client_name
FROM projects p
JOIN orders o ON o.project_id = p.id
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN items i ON oi.item_id = i.id
JOIN customers c ON p.customer_id = c.id;

-- 8. Add missing foreign key constraints with proper cascading
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_customer_id_fkey,
ADD CONSTRAINT orders_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_project_id_fkey,
ADD CONSTRAINT orders_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT;

ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_customer_id_fkey,
ADD CONSTRAINT projects_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;

-- 9. Create trigger to auto-update project actual_budget when orders change
CREATE OR REPLACE FUNCTION update_project_actual_budget()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects 
    SET actual_budget = (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM orders
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        AND status NOT IN ('cancelled', 'draft')
    )
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_project_budget_on_order_change ON orders;
CREATE TRIGGER update_project_budget_on_order_change
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION update_project_actual_budget();

-- 10. Create helper function to get project status based on orders
CREATE OR REPLACE FUNCTION get_project_health(project_id UUID)
RETURNS TABLE(
    health_status VARCHAR,
    budget_used DECIMAL,
    orders_count INTEGER,
    items_count INTEGER,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p.actual_budget > p.budget * 1.1 THEN 'over_budget'
            WHEN p.actual_budget > p.budget * 0.9 THEN 'near_budget'
            WHEN p.end_date < CURRENT_DATE THEN 'overdue'
            WHEN p.end_date < CURRENT_DATE + INTERVAL '7 days' THEN 'ending_soon'
            ELSE 'healthy'
        END as health_status,
        COALESCE(p.actual_budget, 0) as budget_used,
        COUNT(DISTINCT o.id)::INTEGER as orders_count,
        COUNT(DISTINCT oi.id)::INTEGER as items_count,
        EXTRACT(DAY FROM (p.end_date - CURRENT_DATE))::INTEGER as days_remaining
    FROM projects p
    LEFT JOIN orders o ON o.project_id = p.id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE p.id = $1
    GROUP BY p.id, p.budget, p.actual_budget, p.end_date;
END;
$$ LANGUAGE plpgsql;

-- 11. Add comments for documentation
COMMENT ON COLUMN orders.project_id IS 'Links order to project (Clients → Projects → Orders flow)';
COMMENT ON VIEW project_orders_summary IS 'Summary view of projects with order statistics';
COMMENT ON VIEW project_order_items_detail IS 'Detailed view linking projects to order items through orders';
COMMENT ON FUNCTION get_project_health IS 'Returns health status metrics for a project';

-- 12. Data validation: Log orders without projects for manual review
CREATE TABLE IF NOT EXISTS migration_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id UUID,
    issue_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO migration_audit_log (migration_name, entity_type, entity_id, issue_description)
SELECT 
    '003_fix_business_relationships',
    'order',
    id,
    'Order ' || order_number || ' has no project assigned'
FROM orders
WHERE project_id IS NULL;

-- Report migration results
DO $$
DECLARE
    orders_with_projects INTEGER;
    orders_without_projects INTEGER;
    total_projects INTEGER;
BEGIN
    SELECT COUNT(*) INTO orders_with_projects FROM orders WHERE project_id IS NOT NULL;
    SELECT COUNT(*) INTO orders_without_projects FROM orders WHERE project_id IS NULL;
    SELECT COUNT(*) INTO total_projects FROM projects;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  - Total projects: %', total_projects;
    RAISE NOTICE '  - Orders linked to projects: %', orders_with_projects;
    RAISE NOTICE '  - Orders without projects: %', orders_without_projects;
    
    IF orders_without_projects > 0 THEN
        RAISE NOTICE '  ⚠️  Some orders could not be automatically linked to projects.';
        RAISE NOTICE '     Check migration_audit_log for details.';
    END IF;
END $$;

COMMIT;

-- Post-migration validation queries (run these manually to verify):
/*
-- Check the new relationships:
SELECT 'Projects by Client' as query, 
       c.name as client, 
       COUNT(p.id) as project_count 
FROM customers c 
LEFT JOIN projects p ON p.customer_id = c.id 
GROUP BY c.id, c.name;

-- Check orders by project:
SELECT 'Orders by Project' as query,
       p.name as project, 
       COUNT(o.id) as order_count,
       SUM(o.total_amount) as total_value
FROM projects p 
LEFT JOIN orders o ON o.project_id = p.id 
GROUP BY p.id, p.name;

-- Check orphaned orders:
SELECT 'Orphaned Orders' as query,
       o.order_number,
       o.created_at,
       c.name as customer
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.project_id IS NULL;
*/