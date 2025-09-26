import { createTRPCRouter } from './trpc/init';

// Import all routers
import { authRouter } from './routers/auth';
import { tasksRouter } from './routers/tasks';
import { usersRouter } from './routers/users';
import { crmRouter } from './routers/crm';
import { clientsRouter } from './routers/clients';
import { projectsRouter } from './routers/projects';
import { collectionsRouter, itemsRouter, materialsRouter } from './routers/catalog';
import { ordersRouter } from './routers/orders';

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
  
  // Orders
  orders: ordersRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;