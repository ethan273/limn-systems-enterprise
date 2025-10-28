/**
 * RBAC Phase 3: Enterprise Features Migration
 *
 * This migration adds:
 * - Multi-tenancy support (organization-scoped permissions)
 * - Permission templates (pre-defined permission sets)
 *
 * CRITICAL: This must be applied to BOTH dev and prod databases
 *
 * Date: October 27, 2025
 * Phase: 3 - Enterprise Features
 */

-- ============================================
-- Phase 3.1: Multi-Tenancy Support
-- ============================================

/**
 * Table: organization_members
 * Purpose: Map users to organizations with organization-specific roles
 */
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Organization-specific roles (can differ from global roles)
  organization_roles TEXT[] DEFAULT '{}',

  -- Membership status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  is_primary_org BOOLEAN DEFAULT false,

  -- Metadata
  joined_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  invitation_accepted_at TIMESTAMPTZ(6),

  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_org_member UNIQUE(organization_id, user_id)
);

COMMENT ON TABLE public.organization_members IS 'Maps users to organizations with organization-specific roles';
COMMENT ON COLUMN public.organization_members.organization_roles IS 'Array of role keys that apply within this organization context';
COMMENT ON COLUMN public.organization_members.is_primary_org IS 'Flag for user''s primary/default organization';

-- Indexes for organization_members
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_status ON public.organization_members(status);
CREATE INDEX idx_org_members_primary ON public.organization_members(user_id, is_primary_org) WHERE is_primary_org = true;

/**
 * Table: organization_permissions
 * Purpose: Grant specific permissions to users within an organization context
 */
CREATE TABLE IF NOT EXISTS public.organization_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permission_definitions(id) ON DELETE CASCADE,

  -- Optional scope constraints
  resource_type VARCHAR(100),
  resource_id UUID,
  scope_metadata JSONB,

  -- Grant details
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ(6),
  reason TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_org_perm UNIQUE(organization_id, user_id, permission_id, resource_type, resource_id)
);

COMMENT ON TABLE public.organization_permissions IS 'Grants specific permissions to users within an organization context';
COMMENT ON COLUMN public.organization_permissions.scope_metadata IS 'Optional JSONB constraints for the permission (e.g., {status: ["draft", "pending"]})';
COMMENT ON COLUMN public.organization_permissions.expires_at IS 'When NULL, permission never expires';

-- Indexes for organization_permissions
CREATE INDEX idx_org_perms_org ON public.organization_permissions(organization_id);
CREATE INDEX idx_org_perms_user ON public.organization_permissions(user_id);
CREATE INDEX idx_org_perms_permission ON public.organization_permissions(permission_id);
CREATE INDEX idx_org_perms_resource ON public.organization_permissions(resource_type, resource_id);
CREATE INDEX idx_org_perms_active ON public.organization_permissions(is_active) WHERE is_active = true;
CREATE INDEX idx_org_perms_expires ON public.organization_permissions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_org_perms_metadata ON public.organization_permissions USING GIN (scope_metadata jsonb_path_ops);

-- ============================================
-- Phase 3.2: Permission Templates
-- ============================================

/**
 * Table: permission_templates
 * Purpose: Define named permission templates for quick assignment
 */
CREATE TABLE IF NOT EXISTS public.permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL UNIQUE,
  template_description TEXT,

  -- Scope
  is_global BOOLEAN DEFAULT true,
  organization_id UUID,  -- NULL for global templates

  -- Metadata
  category VARCHAR(50),  -- 'onboarding', 'department', 'project', etc.
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_template_org CHECK (
    (is_global = true AND organization_id IS NULL) OR
    (is_global = false AND organization_id IS NOT NULL)
  )
);

COMMENT ON TABLE public.permission_templates IS 'Pre-defined sets of permissions that can be quickly assigned to users or roles';
COMMENT ON COLUMN public.permission_templates.is_global IS 'True for system-wide templates, false for organization-specific templates';
COMMENT ON COLUMN public.permission_templates.is_system_template IS 'System templates cannot be deleted';

-- Indexes for permission_templates
CREATE INDEX idx_perm_templates_name ON public.permission_templates(template_name);
CREATE INDEX idx_perm_templates_org ON public.permission_templates(organization_id);
CREATE INDEX idx_perm_templates_category ON public.permission_templates(category);
CREATE INDEX idx_perm_templates_active ON public.permission_templates(is_active) WHERE is_active = true;

/**
 * Table: permission_template_items
 * Purpose: Map permissions to templates
 */
CREATE TABLE IF NOT EXISTS public.permission_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.permission_templates(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permission_definitions(id) ON DELETE CASCADE,

  -- Optional scope constraints
  resource_type VARCHAR(100),
  scope_metadata JSONB,

  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_template_item UNIQUE(template_id, permission_id, resource_type)
);

COMMENT ON TABLE public.permission_template_items IS 'Junction table mapping permissions to templates';
COMMENT ON COLUMN public.permission_template_items.resource_type IS 'Optional resource type filter (e.g., "project", "order")';

