import { createTRPCRouter } from './trpc/init';

// Import all routers
import { authRouter } from './routers/auth';
import { tasksRouter } from './routers/tasks';
import { usersRouter } from './routers/users';
import { crmRouter, customersRouter, leadsRouter, contactsRouter } from './routers/crm';
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
import { designBoardsRouter } from './routers/designBoards';
import { oauthRouter } from './routers/oauth';
import { storageRouter } from './routers/storage';
import { shopDrawingsRouter } from './routers/shop-drawings';
import { prototypesRouter } from './routers/prototypes';
import { factoryReviewsRouter } from './routers/factoryReviews';
import { qcRouter } from './routers/qc';
import { qcPwaRouter } from './routers/qcPwa';
import { packingRouter } from './routers/packing';
import { orderedItemsProductionRouter } from './routers/ordered-items-production';
import { invoicesRouter } from './routers/invoices';
import { paymentsRouter } from './routers/payments';
import { expensesRouter } from './routers/expenses';
import { documentsRouter } from './routers/documents';
import { dashboardsRouter } from './routers/dashboards';
import { notificationsRouter } from './routers/notifications';
import { userProfileRouter } from './routers/user-profile';
import { profilesRouter } from './routers/profiles';
import { templatesRouter } from './routers/templates';
import { adminRouter } from './routers/admin';
import { auditRouter } from './routers/audit';
import { exportRouter } from './routers/export';
import { analyticsRouter } from './routers/analytics';
import { apiCredentialsRouter } from './routers/apiCredentials';
import { auditRouter as apiAuditRouter } from './routers/apiManagement/audit';
import { securityRouter as apiSecurityRouter } from './routers/apiManagement/security';
import { healthRouter as apiHealthRouter } from './routers/apiManagement/health';
import { rotationRouter as apiRotationRouter } from './routers/apiManagement/rotation';
import { jobsRouter as apiJobsRouter } from './routers/apiManagement/jobs';
import { flipbooksRouter } from './routers/flipbooks';
import { flipbookAnalyticsRouter } from './routers/flipbook-analytics';
import { globalSearchRouter } from './routers/global-search';
import { designersRouter } from './routers/designers';
import { materialCategoriesRouter } from './routers/material-categories';
import { materialCollectionsRouter } from './routers/material-collections';
import { conceptsRouter } from './routers/concepts';
import { permissionRequestsRouter } from './routers/permission-requests';
import { sessionTrackingRouter } from './routers/session-tracking';
import { emailTemplatesRouter } from './routers/emailTemplates';
import { emailCampaignsRouter } from './routers/emailCampaigns';
import { emailAnalyticsRouter } from './routers/emailAnalytics';
import { rbacRouter } from './routers/rbac';
import { sessionsRouter } from './routers/sessions';
import { permissionsAdvancedRouter } from './routers/permissions-advanced';
import { enterpriseRbacRouter } from './routers/enterprise-rbac';

/**
 * Main API router
 * All routers are combined here and exposed through tRPC
 */
export const appRouter = createTRPCRouter({
  // Global Search
  globalSearch: globalSearchRouter,

  // Dashboards & Analytics
  dashboards: dashboardsRouter,
  analytics: analyticsRouter,

  // Authentication & Access Control
  auth: authRouter,
  rbac: rbacRouter,
  sessions: sessionsRouter,
  sessionTracking: sessionTrackingRouter,
  permissionsAdvanced: permissionsAdvancedRouter,
  permissionRequests: permissionRequestsRouter,
  enterpriseRbac: enterpriseRbacRouter,

  // Admin Portal
  admin: adminRouter,
  audit: auditRouter,
  export: exportRouter,
  apiCredentials: apiCredentialsRouter,
  apiAudit: apiAuditRouter,
  apiSecurity: apiSecurityRouter,
  apiHealth: apiHealthRouter,
  apiRotation: apiRotationRouter,
  apiJobs: apiJobsRouter,

  // Notifications & User Profile
  notifications: notificationsRouter,
  userProfile: userProfileRouter,
  profiles: profilesRouter,

  // Task Management
  tasks: tasksRouter,

  // User Management
  users: usersRouter,

  // CRM & Sales
  crm: crmRouter,
  customers: customersRouter, // Direct access to customers router
  leads: leadsRouter, // Direct access to leads router
  contacts: contactsRouter, // Direct access to contacts router
  clients: clientsRouter, // Legacy support for existing clients router
  
  // Projects
  projects: projectsRouter,
  
  // Product Catalog
  collections: collectionsRouter,
  items: itemsRouter,
  materials: materialsRouter,
  materialCategories: materialCategoriesRouter,
  materialCollections: materialCollectionsRouter,
  products: productsRouter,
  templates: templatesRouter,

  // Orders
  orders: ordersRouter,
  orderItems: orderItemsRouter,

  // Production Orders (Phase 1)
  productionOrders: productionOrdersRouter,
  productionInvoices: productionInvoicesRouter,
  productionTracking: productionTrackingRouter,
  orderedItemsProduction: orderedItemsProductionRouter,

  // Partners (Phase 2)
  partners: partnersRouter,

  // Design Module (Phase 2 - Week 13-15)
  designBriefs: designBriefsRouter,
  designProjects: designProjectsRouter,
  moodBoards: moodBoardsRouter,
  designBoards: designBoardsRouter,
  designers: designersRouter,
  concepts: conceptsRouter,

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
  qcPwa: qcPwaRouter, // QC PWA Enhancement - Mobile-optimized endpoints

  // Packing Lists (Phase 2 - Week 20)
  packing: packingRouter,

  // Shipping (SEKO Integration)
  shipping: shippingRouter,

  // QuickBooks Integration
  quickbooksSync: quickbooksSyncRouter,

  // Financials (General Accounting)
  invoices: invoicesRouter,
  payments: paymentsRouter,
  expenses: expensesRouter,

  // Documents & Media (Phase 4)
  documents: documentsRouter,

  // Customer Portal (Phase 3)
  portal: portalRouter,

  // Flipbooks (Feature Flag Protected)
  flipbooks: flipbooksRouter,
  flipbookAnalytics: flipbookAnalyticsRouter,

  // Email Campaign System (Phase 5)
  emailTemplates: emailTemplatesRouter,
  emailCampaigns: emailCampaignsRouter,
  emailAnalytics: emailAnalyticsRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;