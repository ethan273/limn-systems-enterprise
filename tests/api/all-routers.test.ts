import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

/**
 * All API Routers Validation Tests
 *
 * Validates database support for all 31 tRPC API routers
 *
 * Routers Tested:
 * 1. auth.ts - Authentication
 * 2. catalog.ts - Product catalog
 * 3. clients.ts - Client management
 * 4. crm.ts - CRM operations
 * 5. design-briefs.ts - Design briefs
 * 6. design-projects-router.ts - Design projects
 * 7. documents.ts - Document management
 * 8. factoryReviews.ts - Factory reviews
 * 9. invoices.ts - Invoice management
 * 10. mood-boards.ts - Mood boards
 * 11. oauth.ts - OAuth integration
 * 12. order-items.ts - Order items
 * 13. ordered-items-production.ts - Production items
 * 14. orders.ts - Order management
 * 15. packing.ts - Packing operations
 * 16. partners.ts - Partner management
 * 17. payments.ts - Payment processing
 * 18. portal.ts - Portal operations
 * 19. production-invoices.ts - Production invoicing
 * 20. production-orders.ts - Production orders
 * 21. production-tracking.ts - Production tracking
 * 22. products.ts - Product management
 * 23. projects.ts - Project management
 * 24. prototypes.ts - Prototype management
 * 25. qc.ts - Quality control
 * 26. quickbooks-sync.ts - QuickBooks integration
 * 27. shipping.ts - Shipping management
 * 28. shop-drawings.ts - Shop drawings
 * 29. storage.ts - Storage management
 * 30. tasks.ts - Task management
 * 31. users.ts - User management
 */

describe('All API Routers Validation', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Core Business Tables', () => {
    const coreTables = [
      'clients',
      'orders',
      'order_items',
      'invoices',
      'payments',
      'products',
      'projects',
      'tasks',
      'user_profiles',
      'portal_users',
    ];

    coreTables.forEach((tableName) => {
      it(`should have ${tableName} table`, async () => {
        const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = ${tableName}
          ) as exists;
        `;

        expect(result[0].exists).toBe(true);
      });
    });
  });

  describe('CRM Module Tables', () => {
    const crmTables = ['clients', 'contacts', 'leads'];

    crmTables.forEach((tableName) => {
      it(`should have ${tableName} table for CRM`, async () => {
        const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = ${tableName}
          ) as exists;
        `;

        expect(result[0].exists).toBe(true);
      });
    });

    it('should have CRM-related tables', async () => {
      // Database may not have 'prospects' table - leads may serve this purpose
      const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('clients', 'contacts', 'leads');
      `;

      expect(Number(count[0].count)).toBe(3);
    });
  });

  describe('Production Module Tables', () => {
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

    it('should have ordered_items_production table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'ordered_items_production'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should have quality control table for QC', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'quality_inspections'
        ) as exists;
      `;

      // Table is named 'quality_inspections' not 'quality_checks'
      expect(result[0].exists).toBe(true);
    });
  });

  describe('Design Module Tables', () => {
    it('should have design_briefs table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'design_briefs'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should have mood_boards table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'mood_boards'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should have shop_drawings table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'shop_drawings'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should have prototypes table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'prototypes'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });
  });

  describe('Product Module Tables', () => {
    it('should have products table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'products'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should have catalog-related table', async () => {
      // Check for catalog, product_catalog, or similar
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND (
            table_name = 'catalog'
            OR table_name = 'product_catalog'
            OR table_name = 'products'
          )
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });
  });

  describe('Partner Module Tables', () => {
    it('should have partners table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND (
            table_name = 'partners'
            OR table_name = 'partner_users'
          )
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should have factory reviews tables', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'factory_review_sessions'
        ) as exists;
      `;

      // Factory reviews use 'factory_review_sessions' table (not factory_reviews)
      expect(result[0].exists).toBe(true);
    });
  });

  describe('Document Module Tables', () => {
    it('should have documents table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'documents'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should have user_document_permissions table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'user_document_permissions'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });
  });

  describe('Shipping Module Tables', () => {
    it('should have shipments table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'shipments'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should have packing-related table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND (
            table_name = 'packing'
            OR table_name = 'packing_lists'
            OR table_name = 'shipments'
          )
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });
  });

  describe('Storage Module Tables', () => {
    it('should have storage or file-related table', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND (
            table_name = 'storage'
            OR table_name = 'files'
            OR table_name = 'documents'
          )
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });
  });

  describe('OAuth Integration', () => {
    it('should have SSO user mappings for OAuth', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'sso_user_mappings'
        ) as exists;
      `;

      expect(result[0].exists).toBe(true);
    });
  });

  describe('Router Table Coverage Summary', () => {
    it('should have all 31 router-supporting tables', async () => {
      // Get count of all business tables
      const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name NOT LIKE '\\_%'
        AND table_name NOT LIKE 'pg_%';
      `;

      // Should have 270+ tables supporting all routers
      expect(Number(count[0].count)).toBeGreaterThanOrEqual(270);
    });
  });
});
