-- ============================================
-- RBAC Phase 1 - Role & Permission Seeding Script
-- Populates role_definitions, permission_definitions, and role_permissions
-- Date: 2025-10-27
-- ============================================

-- ============================================
-- STEP 1: Insert Role Definitions
-- ============================================

INSERT INTO public.role_definitions (role_key, role_name, description, hierarchy_level, is_system, is_active)
VALUES
    ('super_admin', 'Super Administrator', 'Full system access with all permissions. Can manage other admins.', 100, true, true),
    ('admin', 'Administrator', 'Administrative access to manage users, settings, and view audit logs.', 90, true, true),
    ('manager', 'Manager', 'Manage production, orders, and team operations. Approve workflows.', 80, true, true),
    ('team_lead', 'Team Lead', 'Lead teams and approve work within scope. Limited admin capabilities.', 70, true, true),
    ('developer', 'Developer', 'Development and technical operations access.', 60, true, true),
    ('designer', 'Designer', 'Design and creative work access. Can create and edit designs.', 60, true, true),
    ('analyst', 'Analyst', 'Analytics, reporting, and financial data access.', 60, true, true),
    ('user', 'Standard User', 'Standard user access to view and create content.', 50, true, true),
    ('viewer', 'Viewer', 'Read-only access to production and order data.', 10, true, true)
ON CONFLICT (role_key) DO UPDATE SET
    role_name = EXCLUDED.role_name,
    description = EXCLUDED.description,
    hierarchy_level = EXCLUDED.hierarchy_level,
    updated_at = NOW();

-- ============================================
-- STEP 2: Insert Permission Definitions
-- ============================================

-- Admin Permissions
INSERT INTO public.permission_definitions (permission_key, permission_name, description, category, is_system, is_active)
VALUES
    ('admin.access', 'Admin Portal Access', 'Access to the admin portal and administrative features', 'admin', true, true),
    ('admin.manage_users', 'Manage Users', 'Create, update, and delete user accounts', 'admin', true, true),
    ('admin.manage_roles', 'Manage Roles', 'Assign and remove user roles and permissions', 'admin', true, true),
    ('admin.view_audit', 'View Audit Logs', 'Access audit logs and security events', 'admin', true, true),
    ('admin.manage_settings', 'Manage Settings', 'Modify system settings and configurations', 'admin', true, true)
ON CONFLICT (permission_key) DO UPDATE SET
    permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    updated_at = NOW();

-- Production Permissions
INSERT INTO public.permission_definitions (permission_key, permission_name, description, category, is_system, is_active)
VALUES
    ('production.view', 'View Production', 'View production orders and data', 'production', true, true),
    ('production.create', 'Create Production Orders', 'Create new production orders', 'production', true, true),
    ('production.edit', 'Edit Production Orders', 'Modify existing production orders', 'production', true, true),
    ('production.delete', 'Delete Production Orders', 'Remove production orders', 'production', true, true),
    ('production.approve', 'Approve Production', 'Approve production orders and workflows', 'production', true, true)
ON CONFLICT (permission_key) DO UPDATE SET
    permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Order Permissions
INSERT INTO public.permission_definitions (permission_key, permission_name, description, category, is_system, is_active)
VALUES
    ('orders.view', 'View Orders', 'View customer orders', 'orders', true, true),
    ('orders.create', 'Create Orders', 'Create new customer orders', 'orders', true, true),
    ('orders.edit', 'Edit Orders', 'Modify existing orders', 'orders', true, true),
    ('orders.delete', 'Delete Orders', 'Remove orders from the system', 'orders', true, true),
    ('orders.approve', 'Approve Orders', 'Approve orders for processing', 'orders', true, true)
ON CONFLICT (permission_key) DO UPDATE SET
    permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Finance Permissions
INSERT INTO public.permission_definitions (permission_key, permission_name, description, category, is_system, is_active)
VALUES
    ('finance.view', 'View Financial Data', 'Access financial reports and data', 'finance', true, true),
    ('finance.edit', 'Edit Financial Records', 'Modify financial records', 'finance', true, true),
    ('finance.approve', 'Approve Financial Transactions', 'Approve payments and transactions', 'finance', true, true)
ON CONFLICT (permission_key) DO UPDATE SET
    permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- User Management Permissions
INSERT INTO public.permission_definitions (permission_key, permission_name, description, category, is_system, is_active)
VALUES
    ('users.view', 'View Users', 'View user list and profiles', 'users', true, true),
    ('users.edit', 'Edit Users', 'Modify user profiles and settings', 'users', true, true),
    ('users.delete', 'Delete Users', 'Remove user accounts', 'users', true, true)
ON CONFLICT (permission_key) DO UPDATE SET
    permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Analytics Permissions
INSERT INTO public.permission_definitions (permission_key, permission_name, description, category, is_system, is_active)
VALUES
    ('analytics.view', 'View Basic Analytics', 'Access basic analytics and reports', 'analytics', true, true),
    ('analytics.advanced', 'Advanced Analytics', 'Access advanced analytics features', 'analytics', true, true)
ON CONFLICT (permission_key) DO UPDATE SET
    permission_name = EXCLUDED.permission_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================
-- STEP 3: Map Roles to Permissions
-- ============================================

-- Helper function to get role ID by key
CREATE OR REPLACE FUNCTION get_role_id(role_key_param VARCHAR) RETURNS UUID AS $$
    SELECT id FROM public.role_definitions WHERE role_key = role_key_param LIMIT 1;
