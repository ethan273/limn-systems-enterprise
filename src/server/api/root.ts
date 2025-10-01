import { createTRPCRouter } from './trpc/init';

// Import all routers
import { authRouter } from './routers/auth';
import { tasksRouter } from './routers/tasks';
import { usersRouter } from './routers/users';
import { crmRouter } from './routers/crm';
import { clientsRouter } from './routers/clients';
import { projectsRouter } from './routers/projects';
import { collectionsRouter, itemsRouter, materialsRouter } from './routers/catalog';
import { productsRouter } from './routers/products';
import { ordersRouter } from './routers/orders';
import { orderItemsRouter } from './routers/order-items';
import { productionOrdersRouter } from './routers/production-orders';
import { productionInvoicesRouter } from './routers/production-invoices';
import { productionTrackingRouter } from './routers/production-tracking';
import { shippingRouter } from './routers/shipping';
import { quickbooksSyncRouter } from './routers/quickbooks-sync';
import { partnersRouter } from './routers/partners';
import { portalRouter } from './routers/portal';
import { designBriefsRouter } from './routers/design-briefs';
import { designProjectsRouter } from './routers/design-projects-router';
import { moodBoardsRouter } from './routers/mood-boards';
import { oauthRouter } from './routers/oauth';
import { storageRouter } from './routers/storage';
import { shopDrawingsRouter } from './routers/shop-drawings';
import { prototypesRouter } from './routers/prototypes';
import { factoryReviewsRouter } from './routers/factoryReviews';
import { qcRouter } from './routers/qc';

/**
 * Main API router
 * All routers are combined here and exposed through tRPC
 */
export const appRouter = createTRPCRouter({
  // Authentication & Access Control
  auth: authRouter,

  // Task Management
  tasks: tasksRouter,

  // User Management
  users: usersRouter,

  // CRM & Sales
  crm: crmRouter,
  clients: clientsRouter, // Legacy support for existing clients router
  
  // Projects
  projects: projectsRouter,
  
  // Product Catalog
  collections: collectionsRouter,
  items: itemsRouter,
  materials: materialsRouter,
  products: productsRouter,

  // Orders
  orders: ordersRouter,
  orderItems: orderItemsRouter,

  // Production Orders (Phase 1)
  productionOrders: productionOrdersRouter,
  productionInvoices: productionInvoicesRouter,
  productionTracking: productionTrackingRouter,

  // Partners (Phase 2)
  partners: partnersRouter,

  // Design Module (Phase 2 - Week 13-15)
  designBriefs: designBriefsRouter,
  designProjects: designProjectsRouter,
  moodBoards: moodBoardsRouter,

  // OAuth & Storage (Phase 2 - Week 13-15 Day 7-9)
  oauth: oauthRouter,
  storage: storageRouter,

  // Shop Drawings (Phase 2 - Week 16)
  shopDrawings: shopDrawingsRouter,

  // Prototypes (Phase 2 - Week 17)
  prototypes: prototypesRouter,

  // Factory Reviews (Phase 2 - Week 18)
  factoryReviews: factoryReviewsRouter,

  // QC Mobile (Phase 2 - Week 19)
  qc: qcRouter,

  // Shipping (SEKO Integration)
  shipping: shippingRouter,

  // QuickBooks Integration
  quickbooksSync: quickbooksSyncRouter,

  // Customer Portal (Phase 3)
  portal: portalRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;