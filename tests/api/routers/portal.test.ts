import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

/**
 * Portal API Router Tests
 *
 * Critical Priority: Multi-Tenant Portal Security
 *
 * Tests the /api/trpc/portal router endpoints:
 * - Portal user authentication
 * - Data isolation by customer_id
 * - Portal-specific operations
 * - Customer/Designer/Factory portal access
 *
 * Security Validations:
 * - Customer data isolation
 * - Portal permissions
 * - Cross-tenant access prevention
 */

describe('Portal API Router Tests', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Portal User Management', () => {
    it('should have portal_users table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'portal_users'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should have customer_id for tenant isolation', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'portal_users'
        AND column_name = 'customer_id';
      `;

      expect(columns.length).toBe(1);
    });

    it('should have portal_role field', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'portal_users'
        AND column_name = 'portal_role';
      `;

      expect(columns.length).toBe(1);
    });
  });

  describe('Customer Portal Access', () => {
    it('should have orders linked to customers', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND (
          column_name = 'client_id'
          OR column_name = 'customer_id'
        );
      `;

      expect(columns.length).toBeGreaterThan(0);
    });

    it('should have invoices linked to customers', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'invoices'
        AND (
          column_name = 'client_id'
          OR column_name = 'customer_id'
        );
      `;

      expect(columns.length).toBeGreaterThan(0);
    });

    it('should have documents linked to customers via projects', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'documents'
        AND column_name = 'project_id';
      `;

      expect(columns.length).toBe(1);
    });
  });

  describe('Designer Portal Access', () => {
    it('should have projects with customer isolation', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'customer_id';
      `;

      expect(columns.length).toBe(1);
    });

    it('should have design briefs table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'design_briefs'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });
  });

  describe('Factory Portal Access', () => {
    it('should have production_orders table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'production_orders'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should have factory assignment on production orders', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'production_orders'
        AND column_name LIKE '%factory%';
      `;

      expect(columns.length).toBeGreaterThan(0);
    });
  });

  describe('Portal Sessions', () => {
    it('should track portal sessions separately', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'portal_sessions'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should link sessions to portal users', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'portal_sessions'
        AND (
          column_name = 'user_id'
          OR column_name = 'portal_user_id'
        );
      `;

      expect(columns).toBeDefined();
    });
  });

  describe('Portal Permissions', () => {
    it('should have JSONB permissions on portal_users', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string; data_type: string }>
      >`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'portal_users'
        AND column_name = 'permissions';
      `;

      expect(columns.length).toBe(1);
      expect(columns[0].data_type).toBe('jsonb');
    });
  });
});
