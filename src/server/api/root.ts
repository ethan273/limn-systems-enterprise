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
import { notificationPreferencesRouter } from './routers/notification-preferences';
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
import { apiCredentialRotationsRouter } from './routers/api-credential-rotations';
import { timeEntriesRouter } from './routers/time-entries';
import { permissionDelegationsRouter } from './routers/permission-delegations';
import { permissionDefinitionsRouter } from './routers/permission-definitions';
import { quickbooksConnectionsRouter } from './routers/quickbooks-connections';
import { organizationMembersRouter } from './routers/organization-members';
import { inventoryRouter } from './routers/inventory';
import { taskEntityLinksRouter } from './routers/task-entity-links';
import { taskAttachmentsRouter } from './routers/task-attachments';
import { permissionUsageLogRouter } from './routers/permission-usage-log';
import { activitiesRouter } from './routers/activities';
import { additionalSpecsRouter } from './routers/additional-specs';
import { addressesRouter } from './routers/addresses';
import { apiCredentialAuditLogsRouter } from './routers/api-credential-audit-logs';
import { automationLogsRouter } from './routers/automation-logs';
import { automationRulesRouter } from './routers/automation-rules';
import { boardActivityLogRouter } from './routers/board-activity-log';
import { boardCollaboratorsRouter } from './routers/board-collaborators';
import { boardCommentsRouter } from './routers/board-comments';
import { boardObjectsRouter } from './routers/board-objects';
import { boardSnapshotsRouter } from './routers/board-snapshots';
import { boardTemplatesRouter } from './routers/board-templates';
import { boardVotesRouter } from './routers/board-votes';
import { budgetsRouter } from './routers/budgets';
import { collectionActivitiesRouter } from './routers/collection-activities';
import { costTrackingRouter } from './routers/cost-tracking';
import { customerCommunicationPreferencesRouter } from './routers/customer-communication-preferences';
import { customerFinancialsRouter } from './routers/customer-financials';
import { customerPortalAccessRouter } from './routers/customer-portal-access';
import { customerPortalActivityRouter } from './routers/customer-portal-activity';
import { portalAccessAdminRouter } from './routers/portal-access-admin';
import { customerProductionNotificationsRouter } from './routers/customer-production-notifications';
import { designApprovalsRouter } from './routers/design-approvals';
import { designDeliverablesRouter } from './routers/design-deliverables';
import { designFilesRouter } from './routers/design-files';
import { designRevisionsRouter } from './routers/design-revisions';
import { designToPrototypeRouter } from './routers/design-to-prototype';
import { documentAccessLogRouter } from './routers/document-access-log';
import { documentApprovalWorkflowRouter } from './routers/document-approval-workflow';
import { documentApprovalsRouter } from './routers/document-approvals';
import { documentCategoriesRouter } from './routers/document-categories';
import { documentCommentsRouter } from './routers/document-comments';
import { documentFoldersRouter } from './routers/document-folders';
import { documentRevisionsRouter } from './routers/document-revisions';
import { emailUnsubscribesRouter } from './routers/email-unsubscribes';
import { flipbookConversionsRouter } from './routers/flipbook-conversions';
import { furnitureDimensionsRouter } from './routers/furniture-dimensions';
import { hotspotsRouter } from './routers/hotspots';
import { invoiceItemsRouter } from './routers/invoice-items';
import { manufacturerCommunicationsRouter } from './routers/manufacturer-communications';
import { messagingRouter } from './routers/messaging';
import { imageAnnotationsRouter } from './routers/image-annotations';
import { workflowsRouter } from './routers/workflows';
import { realtimeEventsRouter } from './routers/realtime-events';
import { workflowEngineRouter } from './routers/workflow-engine';
import { taskAutomationRouter } from './routers/task-automation';
import { workflowMonitoringRouter } from './routers/workflow-monitoring';
import { manufacturerContractsRouter } from './routers/manufacturer-contracts';
import { manufacturerPerformanceRouter } from './routers/manufacturer-performance';
import { manufacturerPricingRouter } from './routers/manufacturer-pricing';
import { manufacturerProjectsRouter } from './routers/manufacturer-projects';
import { manufacturerQcRecordsRouter } from './routers/manufacturer-qc-records';
import { manufacturersRouter } from './routers/manufacturers';
import { materialCollectionAuditRouter } from './routers/material-collection-audit';
import { materialFurnitureCollectionsRouter } from './routers/material-furniture-collections';
import { materialPriceHistoryRouter } from './routers/material-price-history';
import { orderItemMaterialsRouter } from './routers/order-item-materials';
import { organizationPermissionsRouter } from './routers/organization-permissions';
import { pandadocDocumentsRouter } from './routers/pandadoc-documents';
import { partnerPortalRolesRouter } from './routers/partner-portal-roles';
import { permissionConditionsRouter } from './routers/permission-conditions';
import { permissionScopesRouter } from './routers/permission-scopes';
import { permissionTemplateItemsRouter } from './routers/permission-template-items';
import { permissionTemplatesRouter } from './routers/permission-templates';
import { pickupRequestsRouter } from './routers/pickup-requests';
import { portalConfigurationsRouter } from './routers/portal-configurations';
import { productionBatchesRouter } from './routers/production-batches';
import { productionEventsRouter } from './routers/production-events';
import { productionInvoiceLineItemsRouter } from './routers/production-invoice-line-items';
import { productionItemsRouter } from './routers/production-items';
import { productionMilestonesRouter } from './routers/production-milestones';
import { productionPaymentsRouter } from './routers/production-payments';
import { productionProgressRouter } from './routers/production-progress';
import { productionStageHistoryRouter } from './routers/production-stage-history';
import { productionStagesRouter } from './routers/production-stages';
import { projectMaterialsRouter } from './routers/project-materials';
import { prototypeFeedbackRouter } from './routers/prototype-feedback';
import { prototypeProductionRouter } from './routers/prototype-production';
import { shopDrawingApprovalsRouter } from './routers/shop-drawing-approvals';
import { shopDrawingCommentsRouter } from './routers/shop-drawing-comments';
import { shopDrawingVersionsRouter } from './routers/shop-drawing-versions';
import { smsCampaignsRouter } from './routers/sms-campaigns';
import { smsDeliveryLogsRouter } from './routers/sms-delivery-logs';
import { smsInvitationsRouter } from './routers/sms-invitations';
import { smsLogsRouter } from './routers/sms-logs';
import { smsOptOutsRouter } from './routers/sms-opt-outs';
import { smsProvidersRouter } from './routers/sms-providers';
import { smsScheduledJobsRouter } from './routers/sms-scheduled-jobs';
import { smsTemplatesRouter } from './routers/sms-templates';
import { smsTrackingRouter } from './routers/sms-tracking';
import { smsUsageRouter } from './routers/sms-usage';
import { statusChangeLogRouter } from './routers/status-change-log';
import { taxRatesRouter } from './routers/tax-rates';
import { trackingMilestonesRouter } from './routers/tracking-milestones';
import { userDocumentPermissionsRouter } from './routers/user-document-permissions';
import { webhookDeliveriesRouter } from './routers/webhook-deliveries';
import { webhookEndpointsRouter } from './routers/webhook-endpoints';
import { workflowExecutionsRouter } from './routers/workflow-executions';
import { workflowStepsRouter } from './routers/workflow-steps';
import { workflowTemplatesRouter } from './routers/workflow-templates';

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
  enterpriseRbac: enterpriseRbacRouter,
  organizationPermissions: organizationPermissionsRouter,
  permissionConditions: permissionConditionsRouter,
  permissionDefinitions: permissionDefinitionsRouter,
  permissionDelegations: permissionDelegationsRouter,
  permissionRequests: permissionRequestsRouter,
  permissionScopes: permissionScopesRouter,
  permissionTemplateItems: permissionTemplateItemsRouter,
  permissionTemplates: permissionTemplatesRouter,
  permissionUsageLog: permissionUsageLogRouter,
  permissionsAdvanced: permissionsAdvancedRouter,
  rbac: rbacRouter,
  sessionTracking: sessionTrackingRouter,
  sessions: sessionsRouter,


  // Admin Portal
  activities: activitiesRouter,
  admin: adminRouter,
  apiCredentialAuditLogs: apiCredentialAuditLogsRouter,
  apiCredentialRotations: apiCredentialRotationsRouter,
  apiCredentials: apiCredentialsRouter,
  apiAudit: apiAuditRouter,
  apiHealth: apiHealthRouter,
  apiJobs: apiJobsRouter,
  apiRotation: apiRotationRouter,
  apiSecurity: apiSecurityRouter,
  audit: auditRouter,
  export: exportRouter,
  statusChangeLog: statusChangeLogRouter,

  // Notifications & User Profile
  notifications: notificationsRouter,
  notificationPreferences: notificationPreferencesRouter,
  userProfile: userProfileRouter,
  profiles: profilesRouter,

  // Messaging & Communications
  messaging: messagingRouter,
  imageAnnotations: imageAnnotationsRouter,
  workflows: workflowsRouter,
  realtimeEvents: realtimeEventsRouter,
  workflowEngine: workflowEngineRouter,
  taskAutomation: taskAutomationRouter,
  workflowMonitoring: workflowMonitoringRouter,

  // Task Management
  tasks: tasksRouter,
  timeEntries: timeEntriesRouter,
  taskEntityLinks: taskEntityLinksRouter,
  taskAttachments: taskAttachmentsRouter,

  // User Management
  users: usersRouter,
  organizationMembers: organizationMembersRouter,

  // CRM & Sales
  addresses: addressesRouter,
  clients: clientsRouter, // Legacy support for existing clients router
  contacts: contactsRouter, // Direct access to contacts router
  crm: crmRouter,
  customerCommunicationPreferences: customerCommunicationPreferencesRouter,
  customerFinancials: customerFinancialsRouter,
  customers: customersRouter, // Direct access to customers router
  leads: leadsRouter, // Direct access to leads router
  taxRates: taxRatesRouter,
  
  // Projects
  budgets: budgetsRouter,
  costTracking: costTrackingRouter,
  projectMaterials: projectMaterialsRouter,
  projects: projectsRouter,

  // Product Catalog
  additionalSpecs: additionalSpecsRouter,
  collectionActivities: collectionActivitiesRouter,
  collections: collectionsRouter,
  furnitureDimensions: furnitureDimensionsRouter,
  inventory: inventoryRouter,
  items: itemsRouter,
  materialCategories: materialCategoriesRouter,
  materialCollectionAudit: materialCollectionAuditRouter,
  materialCollections: materialCollectionsRouter,
  materialFurnitureCollections: materialFurnitureCollectionsRouter,
  materialPriceHistory: materialPriceHistoryRouter,
  materials: materialsRouter,
  products: productsRouter,
  templates: templatesRouter,

  // Orders
  orderItemMaterials: orderItemMaterialsRouter,
  orderItems: orderItemsRouter,
  orders: ordersRouter,

  // Production Orders (Phase 1)
  customerProductionNotifications: customerProductionNotificationsRouter,
  orderedItemsProduction: orderedItemsProductionRouter,
  productionBatches: productionBatchesRouter,
  productionEvents: productionEventsRouter,
  productionInvoiceLineItems: productionInvoiceLineItemsRouter,
  productionInvoices: productionInvoicesRouter,
  productionItems: productionItemsRouter,
  productionMilestones: productionMilestonesRouter,
  productionOrders: productionOrdersRouter,
  productionPayments: productionPaymentsRouter,
  productionProgress: productionProgressRouter,
  productionStageHistory: productionStageHistoryRouter,
  productionStages: productionStagesRouter,
  productionTracking: productionTrackingRouter,
  trackingMilestones: trackingMilestonesRouter,

  // Partners (Phase 2)
  partnerPortalRoles: partnerPortalRolesRouter,
  partners: partnersRouter,

  // Manufacturer Management
  manufacturerCommunications: manufacturerCommunicationsRouter,
  manufacturerContracts: manufacturerContractsRouter,
  manufacturerPerformance: manufacturerPerformanceRouter,
  manufacturerPricing: manufacturerPricingRouter,
  manufacturerProjects: manufacturerProjectsRouter,
  manufacturerQcRecords: manufacturerQcRecordsRouter,
  manufacturers: manufacturersRouter,

  // Design Module (Phase 2 - Week 13-15)
  boardActivityLog: boardActivityLogRouter,
  boardCollaborators: boardCollaboratorsRouter,
  boardComments: boardCommentsRouter,
  boardObjects: boardObjectsRouter,
  boardSnapshots: boardSnapshotsRouter,
  boardTemplates: boardTemplatesRouter,
  boardVotes: boardVotesRouter,
  concepts: conceptsRouter,
  designApprovals: designApprovalsRouter,
  designBoards: designBoardsRouter,
  designBriefs: designBriefsRouter,
  designDeliverables: designDeliverablesRouter,
  designFiles: designFilesRouter,
  designProjects: designProjectsRouter,
  designRevisions: designRevisionsRouter,
  designToPrototype: designToPrototypeRouter,
  designers: designersRouter,
  moodBoards: moodBoardsRouter,

  // OAuth & Storage (Phase 2 - Week 13-15 Day 7-9)
  oauth: oauthRouter,
  storage: storageRouter,

  // Shop Drawings (Phase 2 - Week 16)
  shopDrawingApprovals: shopDrawingApprovalsRouter,
  shopDrawingComments: shopDrawingCommentsRouter,
  shopDrawingVersions: shopDrawingVersionsRouter,
  shopDrawings: shopDrawingsRouter,

  // Prototypes (Phase 2 - Week 17)
  prototypeFeedback: prototypeFeedbackRouter,
  prototypeProduction: prototypeProductionRouter,
  prototypes: prototypesRouter,

  // Factory Reviews (Phase 2 - Week 18)
  factoryReviews: factoryReviewsRouter,

  // QC Mobile (Phase 2 - Week 19)
  qc: qcRouter,
  qcPwa: qcPwaRouter, // QC PWA Enhancement - Mobile-optimized endpoints

  // Packing Lists (Phase 2 - Week 20)
  packing: packingRouter,

  // Shipping (SEKO Integration)
  pickupRequests: pickupRequestsRouter,
  shipping: shippingRouter,

  // QuickBooks Integration
  quickbooksSync: quickbooksSyncRouter,
  quickbooksConnections: quickbooksConnectionsRouter,

  // Financials (General Accounting)
  expenses: expensesRouter,
  invoiceItems: invoiceItemsRouter,
  invoices: invoicesRouter,
  pandadocDocuments: pandadocDocumentsRouter,
  payments: paymentsRouter,

  // Documents & Media (Phase 4)
  documentAccessLog: documentAccessLogRouter,
  documentApprovalWorkflow: documentApprovalWorkflowRouter,
  documentApprovals: documentApprovalsRouter,
  documentCategories: documentCategoriesRouter,
  documentComments: documentCommentsRouter,
  documentFolders: documentFoldersRouter,
  documentRevisions: documentRevisionsRouter,
  documents: documentsRouter,
  userDocumentPermissions: userDocumentPermissionsRouter,

  // Customer Portal (Phase 3)
  customerPortalAccess: customerPortalAccessRouter,
  customerPortalActivity: customerPortalActivityRouter,
  portal: portalRouter,
  portalAccessAdmin: portalAccessAdminRouter,
  portalConfigurations: portalConfigurationsRouter,

  // Flipbooks (Feature Flag Protected)
  flipbookAnalytics: flipbookAnalyticsRouter,
  flipbookConversions: flipbookConversionsRouter,
  flipbooks: flipbooksRouter,
  hotspots: hotspotsRouter,

  // Email Campaign System (Phase 5)
  emailAnalytics: emailAnalyticsRouter,
  emailCampaigns: emailCampaignsRouter,
  emailTemplates: emailTemplatesRouter,
  emailUnsubscribes: emailUnsubscribesRouter,

  // SMS System
  smsCampaigns: smsCampaignsRouter,
  smsDeliveryLogs: smsDeliveryLogsRouter,
  smsInvitations: smsInvitationsRouter,
  smsLogs: smsLogsRouter,
  smsOptOuts: smsOptOutsRouter,
  smsProviders: smsProvidersRouter,
  smsScheduledJobs: smsScheduledJobsRouter,
  smsTemplates: smsTemplatesRouter,
  smsTracking: smsTrackingRouter,
  smsUsage: smsUsageRouter,

  // Workflow Automation
  automationLogs: automationLogsRouter,
  automationRules: automationRulesRouter,
  webhookDeliveries: webhookDeliveriesRouter,
  webhookEndpoints: webhookEndpointsRouter,
  workflowExecutions: workflowExecutionsRouter,
  workflowSteps: workflowStepsRouter,
  workflowTemplates: workflowTemplatesRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;