-- Indexes for permission_template_items
CREATE INDEX idx_perm_template_items_template ON public.permission_template_items(template_id);
CREATE INDEX idx_perm_template_items_permission ON public.permission_template_items(permission_id);
CREATE INDEX idx_perm_template_items_resource ON public.permission_template_items(resource_type);

-- ============================================
-- Seed System Templates
-- ============================================

/**
 * Seed pre-defined system templates
 * These templates speed up onboarding and ensure consistency
 */

-- Get permission IDs for seeding
DO $$
DECLARE
  template_new_employee UUID;
  template_production_manager UUID;
  template_finance_member UUID;
  template_project_readonly UUID;
  template_designer_full UUID;

  perm_users_view UUID;
  perm_projects_view UUID;
  perm_orders_view UUID;
  perm_analytics_view UUID;
  perm_production_view UUID;
  perm_production_create UUID;
  perm_production_edit UUID;
  perm_production_manage UUID;
  perm_production_delete UUID;
  perm_orders_edit UUID;
  perm_orders_approve UUID;
  perm_finance_view UUID;
  perm_finance_edit UUID;
  perm_finance_reports UUID;
  perm_finance_approve UUID;
  perm_projects_create UUID;
  perm_projects_edit UUID;
  perm_projects_manage UUID;
  perm_projects_delete UUID;

BEGIN
  -- Get permission IDs
  SELECT id INTO perm_users_view FROM public.permission_definitions WHERE permission_key = 'users:view';
  SELECT id INTO perm_projects_view FROM public.permission_definitions WHERE permission_key = 'projects:view';
  SELECT id INTO perm_orders_view FROM public.permission_definitions WHERE permission_key = 'orders:view';
  SELECT id INTO perm_analytics_view FROM public.permission_definitions WHERE permission_key = 'analytics:view';
  SELECT id INTO perm_production_view FROM public.permission_definitions WHERE permission_key = 'production:view';
  SELECT id INTO perm_production_create FROM public.permission_definitions WHERE permission_key = 'production:create';
  SELECT id INTO perm_production_edit FROM public.permission_definitions WHERE permission_key = 'production:edit';
  SELECT id INTO perm_production_manage FROM public.permission_definitions WHERE permission_key = 'production:manage';
  SELECT id INTO perm_production_delete FROM public.permission_definitions WHERE permission_key = 'production:delete';
  SELECT id INTO perm_orders_edit FROM public.permission_definitions WHERE permission_key = 'orders:edit';
  SELECT id INTO perm_orders_approve FROM public.permission_definitions WHERE permission_key = 'orders:approve';
  SELECT id INTO perm_finance_view FROM public.permission_definitions WHERE permission_key = 'finance:view';
  SELECT id INTO perm_finance_edit FROM public.permission_definitions WHERE permission_key = 'finance:edit';
  SELECT id INTO perm_finance_reports FROM public.permission_definitions WHERE permission_key = 'finance:reports';
  SELECT id INTO perm_finance_approve FROM public.permission_definitions WHERE permission_key = 'finance:approve';
  SELECT id INTO perm_projects_create FROM public.permission_definitions WHERE permission_key = 'projects:create';
  SELECT id INTO perm_projects_edit FROM public.permission_definitions WHERE permission_key = 'projects:edit';
  SELECT id INTO perm_projects_manage FROM public.permission_definitions WHERE permission_key = 'projects:manage';
  SELECT id INTO perm_projects_delete FROM public.permission_definitions WHERE permission_key = 'projects:delete';

  -- Template 1: New Employee - Standard
  INSERT INTO public.permission_templates (template_name, template_description, category, is_system_template, is_global)
  VALUES (
    'New Employee - Standard',
    'Standard permissions for new employees - view-only access to common resources',
    'onboarding',
    true,
    true
  ) ON CONFLICT (template_name) DO NOTHING
  RETURNING id INTO template_new_employee;

  IF template_new_employee IS NOT NULL THEN
    INSERT INTO public.permission_template_items (template_id, permission_id)
    VALUES
      (template_new_employee, perm_users_view),
      (template_new_employee, perm_projects_view),
      (template_new_employee, perm_orders_view),
      (template_new_employee, perm_analytics_view)
    ON CONFLICT (template_id, permission_id, resource_type) DO NOTHING;
  END IF;

  -- Template 2: Production Manager
  INSERT INTO public.permission_templates (template_name, template_description, category, is_system_template, is_global)
  VALUES (
    'Production Manager',
    'Full production management permissions - create, edit, manage production orders',
    'department',
    true,
    true
  ) ON CONFLICT (template_name) DO NOTHING
  RETURNING id INTO template_production_manager;

  IF template_production_manager IS NOT NULL THEN
    INSERT INTO public.permission_template_items (template_id, permission_id)
    VALUES
      (template_production_manager, perm_production_view),
      (template_production_manager, perm_production_create),
      (template_production_manager, perm_production_edit),
      (template_production_manager, perm_production_manage),
      (template_production_manager, perm_production_delete),
      (template_production_manager, perm_orders_view),
      (template_production_manager, perm_orders_edit),
      (template_production_manager, perm_orders_approve)
    ON CONFLICT (template_id, permission_id, resource_type) DO NOTHING;
  END IF;

  -- Template 3: Finance Team Member
  INSERT INTO public.permission_templates (template_name, template_description, category, is_system_template, is_global)
  VALUES (
    'Finance Team Member',
    'Finance department permissions - view, edit financial data, generate reports',
    'department',
    true,
    true
  ) ON CONFLICT (template_name) DO NOTHING
  RETURNING id INTO template_finance_member;

  IF template_finance_member IS NOT NULL THEN
    INSERT INTO public.permission_template_items (template_id, permission_id)
    VALUES
      (template_finance_member, perm_finance_view),
      (template_finance_member, perm_finance_edit),
      (template_finance_member, perm_finance_reports),
      (template_finance_member, perm_finance_approve),
      (template_finance_member, perm_orders_view)
    ON CONFLICT (template_id, permission_id, resource_type) DO NOTHING;
  END IF;

  -- Template 4: Project Team - Read Only
  INSERT INTO public.permission_templates (template_name, template_description, category, is_system_template, is_global)
  VALUES (
    'Project Team - Read Only',
    'Read-only access to project resources - suitable for stakeholders and observers',
    'project',
    true,
    true
  ) ON CONFLICT (template_name) DO NOTHING
  RETURNING id INTO template_project_readonly;

  IF template_project_readonly IS NOT NULL THEN
    INSERT INTO public.permission_template_items (template_id, permission_id)
    VALUES
      (template_project_readonly, perm_projects_view),
      (template_project_readonly, perm_orders_view)
    ON CONFLICT (template_id, permission_id, resource_type) DO NOTHING;
  END IF;

  -- Template 5: Designer - Full Access
  INSERT INTO public.permission_templates (template_name, template_description, category, is_system_template, is_global)
  VALUES (
    'Designer - Full Access',
    'Complete design and project management permissions',
    'department',
    true,
    true
  ) ON CONFLICT (template_name) DO NOTHING
  RETURNING id INTO template_designer_full;

  IF template_designer_full IS NOT NULL THEN
    INSERT INTO public.permission_template_items (template_id, permission_id)
    VALUES
      (template_designer_full, perm_projects_view),
      (template_designer_full, perm_projects_create),
      (template_designer_full, perm_projects_edit),
      (template_designer_full, perm_projects_manage),
      (template_designer_full, perm_orders_view)
    ON CONFLICT (template_id, permission_id, resource_type) DO NOTHING;
  END IF;

