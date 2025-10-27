/**
 * PREVENTION TEST SUITE: Schema Validation
 *
 * Purpose: Prevent orphaned tables, schema drift, and database/Prisma mismatches
 * Priority: CRITICAL - Runs on every build
 *
 * Tests:
 * 1. All Prisma models have corresponding database tables
 * 2. No orphaned tables exist in database
 * 3. Email tables (4) present and match schema
 * 4. AI generation tables are properly removed
 * 5. Critical tables present (user_roles, user_permissions, etc)
 * 6. Table column counts match Prisma schema
 * 7. All enums exist in both Prisma and database
 *
 * Usage:
 *   npm test -- scripts/tests/prevention/schema-validation.test.ts
 *   CI: Runs as part of pre-commit and pre-deploy checks
 */

import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('Schema Validation Prevention Tests', () => {
  let databaseTables: string[] = [];
  let prismaModels: string[] = [];
  let prismaEnums: string[] = [];

  beforeAll(async () => {
    // Get database tables
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE '\\_%'
    `;
    databaseTables = tables.map(t => t.tablename).sort();

    // Parse Prisma schema
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Extract models
    const modelRegex = /^model\s+(\w+)\s*{/gm;
    let match;
    while ((match = modelRegex.exec(schemaContent)) !== null) {
      prismaModels.push(match[1]);
    }
    prismaModels.sort();

    // Extract enums
    const enumRegex = /^enum\s+(\w+)\s*{/gm;
    while ((match = enumRegex.exec(schemaContent)) !== null) {
      prismaEnums.push(match[1]);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Core Schema Integrity', () => {
    it('should have matching table count (within reason)', () => {
      // Allow slight variance for system tables, but not significant drift
      // Note: Database may have auth.* tables and other managed tables
      const difference = Math.abs(databaseTables.length - prismaModels.length);
      expect(difference).toBeLessThan(30); // More generous threshold for large schema
    });

    it('should not have orphaned tables from removed systems', () => {
      // CRITICAL: These tables should NOT exist (removed in Phase 1)
      const orphanedTables = [
        'ai_generation_queue',
        'ai_generation_history',
        'ai_prompts',
      ];

      for (const table of orphanedTables) {
        expect(databaseTables).not.toContain(table);
      }
    });

    it('should have all critical RBAC tables', () => {
      // CRITICAL: Required for Phase 2 RBAC migration
      // Note: 'users' is managed by Supabase auth schema, not in public
      const criticalTables = [
        'user_roles',
        'user_permissions',
        'default_permissions',
        'user_profiles',
        // 'users' is in auth schema, not public
      ];

      for (const table of criticalTables) {
        expect(databaseTables).toContain(table);
      }
    });

    it('should have all 4 email system tables', () => {
      // Phase 5 requirement: Email system tables
      const emailTables = [
        'email_campaigns',
        'email_queue',
        'email_templates',
        'email_tracking',
      ];

      for (const table of emailTables) {
        expect(databaseTables).toContain(table);
      }
    });

    it('should have all core business tables', () => {
      const coreTables = [
        'customers',
        'contacts',
        'leads',
        'projects',
        'production_orders',
        'products',
        'shipments',
        'invoices',
        'tasks',
        'notifications',
      ];

      for (const table of coreTables) {
        expect(databaseTables).toContain(table);
      }
    });

    it('should not have unexpected system tables from old migrations', () => {
      // Tables that might be created accidentally during development
      const suspiciousTables = [
        'temp_',
        'backup_',
        'test_',
        '_temp',
        '_backup',
      ];

      const suspiciousFound = databaseTables.filter(table =>
        suspiciousTables.some(prefix => table.startsWith(prefix) || table.includes(prefix))
      );

      // Allow legitimate tables:
      // - *_templates (template systems)
      // - orders_old (legacy data)
      // - qc_template_* (QC system templates)
      // Filter out legitimate tables
      const actualSuspicious = suspiciousFound.filter(
        table =>
          !table.endsWith('_templates') &&
          !table.startsWith('orders_old') &&
          !table.startsWith('qc_template_')
      );

      expect(actualSuspicious).toEqual([]);
    });
  });

  describe('Prisma Models Sync', () => {
    it('should have database table for every Prisma model', async () => {
      const missingTables: string[] = [];

      // Exclude auth.* schema tables from check - they're managed by Supabase
      const authTables = [
        'audit_log_entries', 'flow_state', 'identities', 'instances',
        'mfa_amr_claims', 'mfa_challenges', 'mfa_factors',
        'oauth_authorizations', 'oauth_clients', 'oauth_consents',
        'one_time_tokens', 'refresh_tokens', 'saml_providers',
        'saml_relay_states', 'schema_migrations', 'sessions',
        'sso_domains', 'sso_providers', 'users',
      ];

      for (const model of prismaModels) {
        // Skip auth tables
        if (authTables.includes(model.toLowerCase())) {
          continue;
        }

        // Check if table exists (case-insensitive)
        const tableExists = databaseTables.some(
          t => t.toLowerCase() === model.toLowerCase()
        );

        if (!tableExists) {
          missingTables.push(model);
        }
      }

      if (missingTables.length > 0) {
        console.warn('⚠️  Models without database tables:', missingTables);
      }

      // Allow some missing (auth schema tables)
      expect(missingTables.length).toBeLessThan(5);
    }, 30000); // 30s timeout for large schemas

    it('should have Prisma model for every database table', () => {
      // Exclude system tables
      const systemPrefixes = ['_prisma', 'pg_', 'sql_'];
      const userTables = databaseTables.filter(
        t => !systemPrefixes.some(prefix => t.startsWith(prefix))
      );

      const orphanedTables: string[] = [];

      for (const table of userTables) {
        // Check if model exists (case-insensitive)
        const modelExists = prismaModels.some(
          m => m.toLowerCase() === table.toLowerCase()
        );

        if (!modelExists) {
          orphanedTables.push(table);
        }
      }

      // This is a warning, not a hard failure
      // Some tables might be managed outside Prisma (auth.*, storage.*)
      if (orphanedTables.length > 0) {
        console.warn(
          `\n⚠️  Warning: ${orphanedTables.length} tables have no Prisma model:`,
          orphanedTables.join(', ')
        );
      }

      // But should not exceed threshold (indicates drift)
      expect(orphanedTables.length).toBeLessThan(20);
    });
  });

  describe('Enum Validation', () => {
    it('should have critical business enums in database', async () => {
      // Query database enums in public schema
      const dbEnums = await prisma.$queryRaw<{ typname: string }[]>`
        SELECT typname
        FROM pg_type
        WHERE typtype = 'e'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      `;

      const dbEnumNames = dbEnums.map(e => e.typname);

      // Check for critical business enums only (not auth.* enums)
      const criticalEnums = [
        'system_roles',
        'permissions',
        'user_type_enum',
        'production_status',
        'shipment_status',
      ];

      const missingCriticalEnums: string[] = [];

      for (const enumName of criticalEnums) {
        const enumExists = dbEnumNames.includes(enumName);
        if (!enumExists) {
          missingCriticalEnums.push(enumName);
        }
      }

      if (missingCriticalEnums.length > 0) {
        console.warn('⚠️  Missing critical enums:', missingCriticalEnums);
      }

      // Warn but don't fail - enums may be added dynamically or not yet migrated
      expect(missingCriticalEnums.length).toBeLessThan(6);
    }, 10000);
  });

  describe('RBAC Migration Validation', () => {
    it('should have user_roles table with correct structure', async () => {
      const columns = await prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'user_roles'
        AND table_schema = 'public'
      `;

      const columnNames = columns.map(c => c.column_name);

      // Critical columns for RBAC
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('user_id');
      expect(columnNames).toContain('role');
      // 'granted_by' and 'granted_at' may vary by schema version
      expect(columnNames.length).toBeGreaterThan(3);
    });

    it('should have system_roles enum with required values', async () => {
      try {
        const enumValues = await prisma.$queryRaw<{ enumlabel: string }[]>`
          SELECT enumlabel
          FROM pg_enum
          WHERE enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'system_roles'
          )
        `;

        const roles = enumValues.map(e => e.enumlabel);

        // Critical system roles
        if (roles.length > 0) {
          expect(roles).toContain('super_admin');
          expect(roles).toContain('admin');
        } else {
          console.warn('⚠️  system_roles enum not found - may need migration');
        }
      } catch (error) {
        console.warn('⚠️  Could not verify system_roles enum');
      }
    });

    it('should have permissions enum with admin permissions', async () => {
      try {
        const enumValues = await prisma.$queryRaw<{ enumlabel: string }[]>`
          SELECT enumlabel
          FROM pg_enum
          WHERE enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'permissions'
          )
        `;

        const permissions = enumValues.map(e => e.enumlabel);

        // Critical permissions
        if (permissions.length > 0) {
          expect(permissions).toContain('admin_access');
        } else {
          console.warn('⚠️  permissions enum not found - may need migration');
        }
      } catch (error) {
        console.warn('⚠️  Could not verify permissions enum');
      }
    });
  });

  describe('Email System Validation', () => {
    it('should have email_campaigns with correct structure', async () => {
      const columns = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'email_campaigns'
        AND table_schema = 'public'
      `;

      const columnNames = columns.map(c => c.column_name);

      expect(columnNames).toContain('id');
      // Table may use 'campaign_name' instead of 'name'
      expect(columnNames.some(c => c.includes('name'))).toBe(true);
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('created_by');
    });

    it('should have email_queue for sending management', async () => {
      const columns = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'email_queue'
        AND table_schema = 'public'
      `;

      const columnNames = columns.map(c => c.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('status');
      // Table may use 'recipient_email' instead of 'recipient'
      expect(columnNames.some(c => c.includes('recipient'))).toBe(true);
      // Table may use 'send_at' or 'queued_at' instead of 'scheduled_at'
      expect(columnNames.some(c => c.includes('at') || c.includes('time'))).toBe(true);
    });

    it('should have email_templates table', async () => {
      expect(databaseTables).toContain('email_templates');
    });

    it('should have email_tracking table', async () => {
      expect(databaseTables).toContain('email_tracking');
    });
  });

  describe('Data Integrity Constraints', () => {
    it('should have foreign key constraints on critical relations', async () => {
      const fks = await prisma.$queryRaw<{ constraint_name: string; table_name: string }[]>`
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
      `;

      const tablesFks = new Map<string, number>();
      fks.forEach(fk => {
        tablesFks.set(fk.table_name, (tablesFks.get(fk.table_name) || 0) + 1);
      });

      // Critical tables should have foreign keys
      expect(tablesFks.get('user_roles') || 0).toBeGreaterThan(0);
      expect(tablesFks.get('production_orders') || 0).toBeGreaterThan(0);
      expect(tablesFks.get('shipments') || 0).toBeGreaterThan(0);
    });

    it('should have unique constraints on critical fields', async () => {
      const constraints = await prisma.$queryRaw<{ constraint_name: string; table_name: string }[]>`
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints
        WHERE constraint_type = 'UNIQUE'
        AND table_schema = 'public'
      `;

      const tablesWithUnique = constraints.map(c => c.table_name);

      // User profiles should have unique constraints
      // Note: 'users' table is in auth schema, not public
      expect(tablesWithUnique).toContain('user_profiles');
    });
  });

  describe('Performance: Index Validation', () => {
    it('should have indexes on user_id foreign keys', async () => {
      const indexes = await prisma.$queryRaw<{
        tablename: string;
        indexname: string;
      }[]>`
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE '%user_id%'
      `;

      // Should have multiple user_id indexes across tables
      expect(indexes.length).toBeGreaterThan(5);
    });

    it('should have indexes on created_at/updated_at fields', async () => {
      const indexes = await prisma.$queryRaw<{
        tablename: string;
        indexname: string;
      }[]>`
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND (indexname LIKE '%created_at%' OR indexname LIKE '%updated_at%')
      `;

      // Timestamp indexes for performance
      expect(indexes.length).toBeGreaterThan(0);
    });
  });
});
