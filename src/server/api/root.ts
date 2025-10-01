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

  // Shipping (SEKO Integration)
  shipping: shippingRouter,

  // QuickBooks Integration
  quickbooksSync: quickbooksSyncRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;