$$ LANGUAGE SQL;

-- Helper function to get permission ID by key
CREATE OR REPLACE FUNCTION get_permission_id(permission_key_param VARCHAR) RETURNS UUID AS $$
    SELECT id FROM public.permission_definitions WHERE permission_key = permission_key_param LIMIT 1;
$$ LANGUAGE SQL;

-- SUPER_ADMIN: All permissions
INSERT INTO public.role_permissions (role_id, permission_id, is_active)
SELECT
    get_role_id('super_admin'),
    id,
    true
FROM public.permission_definitions
WHERE is_active = true
ON CONFLICT (role_id, permission_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ADMIN: Admin + Production + Orders + Finance + Users + Analytics permissions
INSERT INTO public.role_permissions (role_id, permission_id, is_active)
SELECT
    get_role_id('admin'),
    id,
    true
FROM public.permission_definitions
WHERE permission_key IN (
    'admin.access', 'admin.manage_users', 'admin.manage_roles', 'admin.view_audit',
    'production.view', 'production.create', 'production.edit', 'production.approve',
    'orders.view', 'orders.create', 'orders.edit', 'orders.approve',
    'finance.view',
    'users.view', 'users.edit',
    'analytics.view', 'analytics.advanced'
)
ON CONFLICT (role_id, permission_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- MANAGER: Production + Orders + Finance + Users + Analytics (view)
INSERT INTO public.role_permissions (role_id, permission_id, is_active)
SELECT
    get_role_id('manager'),
    id,
    true
FROM public.permission_definitions
WHERE permission_key IN (
    'production.view', 'production.create', 'production.edit', 'production.approve',
    'orders.view', 'orders.create', 'orders.edit', 'orders.approve',
    'finance.view',
    'users.view',
    'analytics.view'
)
ON CONFLICT (role_id, permission_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- TEAM_LEAD: Production + Orders (limited) + Users (view) + Analytics (view)
INSERT INTO public.role_permissions (role_id, permission_id, is_active)
SELECT
    get_role_id('team_lead'),
    id,
    true
FROM public.permission_definitions
WHERE permission_key IN (
    'production.view', 'production.create', 'production.edit',
    'orders.view', 'orders.create', 'orders.edit',
    'users.view',
    'analytics.view'
)
ON CONFLICT (role_id, permission_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- DEVELOPER: Production + Orders (view + edit) + Analytics (view)
INSERT INTO public.role_permissions (role_id, permission_id, is_active)
SELECT
    get_role_id('developer'),
    id,
    true
FROM public.permission_definitions
WHERE permission_key IN (
    'production.view', 'production.create', 'production.edit',
    'orders.view',
    'analytics.view'
)
ON CONFLICT (role_id, permission_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- DESIGNER: Production + Orders (view + create)
INSERT INTO public.role_permissions (role_id, permission_id, is_active)
SELECT
    get_role_id('designer'),
    id,
    true
FROM public.permission_definitions
WHERE permission_key IN (
    'production.view', 'production.create',
    'orders.view',
    'analytics.view'
)
ON CONFLICT (role_id, permission_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ANALYST: Production + Orders + Finance + Analytics (all)
INSERT INTO public.role_permissions (role_id, permission_id, is_active)
SELECT
    get_role_id('analyst'),
    id,
    true
FROM public.permission_definitions
WHERE permission_key IN (
    'production.view',
    'orders.view',
    'finance.view',
    'analytics.view', 'analytics.advanced'
)
ON CONFLICT (role_id, permission_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- USER: Production + Orders (view)
INSERT INTO public.role_permissions (role_id, permission_id, is_active)
SELECT
    get_role_id('user'),
    id,
    true
FROM public.permission_definitions
WHERE permission_key IN (
    'production.view',
    'orders.view'
)
ON CONFLICT (role_id, permission_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- VIEWER: Production (view only)
INSERT INTO public.role_permissions (role_id, permission_id, is_active)
SELECT
    get_role_id('viewer'),
    id,
    true
FROM public.permission_definitions
WHERE permission_key IN (
    'production.view'
)
ON CONFLICT (role_id, permission_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Clean up helper functions
DROP FUNCTION IF EXISTS get_role_id(VARCHAR);
DROP FUNCTION IF EXISTS get_permission_id(VARCHAR);

-- ============================================
-- STEP 4: Verification
-- ============================================

-- Count roles
SELECT COUNT(*) AS total_roles FROM public.role_definitions WHERE is_active = true;

-- Count permissions
SELECT COUNT(*) AS total_permissions FROM public.permission_definitions WHERE is_active = true;

-- Count role-permission mappings
SELECT COUNT(*) AS total_mappings FROM public.role_permissions WHERE is_active = true;

-- Show role-permission summary
SELECT
    rd.role_name,
    rd.hierarchy_level,
    COUNT(rp.id) AS permission_count
FROM public.role_definitions rd
LEFT JOIN public.role_permissions rp ON rd.id = rp.role_id AND rp.is_active = true
WHERE rd.is_active = true
GROUP BY rd.role_name, rd.hierarchy_level
ORDER BY rd.hierarchy_level DESC;

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Role and permission seeding complete!';
    RAISE NOTICE '   - 9 roles defined';
    RAISE NOTICE '   - 23 permissions defined';
    RAISE NOTICE '   - Role-permission mappings created';
    RAISE NOTICE '';
    RAISE NOTICE 'RBAC system is now database-driven!';
END $$;
