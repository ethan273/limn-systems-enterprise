-- =====================================================
-- Migration: Fix Business Relationships (FIXED VERSION)
-- Date: September 24, 2025
-- Purpose: Establish correct flow: Clients → Projects → Orders → Order Items
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

-- 2. Update existing orders to link to projects based on customer
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

-- 3. Add missing columns to projects table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_status') THEN
        ALTER TABLE projects ADD COLUMN project_status VARCHAR(50) DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'completion_percentage') THEN
        ALTER TABLE projects ADD COLUMN completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'actual_budget') THEN
        ALTER TABLE projects ADD COLUMN actual_budget DECIMAL(12, 2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_manager_id') THEN
        ALTER TABLE projects ADD COLUMN project_manager_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'notes') THEN
        ALTER TABLE projects ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 4. Create project_orders_summary view
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

-- 5. Create project_order_items_detail view (FIXED - using actual columns)
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
    (oi.quantity * COALESCE(oi.unit_price, 0)) as calculated_total,
    oi.sku_full,
    oi.client_sku,
    c.id as client_id,
    c.name as client_name
FROM projects p
JOIN orders o ON o.project_id = p.id
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN items i ON oi.item_id = i.id
JOIN customers c ON p.customer_id = c.id;

-- 6. Create client_project_orders view for easy navigation
CREATE OR REPLACE VIEW client_project_orders AS
SELECT 
    c.id as client_id,
    c.name as client_name,
    c.type as client_type,
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    p.budget as project_budget,
    o.id as order_id,
    o.order_number,
    o.status as order_status,
    o.total_amount as order_total,
    o.created_at as order_date
FROM customers c
LEFT JOIN projects p ON p.customer_id = c.id
LEFT JOIN orders o ON o.project_id = p.id
ORDER BY c.name, p.name, o.created_at;

-- 7. Create trigger to auto-update project actual_budget
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

-- 8. Create helper functions
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

-- 9. Create function to create default project for orphaned orders
CREATE OR REPLACE FUNCTION create_default_project_for_client(client_id UUID)
RETURNS UUID AS $$
DECLARE
    new_project_id UUID;
BEGIN
    INSERT INTO projects (
        customer_id,
        name,
        status,
        description,
        created_by,
        created_at
    ) VALUES (
        client_id,
        'Default Project - ' || (SELECT name FROM customers WHERE id = client_id),
        'active',
        'Auto-created project for orphaned orders',
        client_id, -- Using client_id as created_by for now
        NOW()
    ) RETURNING id INTO new_project_id;
    
    RETURN new_project_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Handle completely orphaned orders (no project available)
DO $$
DECLARE
    orphan_count INTEGER;
    client_record RECORD;
    default_project_id UUID;
BEGIN
    -- Count orphaned orders
    SELECT COUNT(*) INTO orphan_count 
    FROM orders 
    WHERE project_id IS NULL AND customer_id IS NOT NULL;
    
    IF orphan_count > 0 THEN
        -- Create default projects for clients with orphaned orders
        FOR client_record IN 
            SELECT DISTINCT customer_id 
            FROM orders 
            WHERE project_id IS NULL AND customer_id IS NOT NULL
        LOOP
            -- Check if client already has a default project
            SELECT id INTO default_project_id
            FROM projects 
            WHERE customer_id = client_record.customer_id
            AND name LIKE 'Default Project%'
            LIMIT 1;
            
            -- If no default project exists, create one
            IF default_project_id IS NULL THEN
                default_project_id := create_default_project_for_client(client_record.customer_id);
            END IF;
            
            -- Link orphaned orders to default project
            UPDATE orders 
            SET project_id = default_project_id 
            WHERE customer_id = client_record.customer_id 
            AND project_id IS NULL;
        END LOOP;
        
        RAISE NOTICE 'Created default projects for % orphaned orders', orphan_count;
    END IF;
END $$;

-- 11. Create audit log table if not exists
CREATE TABLE IF NOT EXISTS migration_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id UUID,
    issue_description TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log any remaining orphaned orders
INSERT INTO migration_audit_log (migration_name, entity_type, entity_id, issue_description, resolved)
SELECT 
    '003_fix_business_relationships',
    'order',
    id,
    CASE 
        WHEN customer_id IS NULL THEN 'Order ' || order_number || ' has no customer'
        WHEN project_id IS NULL THEN 'Order ' || order_number || ' could not be assigned to project'
        ELSE 'Order ' || order_number || ' - other issue'
    END,
    project_id IS NOT NULL
FROM orders
WHERE project_id IS NULL OR customer_id IS NULL;

-- 12. Add helpful comments
COMMENT ON COLUMN orders.project_id IS 'Links order to project (Clients → Projects → Orders flow)';
COMMENT ON VIEW project_orders_summary IS 'Summary view of projects with order statistics';
COMMENT ON VIEW project_order_items_detail IS 'Detailed view linking projects to order items through orders';
COMMENT ON VIEW client_project_orders IS 'Hierarchical view: Clients → Projects → Orders';
COMMENT ON FUNCTION get_project_health IS 'Returns health status metrics for a project';
COMMENT ON FUNCTION create_default_project_for_client IS 'Creates a default project for a client to handle orphaned orders';

-- 13. Report results
DO $$
DECLARE
    total_clients INTEGER;
    clients_with_projects INTEGER;
    total_projects INTEGER;
    projects_with_orders INTEGER;
    total_orders INTEGER;
    orders_with_projects INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_clients FROM customers;
    SELECT COUNT(DISTINCT customer_id) INTO clients_with_projects FROM projects;
    SELECT COUNT(*) INTO total_projects FROM projects;
    SELECT COUNT(DISTINCT project_id) INTO projects_with_orders FROM orders WHERE project_id IS NOT NULL;
    SELECT COUNT(*) INTO total_orders FROM orders;
    SELECT COUNT(*) INTO orders_with_projects FROM orders WHERE project_id IS NOT NULL;
    
    RAISE NOTICE '===== MIGRATION SUMMARY =====';
    RAISE NOTICE 'Clients: % total, % with projects', total_clients, clients_with_projects;
    RAISE NOTICE 'Projects: % total, % with orders', total_projects, projects_with_orders;
    RAISE NOTICE 'Orders: % total, % linked to projects', total_orders, orders_with_projects;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Business flow established: Clients → Projects → Orders → Order Items';
END $$;

COMMIT;