END $$;

-- ============================================
-- Verification Queries
-- ============================================

-- Verify organization_members table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members') THEN
    RAISE NOTICE '✅ Table organization_members created successfully';
  ELSE
    RAISE EXCEPTION '❌ Table organization_members NOT created';
  END IF;
END $$;

-- Verify organization_permissions table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_permissions') THEN
    RAISE NOTICE '✅ Table organization_permissions created successfully';
  ELSE
    RAISE EXCEPTION '❌ Table organization_permissions NOT created';
  END IF;
END $$;

-- Verify permission_templates table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permission_templates') THEN
    RAISE NOTICE '✅ Table permission_templates created successfully';
  ELSE
    RAISE EXCEPTION '❌ Table permission_templates NOT created';
  END IF;
END $$;

-- Verify permission_template_items table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permission_template_items') THEN
    RAISE NOTICE '✅ Table permission_template_items created successfully';
  ELSE
    RAISE EXCEPTION '❌ Table permission_template_items NOT created';
  END IF;
END $$;

-- Verify indexes
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('organization_members', 'organization_permissions', 'permission_templates', 'permission_template_items');

  IF index_count >= 20 THEN
    RAISE NOTICE '✅ % indexes created successfully', index_count;
  ELSE
    RAISE WARNING '⚠️  Expected 20+ indexes, found %', index_count;
  END IF;
END $$;

-- Verify system templates seeded
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count
  FROM public.permission_templates
  WHERE is_system_template = true;

  IF template_count >= 5 THEN
    RAISE NOTICE '✅ % system templates seeded successfully', template_count;
  ELSE
    RAISE WARNING '⚠️  Expected 5+ system templates, found %', template_count;
  END IF;
END $$;

-- Show summary
SELECT
  'Phase 3 Migration Complete' AS status,
  COUNT(DISTINCT table_name) AS tables_created,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('organization_members', 'organization_permissions', 'permission_templates', 'permission_template_items')) AS indexes_created,
  (SELECT COUNT(*) FROM public.permission_templates WHERE is_system_template = true) AS system_templates
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('organization_members', 'organization_permissions', 'permission_templates', 'permission_template_items');
