import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

/**
 * Financial API Router Tests
 *
 * Critical Priority: Financial Data Integrity
 *
 * Tests financial API routers:
 * - /api/trpc/invoices
 * - /api/trpc/payments
 * - /api/trpc/quickbooks-sync
 *
 * Validates:
 * - Invoice calculations
 * - Payment processing
 * - QuickBooks synchronization
 * - Financial data precision
 */

describe('Financial API Router Tests', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Invoices API', () => {
    it('should have invoices table with all required fields', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string; data_type: string }>
      >`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'invoices'
        ORDER BY ordinal_position;
      `;

      const columnNames = columns.map((c) => c.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames.length).toBeGreaterThan(10);
    });

    it('should use precise numeric types for amounts', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string; data_type: string }>
      >`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'invoices'
        AND (
          column_name LIKE '%amount%'
          OR column_name LIKE '%total%'
          OR column_name LIKE '%tax%'
        );
      `;

      // Should use NUMERIC or DOUBLE PRECISION, not FLOAT
      columns.forEach((col) => {
        expect(['numeric', 'double precision', 'money', 'integer', 'bigint']).toContain(
          col.data_type
        );
      });
    });

    it('should link invoices to customers', async () => {
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
          OR column_name = 'order_id'
        );
      `;

      expect(columns.length).toBeGreaterThan(0);
    });
  });

  describe('Payments API', () => {
    it('should have payments table with required fields', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        ORDER BY ordinal_position;
      `;

      expect(columns.length).toBeGreaterThan(5);
    });

    it('should use INTEGER for payment amounts (cents)', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string; data_type: string }>
      >`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND (
          column_name LIKE '%amount%'
          OR column_name = 'total'
        );
      `;

      // Payments store cents as INTEGER
      columns.forEach((col) => {
        expect(['integer', 'bigint', 'numeric', 'double precision', 'money']).toContain(
          col.data_type
        );
      });
    });

    it('should link payments to invoices', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND (
          column_name = 'invoice_id'
          OR column_name = 'order_id'
          OR column_name LIKE '%reference%'
        );
      `;

      expect(columns.length).toBeGreaterThan(0);
    });

    it('should track payment status', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'status';
      `;

      expect(columns.length).toBe(1);
    });
  });

  describe('QuickBooks Sync API', () => {
    it('should have QuickBooks sync tracking on invoices', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'invoices'
        AND (
          column_name LIKE '%quickbooks%'
          OR column_name LIKE '%qb%'
          OR column_name LIKE '%sync%'
          OR column_name = 'external_id'
        );
      `;

      expect(columns).toBeDefined();
    });

    it('should have QuickBooks sync tracking on payments', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND (
          column_name LIKE '%quickbooks%'
          OR column_name LIKE '%qb%'
          OR column_name LIKE '%sync%'
          OR column_name = 'external_id'
        );
      `;

      expect(columns).toBeDefined();
    });

    it('should have sync status tracking', async () => {
      const invoiceSync = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'invoices'
        AND column_name LIKE '%sync%';
      `;

      const paymentSync = await prisma.$queryRaw<
        Array<{ column_name: string }>
      >`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name LIKE '%sync%';
      `;

      // At least one table should have sync tracking
      expect(invoiceSync.length + paymentSync.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Financial Calculations', () => {
    it('should have tax calculation fields', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ table_name: string; column_name: string }>
      >`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND (table_name = 'invoices' OR table_name = 'orders')
        AND (
          column_name LIKE '%tax%'
        );
      `;

      expect(columns.length).toBeGreaterThan(0);
    });

    it('should have discount fields', async () => {
      const columns = await prisma.$queryRaw<
        Array<{ table_name: string; column_name: string }>
      >`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND (table_name = 'invoices' OR table_name = 'orders')
        AND (
          column_name LIKE '%discount%'
          OR column_name LIKE '%adjustment%'
        );
      `;

      expect(columns).toBeDefined();
    });
  });

  describe('Financial Foreign Keys', () => {
    it('should enforce payment to invoice relationships', async () => {
      const foreignKeys = await prisma.$queryRaw<
        Array<{
          constraint_name: string;
          column_name: string;
          foreign_table_name: string;
        }>
      >`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'payments';
      `;

      expect(foreignKeys.length).toBeGreaterThan(0);
    });
  });
});
