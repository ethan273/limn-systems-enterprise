# ❌ Schema Validation Report

**Date:** 2025-10-09T23:01:27.861Z
**Status:** 579 violations found

---

## 📊 Summary

| Violation Type | Count |
|----------------|-------|
| Invalid Tables | 568 |
| Invalid Columns | 9 |
| Invalid Enum Values | 2 |
| Invalid Relations | 0 |
| **Total** | **579** |

---

## 🔴 Violations by Type

### Invalid Table References (568)

**src/__tests__/server/api/data-isolation.test.ts:10**
- ❌ Table `accessing` does not exist
- Code: `it('should prevent customers from accessing other customer data', async () => {`

**src/app/admin/dashboard/page.tsx:34**
- ❌ Table `approvals` does not exist
- Code: `const pendingApprovals = 0; // Can be fetched from approvals endpoint if needed`

**src/app/admin/integrations/quickbooks/page.tsx:80**
- ❌ Table `QuickBooks` does not exist
- Code: `if (!confirm('Are you sure you want to disconnect from QuickBooks?')) {`

**src/app/admin/integrations/quickbooks/page.tsx:93**
- ❌ Table `QuickBooks` does not exist
- Code: `throw new Error('Failed to disconnect from QuickBooks');`

**src/app/admin/roles/page.tsx:125**
- ❌ Table `this` does not exist
- 💡 Did you mean 'items'?
- Code: `if (confirm(`Are you sure you want to remove the ${role} role from this user?`)) {`

**src/app/api/auth/dev-login/route.ts:15**
- ❌ Table `request` does not exist
- Code: `// Get user type from request body (default to 'dev')`

**src/app/api/auth/google/callback/route.ts:4**
- ❌ Table `Google` does not exist
- Code: `* Handles the OAuth redirect from Google after user grants permission.`

**src/app/api/auth/google/callback/route.ts:15**
- ❌ Table `OAuth` does not exist
- Code: `// Get query parameters from OAuth redirect`

**src/app/api/auth/google/callback/route.ts:51**
- ❌ Table `Google` does not exist
- Code: `// Get user info from Google`

**src/app/api/auth/logout/route.ts:40**
- ❌ Table `Supabase` does not exist
- Code: `// Sign out from Supabase`

**src/app/api/auth/portal-test-login/route.ts:56**
- ❌ Table `the` does not exist
- Code: `// Extract the token from the magic link`

**src/app/api/auth/refresh.ts:31**
- ❌ Table `auth_sessions` does not exist
- Code: `.from('auth_sessions')      .select('*')`

**src/app/api/auth/refresh.ts:60**
- ❌ Table `auth_sessions` does not exist
- Code: `.from('auth_sessions')`

**src/app/api/auth/signin.ts:59**
- ❌ Table `magic_links` does not exist
- Code: `.from('magic_links')`

**src/app/api/auth/signin.ts:80**
- ❌ Table `magic_links` does not exist
- Code: `.from('magic_links')`

**src/app/api/auth/signin.ts:145**
- ❌ Table `auth_sessions` does not exist
- Code: `.from('auth_sessions')`

**src/app/api/auth/signin.ts:169**
- ❌ Table `auth_audit_logs` does not exist
- Code: `await supabase.from('auth_audit_logs').insert({`

**src/app/api/invoices/[id]/pdf/route.tsx:71**
- ❌ Table `line` does not exist
- Code: `// Calculate totals from line items`

**src/app/api/invoices/[id]/pdf/route.tsx:92**
- ❌ Table `settings` does not exist
- Code: `// Company info (hardcoded - should come from settings)`

**src/app/api/push/subscribe/route.ts:7**
- ❌ Table `Supabase` does not exist
- Code: `// Get user session from Supabase`

**src/app/api/push/subscribe/route.ts:24**
- ❌ Table `pushSubscription` does not exist
- 💡 Did you mean 'push_subscriptions'?
- Code: `await prisma.pushSubscription.upsert({`

**src/app/api/push/unsubscribe/route.ts:7**
- ❌ Table `Supabase` does not exist
- Code: `// Get user session from Supabase`

**src/app/api/push/unsubscribe/route.ts:22**
- ❌ Table `database` does not exist
- Code: `// Remove push subscription from database using Prisma`

**src/app/api/push/unsubscribe/route.ts:24**
- ❌ Table `pushSubscription` does not exist
- 💡 Did you mean 'push_subscriptions'?
- Code: `await prisma.pushSubscription.deleteMany({`

**src/app/api/quickbooks/callback/route.ts:8**
- ❌ Table `QuickBooks` does not exist
- Code: `* Handles the OAuth 2.0 callback from QuickBooks.`

**src/app/api/quickbooks/callback/route.ts:14**
- ❌ Table `QuickBooks` does not exist
- Code: `* - code: Authorization code from QuickBooks`

**src/app/api/quickbooks/callback/route.ts:100**
- ❌ Table `QuickBooks` does not exist
- Code: `// Get company info from QuickBooks`

**src/app/api/quickbooks/webhook/route.ts:9**
- ❌ Table `QuickBooks` does not exist
- Code: `* Receives webhook notifications from QuickBooks Online when entities are created/updated/deleted.`

**src/app/api/quickbooks/webhook/route.ts:54**
- ❌ Table `QuickBooks` does not exist
- Code: `* Process Invoice entity update from QuickBooks`

**src/app/api/quickbooks/webhook/route.ts:89**
- ❌ Table `QuickBooks` does not exist
- Code: `// Fetch updated invoice from QuickBooks`

**src/app/api/quickbooks/webhook/route.ts:113**
- ❌ Table `QuickBooks` does not exist
- Code: `console.log(`[QuickBooks Webhook] Invoice ${mapping.limn_id} synced from QuickBooks`);`

**src/app/api/quickbooks/webhook/route.ts:121**
- ❌ Table `QuickBooks` does not exist
- Code: `* Process Payment entity update from QuickBooks`

**src/app/api/quickbooks/webhook/route.ts:156**
- ❌ Table `QuickBooks` does not exist
- Code: `// Fetch updated payment from QuickBooks`

**src/app/api/quickbooks/webhook/route.ts:170**
- ❌ Table `QuickBooks` does not exist
- Code: `console.log(`[QuickBooks Webhook] Payment ${mapping.limn_id} synced from QuickBooks`);`

**src/app/api/quickbooks/webhook/route.ts:178**
- ❌ Table `QuickBooks` does not exist
- Code: `* Process Customer entity update from QuickBooks`

**src/app/api/quickbooks/webhook/route.ts:213**
- ❌ Table `QuickBooks` does not exist
- Code: `// Fetch updated customer from QuickBooks`

**src/app/api/quickbooks/webhook/route.ts:229**
- ❌ Table `QuickBooks` does not exist
- Code: `console.log(`[QuickBooks Webhook] Customer ${mapping.limn_id} synced from QuickBooks`);`

**src/app/auth/callback/route.ts:20**
- ❌ Table `dev` does not exist
- 💡 Did you mean 'deals'?
- Code: `// Handle magic link token (from dev login or email magic links)`

**src/app/auth/callback/route.ts:73**
- ❌ Table `Supabase` does not exist
- Code: `// Create redirect response with all cookies from Supabase`

**src/app/auth/callback/route.ts:139**
- ❌ Table `using` does not exist
- 💡 Did you mean 'users'?
- Code: `// Prevent employees from using customer portal`

**src/app/auth/callback/route.ts:155**
- ❌ Table `Supabase` does not exist
- Code: `// Create redirect response with all cookies from Supabase`

**src/app/auth/employee/page-client.tsx:33**
- ❌ Table `URL` does not exist
- 💡 Did you mean 'users'?
- Code: `console.error('OAuth error from URL:', { oauthError, errorDetails })`

**src/app/auth/employee/page-client.tsx:50**
- ❌ Table `limn` does not exist
- Code: `// Check if user email is from limn.us.com domain`

**src/app/crm/contacts/page.tsx:113**
- ❌ Table `selected` does not exist
- Code: `// Form fields for edit dialog (with default values from selected contact)`

**src/app/crm/projects/page.tsx:352**
- ❌ Table `collection` does not exist
- 💡 Did you mean 'collections'?
- Code: `const collectionPrefix = 'XX'; // Placeholder - should get from collection selection`

**src/app/crm/projects/page.tsx:354**
- ❌ Table `IDs` does not exist
- 💡 Did you mean 'items'?
- Code: `// Get material names from IDs for SKU generation`

**src/app/crm/projects/page.tsx:656**
- ❌ Table `all` does not exist
- 💡 Did you mean 'deals'?
- Code: `Showing all available materials from all collections`

**src/app/crm/projects/page.tsx:1457**
- ❌ Table `API` does not exist
- Code: `// Get projects from API`

**src/app/crm/projects/page.tsx:1606**
- ❌ Table `project` does not exist
- 💡 Did you mean 'projects'?
- Code: `notes: `Order created from project: ${project.name}`,`

**src/app/crm/projects/page.tsx:1618**
- ❌ Table `base` does not exist
- 💡 Did you mean 'tasks'?
- Code: `// Determine product type from base SKU prefix`

**src/app/crm/projects/page.tsx:1698**
- ❌ Table `IDs` does not exist
- 💡 Did you mean 'items'?
- Code: `// Get material names from IDs for SKU generation`

**src/app/dashboards/shipping/page.tsx:185**
- ❌ Table `ship` does not exist
- Code: `description="From ship to delivery"`

**src/app/design/projects/page.tsx:206**
- ❌ Table `concept` does not exist
- 💡 Did you mean 'concepts'?
- Code: `subtitle="Manage design projects from concept to final approval"`

**src/app/documents/[id]/page.tsx:100**
- ❌ Table `file` does not exist
- Code: `// Determine document type from file type or document_type field`

**src/app/financials/invoices/[id]/page.tsx:135**
- ❌ Table `first` does not exist
- Code: `// Get customer info from first invoice item`

**src/app/financials/payments/[id]/page.tsx:127**
- ❌ Table `payment` does not exist
- 💡 Did you mean 'payments'?
- Code: `// Get customer info from payment allocations`

**src/app/portal/customer/page.tsx:23**
- ❌ Table `designer` does not exist
- 💡 Did you mean 'designers'?
- Code: `* Follows established portal pattern from designer/factory dashboards`

**src/app/portal/customer/page.tsx:39**
- ❌ Table `portal` does not exist
- Code: `// Stats from portal router (show 0 while loading)`

**src/app/portal/customer/shipping/page.tsx:243**
- ❌ Table `the` does not exist
- Code: `button to view real-time updates from the carrier.`

**src/app/portal/designer/layout.tsx:37**
- ❌ Table `tRPC` does not exist
- Code: `// Get user info from tRPC - middleware already validated auth`

**src/app/portal/designer/page.tsx:34**
- ❌ Table `portal` does not exist
- Code: `// Stats from portal router (show 0 while loading)`

**src/app/portal/factory/layout.tsx:38**
- ❌ Table `tRPC` does not exist
- Code: `// Get user info from tRPC - middleware already validated auth`

**src/app/portal/factory/page.tsx:36**
- ❌ Table `portal` does not exist
- Code: `// Stats from portal router (show 0 while loading)`

**src/app/portal/layout.tsx:40**
- ❌ Table `tRPC` does not exist
- Code: `// Get user info from tRPC - middleware already validated auth`

**src/app/portal/qc/layout.tsx:38**
- ❌ Table `tRPC` does not exist
- Code: `// Get user info from tRPC - middleware already validated auth`

**src/app/portal/qc/page.tsx:35**
- ❌ Table `portal` does not exist
- Code: `// Stats from portal router`

**src/app/production/orders/[id]/page.tsx:678**
- ❌ Table `production` does not exist
- 💡 Did you mean 'products'?
- Code: `<p className="text-xs">Click &quot;Auto-Generate Packing Jobs&quot; to create packing jobs from production order items</p>`

**src/app/production/orders/[id]/page.tsx:685**
- ❌ Table `this` does not exist
- 💡 Did you mean 'items'?
- Code: `{packingJobs.length} packing {packingJobs.length === 1 ? "job" : "jobs"} generated from this production order`

**src/app/production/prototypes/new/page.tsx:242**
- ❌ Table `catalog` does not exist
- Code: `<SelectValue placeholder="Select base item from catalog" />`

**src/app/production/prototypes/page.tsx:254**
- ❌ Table `concept` does not exist
- 💡 Did you mean 'concepts'?
- Code: `subtitle="Manage prototype development from concept to catalog"`

**src/app/production/shipments/page.tsx:35**
- ❌ Table `production` does not exist
- 💡 Did you mean 'products'?
- Code: `// Fetch shipments from production orders`

**src/app/production/shipments/page.tsx:181**
- ❌ Table `production` does not exist
- 💡 Did you mean 'products'?
- Code: `subtitle="Prepare and track shipments from production orders"`

**src/app/products/collections/[id]/page.tsx:260**
- ❌ Table `the` does not exist
- Code: `description="Materials can be assigned to this collection from the Materials page."`

**src/app/products/concepts/[id]/page.tsx:328**
- ❌ Table `this` does not exist
- 💡 Did you mean 'items'?
- Code: `description="Prototypes will appear here once created from this concept."`

**src/app/products/ordered-items/page.tsx:499**
- ❌ Table `API` does not exist
- Code: `// Get real data from API`

**src/app/share/page.tsx:4**
- ❌ Table `other` does not exist
- 💡 Did you mean 'orders'?
- Code: `* Handles shared content from other apps via Web Share Target API`

**src/app/share/page.tsx:32**
- ❌ Table `URL` does not exist
- 💡 Did you mean 'users'?
- Code: `// Get shared data from URL parameters`

**src/app/shipping/page.tsx:174**
- ❌ Table `production` does not exist
- 💡 Did you mean 'products'?
- Code: `<p className="text-sm text-muted">From production orders</p>`

**src/app/shipping/tracking/page.tsx:144**
- ❌ Table `database` does not exist
- Code: `{/* Order details would be shown here if available from database lookup */}`

**src/app/shipping/tracking/page.tsx:155**
- ❌ Table `SEKO` does not exist
- 💡 Did you mean 'users'?
- Code: `{/* Example tracking events - in a real implementation, this would come from SEKO API */}`

**src/app/tasks/my/page.tsx:61**
- ❌ Table `session` does not exist
- 💡 Did you mean 'sessions'?
- Code: `// Use real Development User ID - in production this would come from session`

**src/app/tasks/templates/page.tsx:9**
- ❌ Table `template` does not exist
- Code: `console.log('Creating tasks from template:', templateId);`

**src/app/tasks/templates/page.tsx:13**
- ❌ Table `the` does not exist
- Code: `// 3. Automatically create tasks from the template`

**src/app/terms/page.tsx:87**
- ❌ Table `use` does not exist
- 💡 Did you mean 'users'?
- Code: `not liable for any damages arising from use of the service, including but not limited`

**src/components/DataFreshnessIndicator.tsx:4**
- ❌ Table `cache` does not exist
- Code: `* Shows users when data was last updated and whether it's from cache or live`

**src/components/ServiceWorkerUpdateManager.tsx:106**
- ❌ Table `service` does not exist
- Code: `// Listen for messages from service worker`

**src/components/ServiceWorkerUpdateManager.tsx:119**
- ❌ Table `service` does not exist
- Code: `* Get version from service worker`

**src/components/ServiceWorkerUpdateManager.tsx:122**
- ❌ Table `service` does not exist
- Code: `// In production, this would fetch version from service worker`

**src/components/SmartInstallPrompt.tsx:72**
- ❌ Table `localStorage` does not exist
- Code: `* Load user behavior from localStorage`

**src/components/TaskActivities.tsx:63**
- ❌ Table `auth` does not exist
- Code: `// Get current user ID from auth`

**src/components/TaskAdvancedFilters.tsx:149**
- ❌ Table `APIs` does not exist
- 💡 Did you mean 'tasks'?
- Code: `// Real data from APIs`

**src/components/TaskAssignedUsers.tsx:81**
- ❌ Table `the` does not exist
- Code: `if (confirm("Are you sure you want to remove this user from the task?")) {`

**src/components/TaskAssignedUsers.tsx:248**
- ❌ Table `Task` does not exist
- 💡 Did you mean 'tasks'?
- Code: `Remove from Task`

**src/components/TaskAttachments.tsx:68**
- ❌ Table `auth` does not exist
- Code: `// Get current user ID from auth`

**src/components/TaskAttachments.tsx:218**
- ❌ Table `progress` does not exist
- Code: `// Remove failed file from progress`

**src/components/TaskBulkOperations.tsx:87**
- ❌ Table `auth` does not exist
- Code: `// Get current user ID from auth`

**src/components/TaskCreateForm.tsx:51**
- ❌ Table `auth` does not exist
- Code: `// Get current user ID from auth`

**src/components/TaskDependencies.tsx:110**
- ❌ Table `API` does not exist
- Code: `// Mock data - in production this would come from API`

**src/components/TaskDependencies.tsx:175**
- ❌ Table `the` does not exist
- Code: `// Remove the dependency from the state`

**src/components/TaskEntityLinks.tsx:80**
- ❌ Table `auth` does not exist
- Code: `// Get current user ID from auth`

**src/components/TaskNotifications.tsx:79**
- ❌ Table `auth` does not exist
- Code: `// Get current user ID from auth`

**src/components/TaskNotifications.tsx:82**
- ❌ Table `API` does not exist
- Code: `// Load notifications from API`

**src/components/TaskTimeTracking.tsx:72**
- ❌ Table `auth` does not exist
- Code: `// Get current user ID from auth`

**src/components/TaskTimeTracking.tsx:215**
- ❌ Table `the` does not exist
- Code: `// Remove the entry from the state`

**src/components/admin/ApprovalDashboard.tsx:103**
- ❌ Table `list` does not exist
- Code: `// Remove from list`

**src/components/admin/UserManagementPanel.tsx:393**
- ❌ Table `the` does not exist
- Code: `Choose a user from the list to view and manage their permissions`

**src/components/catalog/CatalogDocumentsTab.tsx:15**
- ❌ Table `Design` does not exist
- 💡 Did you mean 'designers'?
- Code: `* - Files ≥ 50MB → Google Drive (OAuth configured from Design module)`

**src/components/common/Breadcrumbs.tsx:58**
- ❌ Table `global` does not exist
- Code: `* from global CSS for consistent styling and easy maintenance.`

**src/components/common/DataTable.tsx:66**
- ❌ Table `object` does not exist
- Code: `// Helper function to get nested value from object`

**src/components/common/EmptyState.tsx:29**
- ❌ Table `lucide` does not exist
- Code: `* Icon component to display (from lucide-react)`

**src/components/common/FormDialog.tsx:233**
- ❌ Table `onSubmit` does not exist
- Code: `// Error handling - errors from onSubmit will be caught here`

**src/components/common/LoadingState.tsx:24**
- ❌ Table `globals` does not exist
- Code: `* Uses semantic CSS classes from globals.css for consistent styling.`

**src/components/common/StatusBadge.tsx:90**
- ❌ Table `status` does not exist
- 💡 Did you mean 'tasks'?
- Code: `* Safely get variant from status mapping`

**src/components/common/StatusBadge.tsx:98**
- ❌ Table `priority` does not exist
- Code: `* Safely get variant from priority mapping`

**src/components/common/StatusBadge.tsx:106**
- ❌ Table `department` does not exist
- Code: `* Safely get variant from department mapping`

**src/components/crm/CRMNotifications.tsx:582**
- ❌ Table `Meeting` does not exist
- Code: `action_label: 'Join Meeting',`

**src/components/crm/CRMTagsManager.tsx:445**
- ❌ Table `predefined` does not exist
- Code: `Choose from predefined tags or search for specific ones`

**src/components/crm/CRMTaskIntegration.tsx:357**
- ❌ Table `the` does not exist
- Code: `// This would need the link ID from the task entity links`

**src/components/dashboards/CustomDashboardBuilder.tsx:422**
- ❌ Table `the` does not exist
- Code: `Click on widgets from the catalog to add them to your dashboard`

**src/components/dashboards/DashboardComparisonView.tsx:231**
- ❌ Table `different` does not exist
- Code: `Compare metrics side-by-side from different dashboards with synchronized date ranges`

**src/components/furniture/DimensionDisplay.tsx:83**
- ❌ Table `field` does not exist
- Code: `// Extract base name and unit from field`

**src/components/providers/ThemeProvider.tsx:29**
- ❌ Table `localStorage` does not exist
- Code: `// Load theme from localStorage on mount`

**src/components/shop-drawings/ApprovalStatus.tsx:180**
- ❌ Table `one` does not exist
- Code: `Awaiting approval from one or more parties`

**src/components/shop-drawings/VersionTimeline.tsx:55**
- ❌ Table `bytes` does not exist
- 💡 Did you mean 'items'?
- Code: `* Formats file size from bytes to human-readable format`

**src/components/ui/command-palette.tsx:83**
- ❌ Table `paginated` does not exist
- Code: `// Extract items from paginated responses`

**src/components/ui/command-palette.tsx:180**
- ❌ Table `keyboard` does not exist
- Code: `// Also listen for custom search event from keyboard shortcuts`

**src/components/ui/command-palette.tsx:224**
- ❌ Table `localStorage` does not exist
- Code: `// Load recent searches from localStorage`

**src/components/ui/delete-confirm-dialog.tsx:89**
- ❌ Table `the` does not exist
- Code: `This action cannot be undone. This will permanently delete the data from the database.`

**src/hooks/useAdaptiveCaching.ts:62**
- ❌ Table `browser` does not exist
- Code: `* Get network information from browser`

**src/hooks/useAuth.tsx:9**
- ❌ Table `the` does not exist
- Code: `// Re-export from the canonical auth provider location`

**src/hooks/useOptimisticUpdate.ts:75**
- ❌ Table `server` does not exist
- Code: `// Invalidate to refetch from server (ensures consistency)`

**src/hooks/useOptimisticUpdate.ts:135**
- ❌ Table `array` does not exist
- Code: `* Remove item from array`

**src/lib/api/client.tsx:52**
- ❌ Table `getting` does not exist
- Code: `maxURLLength: 2083, // Prevent URLs from getting too long`

**src/lib/auth/server.ts:27**
- ❌ Table `Supabase` does not exist
- Code: `* Get authenticated user from Supabase`

**src/lib/auth/server.ts:47**
- ❌ Table `database` does not exist
- Code: `* Get user profile from database`

**src/lib/db.ts:25**
- ❌ Table `Prisma` does not exist
- Code: `* ✅ Full TypeScript type safety (derived from Prisma schema)`

**src/lib/db.ts:74**
- ❌ Table `Phase` does not exist
- Code: `// New fields from Phase 1 enhancement`

**src/lib/db.ts:559**
- ❌ Table `the` does not exist
- Code: `// These are already resolved promises from the model operations`

**src/lib/db.ts:2080**
- ❌ Table `all` does not exist
- 💡 Did you mean 'deals'?
- Code: `// Get unique tags from all tasks`

**src/lib/google-drive/service-account-client.ts:19**
- ❌ Table `environment` does not exist
- Code: `* Service Account Configuration from environment`

**src/lib/google-drive/service-account-client.ts:113**
- ❌ Table `browser` does not exist
- Code: `// Handle File object (from browser uploads)`

**src/lib/google-drive/service-account-client.ts:118**
- ❌ Table `buffer` does not exist
- Code: `// Create readable stream from buffer`

**src/lib/google-drive/service-account-client.ts:169**
- ❌ Table `Google` does not exist
- Code: `* Delete file from Google Drive`

**src/lib/google-drive/service-account-client.ts:187**
- ❌ Table `Google` does not exist
- Code: `* Get file metadata from Google Drive`

**src/lib/oauth/google-drive-client.ts:12**
- ❌ Table `environment` does not exist
- Code: `* OAuth 2.0 configuration from environment variables`

**src/lib/oauth/google-drive-client.ts:65**
- ❌ Table `OAuth` does not exist
- Code: `* @param code - Authorization code from OAuth callback`

**src/lib/oauth/google-drive-client.ts:74**
- ❌ Table `Google` does not exist
- Code: `throw new Error('No access token returned from Google');`

**src/lib/oauth/google-drive-client.ts:89**
- ❌ Table `initial` does not exist
- Code: `* @param refreshToken - The refresh token from initial OAuth flow`

**src/lib/oauth/google-drive-client.ts:102**
- ❌ Table `token` does not exist
- Code: `throw new Error('No access token returned from token refresh');`

**src/lib/oauth/google-drive-client.ts:136**
- ❌ Table `Google` does not exist
- Code: `* Get user info from Google OAuth`

**src/lib/oauth/token-encryption.ts:14**
- ❌ Table `environment` does not exist
- Code: `* Get encryption key from environment variable`

**src/lib/pwa/offline-analytics.ts:225**
- ❌ Table `localStorage` does not exist
- Code: `* Get buffer from localStorage`

**src/lib/pwa/offline-storage.ts:193**
- ❌ Table `offline` does not exist
- Code: `* Get all tasks from offline storage`

**src/lib/pwa/offline-storage.ts:295**
- ❌ Table `offline` does not exist
- Code: `* Delete task from offline storage`

**src/lib/pwa/offline-storage.ts:317**
- ❌ Table `server` does not exist
- Code: `* Bulk save tasks (for initial sync from server)`

**src/lib/pwa/offline-storage.ts:524**
- ❌ Table `sync` does not exist
- Code: `* Remove item from sync queue`

**src/lib/pwa/offline-storage.ts:529**
- ❌ Table `sync` does not exist
- Code: `console.log('[Offline Storage] Removed from sync queue:', id);`

**src/lib/pwa/offline-storage.ts:581**
- ❌ Table `queue` does not exist
- Code: `// Remove from queue if max retries exceeded (3)`

**src/lib/pwa/push-notifications.ts:335**
- ❌ Table `server` does not exist
- Code: `console.error('[Push] Failed to remove subscription from server');`

**src/lib/pwa/push-notifications.ts:338**
- ❌ Table `server` does not exist
- Code: `console.error('[Push] Error removing subscription from server:', error);`

**src/lib/quickbooks/auth.ts:22**
- ❌ Table `database` does not exist
- Code: `// Get connection from database`

**src/lib/quickbooks/auth.ts:57**
- ❌ Table `database` does not exist
- Code: `// Set tokens from database`

**src/lib/quickbooks/auth.ts:79**
- ❌ Table `database` does not exist
- Code: `// Get connection from database`

**src/lib/quickbooks/client.ts:141**
- ❌ Table `database` does not exist
- Code: `* Set OAuth tokens (retrieved from database)`

**src/lib/quickbooks/client.ts:290**
- ❌ Table `QuickBooks` does not exist
- Code: `console.error("Error fetching customer from QuickBooks:", error);`

**src/lib/quickbooks/client.ts:336**
- ❌ Table `QuickBooks` does not exist
- Code: `console.error("Error fetching invoice from QuickBooks:", error);`

**src/lib/quickbooks/client.ts:366**
- ❌ Table `QuickBooks` does not exist
- Code: `console.error("Error fetching payment from QuickBooks:", error);`

**src/lib/quickbooks/client.ts:401**
- ❌ Table `QuickBooks` does not exist
- Code: `console.error("Error fetching item from QuickBooks:", error);`

**src/lib/security/csrf.ts:26**
- ❌ Table `request` does not exist
- Code: `* Validates a CSRF token from request headers`

**src/lib/security/csrf.ts:32**
- ❌ Table `header` does not exist
- 💡 Did you mean 'leads'?
- Code: `// Get token from header`

**src/lib/seko/client.ts:5**
- ❌ Table `multiple` does not exist
- Code: `* - Getting shipping quotes from multiple carriers`

**src/lib/seko/client.ts:123**
- ❌ Table `multiple` does not exist
- Code: `* Get shipping quotes from multiple carriers`

**src/lib/storage/google-drive-storage.ts:101**
- ❌ Table `Google` does not exist
- Code: `* Delete file from Google Drive`

**src/lib/storage/google-drive-storage.ts:122**
- ❌ Table `Google` does not exist
- Code: `* Get file metadata from Google Drive`

**src/lib/storage/hybrid-storage.ts:78**
- ❌ Table `filename` does not exist
- Code: `* Get file extension from filename`

**src/lib/storage/supabase-storage.ts:68**
- ❌ Table `Supabase` does not exist
- Code: `* Delete file from Supabase Storage`

**src/lib/storage.ts:113**
- ❌ Table `Supabase` does not exist
- Code: `* Delete a file from Supabase Storage`

**src/lib/storage.ts:260**
- ❌ Table `Supabase` does not exist
- Code: `* Delete a product image from Supabase Storage`

**src/lib/supabase/server.ts:21**
- ❌ Table `a` does not exist
- Code: `// The `setAll` method was called from a Server Component.`

**src/lib/utils/dimension-validation.ts:245**
- ❌ Table `database` does not exist
- Code: `// Get all available fields from database`

**src/lib/utils/full-sku-generator.ts:5**
- ❌ Table `catalog` does not exist
- Code: `* - Base SKU from catalog item (e.g., "IN-SOFA-001")`

**src/lib/utils/full-sku-generator.ts:171**
- ❌ Table `specifications` does not exist
- Code: `* Get material from specifications (type-safe accessor to avoid object injection)`

**src/lib/utils/full-sku-generator.ts:225**
- ❌ Table `material` does not exist
- 💡 Did you mean 'materials'?
- Code: `* Generate material SKU component from material specification`

**src/lib/utils/full-sku-generator.ts:245**
- ❌ Table `material` does not exist
- 💡 Did you mean 'materials'?
- Code: `// Generate abbreviation from material name/color/finish`

**src/lib/utils/full-sku-generator.ts:295**
- ❌ Table `base` does not exist
- 💡 Did you mean 'tasks'?
- Code: `* Generate Full SKU from base SKU and material specifications`

**src/lib/utils/full-sku-generator.ts:302**
- ❌ Table `catalog` does not exist
- Code: `* @param baseSku - Base SKU from catalog item (e.g., "IN-SOFA-001")`

**src/lib/utils/full-sku-generator.ts:368**
- ❌ Table `all` does not exist
- 💡 Did you mean 'deals'?
- Code: `// Join all components with hyphens`

**src/lib/utils/full-sku-generator.ts:409**
- ❌ Table `parts` does not exist
- 💡 Did you mean 'partners'?
- Code: `// Remove hex from parts for further processing`

**src/lib/utils/pdf-export.ts:34**
- ❌ Table `HTML` does not exist
- 💡 Did you mean 'items'?
- Code: `// Create canvas from HTML element`

**src/lib/utils/product-sku-generator.ts:82**
- ❌ Table `catalog` does not exist
- Code: `* @param baseSku Base SKU from catalog (e.g., "UK-DINI-001")`

**src/lib/utils/product-sku-generator.ts:108**
- ❌ Table `order` does not exist
- 💡 Did you mean 'orders'?
- Code: `* Parse material selections from order item specifications`

**src/lib/utils/product-sku-generator.ts:122**
- ❌ Table `specifications` does not exist
- Code: `// Extract material fields from specifications`

**src/lib/utils/product-sku-generator.ts:132**
- ❌ Table `Object` does not exist
- Code: `// Safe object assignment - key is validated as string from Object.entries()`

**src/lib/utils/project-sku-generator.ts:15**
- ❌ Table `client` does not exist
- 💡 Did you mean 'clients'?
- Code: `* Generate client code from client name`

**src/lib/utils/project-sku-generator.ts:45**
- ❌ Table `project` does not exist
- 💡 Did you mean 'projects'?
- Code: `* Generate project code from project name`

**src/lib/utils/project-sku-generator.ts:95**
- ❌ Table `last` does not exist
- 💡 Did you mean 'leads'?
- Code: `// Extract order number from last SKU`

**src/lib/utils/project-sku-generator.ts:149**
- ❌ Table `last` does not exist
- 💡 Did you mean 'leads'?
- Code: `// Extract line item number from last SKU`

**src/lib/utils/unit-conversion.ts:35**
- ❌ Table `a` does not exist
- Code: `* Create dual dimension object from a single value and unit`

**src/middleware/auth.ts:60**
- ❌ Table `request` does not exist
- Code: `* Extract and verify auth token from request`

**src/middleware/auth.ts:66**
- ❌ Table `cookie` does not exist
- Code: `// Get token from cookie or Authorization header`

**src/modules/dashboard/DashboardPage.tsx:81**
- ❌ Table `last` does not exist
- 💡 Did you mean 'leads'?
- Code: `description="+12% from last month"`

**src/server/api/routers/admin.ts:662**
- ❌ Table `a` does not exist
- Code: `* Remove a role from a user`

**src/server/api/routers/analytics.ts:55**
- ❌ Table `paid` does not exist
- Code: `// Total revenue from paid invoices`

**src/server/api/routers/analytics.ts:483**
- ❌ Table `quality_defects` does not exist
- Code: `LEFT JOIN quality_defects qd ON qd.inspection_id = qi.id`

**src/server/api/routers/analytics.ts:521**
- ❌ Table `quality_defects` does not exist
- Code: `FROM quality_defects qd`

**src/server/api/routers/catalog.ts:253**
- ❌ Table `base` does not exist
- 💡 Did you mean 'tasks'?
- Code: `// Include other read-only CRUD operations from base router`

**src/server/api/routers/dashboards.ts:412**
- ❌ Table `historical` does not exist
- Code: `const revenueGrowth = 0; // TODO: Calculate from historical data when timezone issue is resolved`

**src/server/api/routers/dashboards.ts:439**
- ❌ Table `historical` does not exist
- Code: `const customerGrowth = 0; // TODO: Calculate from historical customer data`

**src/server/api/routers/dashboards.ts:608**
- ❌ Table `actual` does not exist
- Code: `const avgFulfillmentDays = 3; // This would be calculated from actual data`

**src/server/api/routers/dashboards.ts:1109**
- ❌ Table `configuration` does not exist
- Code: `const maxCapacity = 100; // This would come from configuration`

**src/server/api/routers/documents.ts:261**
- ❌ Table `storage` does not exist
- Code: `// TODO: Delete from storage (Supabase or Google Drive)`

**src/server/api/routers/documents.ts:264**
- ❌ Table `database` does not exist
- Code: `// Delete from database`

**src/server/api/routers/oauth.ts:170**
- ❌ Table `database` does not exist
- Code: `// Continue to delete from database even if revocation fails`

**src/server/api/routers/oauth.ts:173**
- ❌ Table `database` does not exist
- Code: `// Delete from database`

**src/server/api/routers/orders.ts:262**
- ❌ Table `base` does not exist
- 💡 Did you mean 'tasks'?
- Code: `// Generate Full SKU from base SKU + material selections`

**src/server/api/routers/orders.ts:333**
- ❌ Table `completed` does not exist
- Code: `completed: [], // No transitions from completed`

**src/server/api/routers/orders.ts:334**
- ❌ Table `cancelled` does not exist
- Code: `cancelled: [], // No transitions from cancelled`

**src/server/api/routers/packing.ts:5**
- ❌ Table `production` does not exist
- 💡 Did you mean 'products'?
- Code: `* from production orders for shipment preparation.`

**src/server/api/routers/packing.ts:209**
- ❌ Table `production` does not exist
- 💡 Did you mean 'products'?
- Code: `* Auto-generate packing job from production order`

**src/server/api/routers/packing.ts:290**
- ❌ Table `production` does not exist
- 💡 Did you mean 'products'?
- Code: `message: `Generated ${jobs.length} packing job(s) from production order`,`

**src/server/api/routers/portal.ts:48**
- ❌ Table `middleware` does not exist
- Code: `// NOTE: last_login tracking removed from middleware for performance`

**src/server/api/routers/portal.ts:88**
- ❌ Table `middleware` does not exist
- Code: `// NOTE: last_login tracking removed from middleware for performance`

**src/server/api/routers/portal.ts:222**
- ❌ Table `portal` does not exist
- Code: `// Determine portal type from portal access (default to 'customer' for backward compatibility)`

**src/server/api/routers/portal.ts:340**
- ❌ Table `through` does not exist
- Code: `// Active orders count - join through projects table`

**src/server/api/routers/portal.ts:362**
- ❌ Table `through` does not exist
- Code: `// Recent shipments (last 30 days) - join through projects table`

**src/server/api/routers/portal.ts:809**
- ❌ Table `order` does not exist
- 💡 Did you mean 'orders'?
- Code: `// Build timeline from order data`

**src/server/api/routers/portal.ts:1548**
- ❌ Table `metadata` does not exist
- Code: `// Extract production_invoice_id from metadata`

**src/server/api/routers/production-invoices.ts:458**
- ❌ Table `all` does not exist
- 💡 Did you mean 'deals'?
- Code: `// Calculate total cost from all production orders`

**src/server/api/routers/production-invoices.ts:461**
- ❌ Table `first` does not exist
- Code: `// Get project and customer info from first production order`

**src/server/api/routers/production-orders.ts:93**
- ❌ Table `project` does not exist
- 💡 Did you mean 'projects'?
- Code: `// Get customer from project if available`

**src/server/api/routers/production-orders.ts:153**
- ❌ Table `project` does not exist
- 💡 Did you mean 'projects'?
- Code: `// Get customer from project if available`

**src/server/api/routers/prototypes.ts:1380**
- ❌ Table `all` does not exist
- 💡 Did you mean 'deals'?
- Code: `// Remove featured flag from all photos of this prototype`

**src/server/api/routers/quickbooks-sync.ts:11**
- ❌ Table `database` does not exist
- Code: `* Get QuickBooks tokens from database and set them on the client`

**src/server/api/routers/shipping.ts:72**
- ❌ Table `SEKO` does not exist
- 💡 Did you mean 'users'?
- Code: `// Get shipping quotes from SEKO`

**src/server/api/routers/shipping.ts:104**
- ❌ Table `SEKO` does not exist
- 💡 Did you mean 'users'?
- Code: `throw new Error('Failed to fetch shipping quotes from SEKO');`

**src/server/api/routers/shipping.ts:310**
- ❌ Table `SEKO` does not exist
- 💡 Did you mean 'users'?
- Code: `// Get label from SEKO API`

**src/server/api/routers/shipping.ts:485**
- ❌ Table `SEKO` does not exist
- 💡 Did you mean 'users'?
- Code: `// Fetch latest tracking from SEKO API`

**src/server/api/routers/shipping.ts:506**
- ❌ Table `database` does not exist
- Code: `// If SEKO API fails, return cached data from database`

**src/server/api/routers/shipping.ts:507**
- ❌ Table `SEKO` does not exist
- 💡 Did you mean 'users'?
- Code: `console.warn('Failed to fetch live tracking from SEKO, returning cached data:', error);`

**src/server/api/routers/shop-drawings.ts:260**
- ❌ Table `user` does not exist
- 💡 Did you mean 'users'?
- Code: `uploaded_by_role: 'factory', // TODO: Determine role from user`

**src/server/api/routers/shop-drawings.ts:341**
- ❌ Table `user` does not exist
- 💡 Did you mean 'users'?
- Code: `uploaded_by_role: 'factory', // TODO: Determine role from user`

**src/server/api/routers/shop-drawings.ts:403**
- ❌ Table `user` does not exist
- 💡 Did you mean 'users'?
- Code: `author_role: 'limn_team', // TODO: Determine role from user`

**src/server/api/routers/shop-drawings.ts:498**
- ❌ Table `user` does not exist
- 💡 Did you mean 'users'?
- Code: `// Determine approver role (TODO: from user role/permissions)`

**src/server/api/routers/storage.ts:224**
- ❌ Table `storage` does not exist
- Code: `// Delete from storage`

**src/server/api/routers/storage.ts:232**
- ❌ Table `database` does not exist
- Code: `// Delete from database`

**src/server/api/routers/tasks.ts:437**
- ❌ Table `all` does not exist
- 💡 Did you mean 'deals'?
- Code: `// Get unique tags from all tasks`

**src/server/api/routers/user-profile.ts:185**
- ❌ Table `avatars` does not exist
- Code: `.from('avatars')`

**src/server/api/trpc/context.ts:49**
- ❌ Table `the` does not exist
- Code: `// Construct a minimal session object from the validated user`

**src/server/api/trpc/context.ts:77**
- ❌ Table `Supabase` does not exist
- Code: `// Get session from Supabase if not provided`

**src/server/api/trpc/context.ts:85**
- ❌ Table `session` does not exist
- 💡 Did you mean 'sessions'?
- Code: `user: session?.user ?? null, // Extract user from session for convenience`

**src/services/auth/auth.service.ts:74**
- ❌ Table `pending_sign_ups` does not exist
- Code: `// const request = await prisma.pending_sign_ups.findUnique({`

**src/services/auth/auth.service.ts:86**
- ❌ Table `pending_sign_ups` does not exist
- Code: `// await prisma.pending_sign_ups.update({`

**tests/00-schema-drift-detection.spec.ts:45**
- ❌ Table `both` does not exist
- Code: `// Query actual database for table names (from both public and auth schemas)`

**tests/00-schema-drift-detection.spec.ts:48**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.tables`

**tests/00-schema-drift-detection.spec.ts:123**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/00-schema-drift-detection.spec.ts:156**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/00-schema-drift-detection.spec.ts:182**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.table_constraints AS tc`

**tests/00-schema-drift-detection.spec.ts:183**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.key_column_usage AS kcu`

**tests/00-schema-drift-detection.spec.ts:186**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.constraint_column_usage AS ccu`

**tests/00-schema-drift-detection.spec.ts:228**
- ❌ Table `pg_indexes` does not exist
- Code: `FROM pg_indexes`

**tests/01-authentication.spec.ts:17**
- ❌ Table `login` does not exist
- Code: `// Check for button-based login options (actual button text from login page)`

**tests/05-database.spec.ts:16**
- ❌ Table `database` does not exist
- Code: `// Wait for page to load data from database`

**tests/06-permissions.spec.ts:26**
- ❌ Table `one` does not exist
- Code: `test('Logout from one tab affects other tabs', async ({ browser }) => {`

**tests/12-trpc-api.spec.ts:553**
- ❌ Table `storage` does not exist
- Code: `//   2. Client receives public URL from storage provider`

**tests/14-security.spec.ts:343**
- ❌ Table `different` does not exist
- Code: `// Try CSRF attack by posting from different origin`

**tests/15-customer-portal.spec.ts:388**
- ❌ Table `API` does not exist
- Code: `test('Dashboard stats match data from API', async ({ page, request }) => {`

**tests/15-customer-portal.spec.ts:392**
- ❌ Table `UI` does not exist
- Code: `// Get stats from UI`

**tests/15-customer-portal.spec.ts:396**
- ❌ Table `API` does not exist
- Code: `// Get stats from API`

**tests/18-pwa-mobile.spec.ts:7**
- ❌ Table `file` does not exist
- Code: `// Load session from file (cached auth session)`

**tests/18-pwa-mobile.spec.ts:144**
- ❌ Table `file` does not exist
- Code: `// Load session from file`

**tests/18-pwa-mobile.spec.ts:169**
- ❌ Table `file` does not exist
- Code: `// Load session from file`

**tests/18-pwa-mobile.spec.ts:201**
- ❌ Table `file` does not exist
- Code: `// Load session from file`

**tests/19-responsive-design.spec.ts:89**
- ❌ Table `domcontentloaded` does not exist
- Code: `await page.waitForLoadState('networkidle'); // Changed from domcontentloaded`

**tests/19-responsive-design.spec.ts:134**
- ❌ Table `domcontentloaded` does not exist
- Code: `await page.waitForLoadState('networkidle'); // Changed from domcontentloaded`

**tests/20-gap-analysis.spec.ts:75**
- ❌ Table `file` does not exist
- Code: `// Extract route from file path`

**tests/20-gap-analysis.spec.ts:421**
- ❌ Table `auto` does not exist
- Code: `test('Identify pages that could benefit from auto-save', async ({ page }) => {`

**tests/20-gap-analysis.spec.ts:449**
- ❌ Table `real` does not exist
- 💡 Did you mean 'deals'?
- Code: `test('Identify pages that could benefit from real-time collaboration', async ({ page }) => {`

**tests/20-gap-analysis.spec.ts:475**
- ❌ Table `advanced` does not exist
- Code: `test('Identify pages that could benefit from advanced filters', async ({ page }) => {`

**tests/20-gap-analysis.spec.ts:501**
- ❌ Table `customization` does not exist
- Code: `test('Identify dashboards that could benefit from customization', async ({ page }) => {`

**tests/25-tasks-module.spec.ts:234**
- ❌ Table `kanban` does not exist
- Code: `test('Can create task from kanban board', async ({ page }) => {`

**tests/25-tasks-module.spec.ts:252**
- ❌ Table `kanban` does not exist
- Code: `test('Can view task details from kanban card', async ({ page }) => {`

**tests/27-products-module.spec.ts:820**
- ❌ Table `product` does not exist
- 💡 Did you mean 'products'?
- Code: `test('Can navigate from product to orders', async ({ page }) => {`

**tests/27-products-module.spec.ts:846**
- ❌ Table `product` does not exist
- 💡 Did you mean 'products'?
- Code: `test('Can navigate from product to projects', async ({ page }) => {`

**tests/28-dashboards-module.spec.ts:576**
- ❌ Table `dashboard` does not exist
- Code: `test('Can navigate from dashboard to orders', async ({ page }) => {`

**tests/28-dashboards-module.spec.ts:596**
- ❌ Table `dashboard` does not exist
- Code: `test('Can navigate from dashboard to tasks', async ({ page }) => {`

**tests/28-dashboards-module.spec.ts:614**
- ❌ Table `dashboard` does not exist
- Code: `test('Can navigate from dashboard to projects', async ({ page }) => {`

**tests/29-data-persistence-e2e.spec.ts:94**
- ❌ Table `URL` does not exist
- 💡 Did you mean 'users'?
- Code: `// Try to get customer ID from URL`

**tests/29-data-persistence-e2e.spec.ts:157**
- ❌ Table `database` does not exist
- Code: `test('Customer deletion removes from database', async ({ page }) => {`

**tests/30-crm-contacts-comprehensive.spec.ts:414**
- ❌ Table `database` does not exist
- Code: `test('should delete contact and verify removal from database', async ({ page }) => {`

**tests/30-crm-contacts-comprehensive.spec.ts:437**
- ❌ Table `database` does not exist
- Code: `// CRITICAL: Verify removed from database`

**tests/30-security-data-isolation.spec.ts:178**
- ❌ Table `portal` does not exist
- Code: `test('User without portal access blocked from portal routes', async ({ page }) => {`

**tests/31-crm-customers-comprehensive.spec.ts:283**
- ❌ Table `database` does not exist
- Code: `test('should delete customer and verify removal from database', async ({ page }) => {`

**tests/31-crm-customers-comprehensive.spec.ts:301**
- ❌ Table `database` does not exist
- Code: `// Verify removed from database`

**tests/32-crm-leads-comprehensive.spec.ts:189**
- ❌ Table `database` does not exist
- Code: `// Verify removed from database`

**tests/33-production-orders-comprehensive.spec.ts:317**
- ❌ Table `database` does not exist
- Code: `test('should delete order and verify removal from database', async ({ page }) => {`

**tests/33-production-orders-comprehensive.spec.ts:335**
- ❌ Table `database` does not exist
- Code: `// Verify removed from database`

**tests/40-customer-portal-comprehensive.spec.ts:45**
- ❌ Table `accessing` does not exist
- Code: `test('should prevent non-customer user from accessing customer portal', async ({ page }) => {`

**tests/40-customer-portal-comprehensive.spec.ts:51**
- ❌ Table `customer` does not exist
- 💡 Did you mean 'customers'?
- Code: `// Should redirect away from customer portal (to dashboard or access denied)`

**tests/40-customer-portal-comprehensive.spec.ts:161**
- ❌ Table `database` does not exist
- Code: `// First, get a real order ID from database for this customer`

**tests/41-designer-portal-comprehensive.spec.ts:33**
- ❌ Table `accessing` does not exist
- Code: `test('should prevent non-designer user from accessing designer portal', async ({ page }) => {`

**tests/42-factory-portal-comprehensive.spec.ts:34**
- ❌ Table `accessing` does not exist
- Code: `test('should prevent non-factory user from accessing factory portal', async ({ page }) => {`

**tests/43-qc-portal-comprehensive.spec.ts:36**
- ❌ Table `accessing` does not exist
- Code: `test('should prevent customer user from accessing QC portal', async ({ page }) => {`

**tests/50-products-comprehensive.spec.ts:77**
- ❌ Table `database` does not exist
- Code: `// Get real catalog item ID from database`

**tests/50-products-comprehensive.spec.ts:78**
- ❌ Table `furniture_catalog` does not exist
- Code: `const catalogItem = await prisma.furniture_catalog.findFirst();`

**tests/50-products-comprehensive.spec.ts:126**
- ❌ Table `furniture_concepts` does not exist
- Code: `const concept = await prisma.furniture_concepts.findFirst();`

**tests/50-products-comprehensive.spec.ts:173**
- ❌ Table `furniture_prototypes` does not exist
- Code: `const prototype = await prisma.furniture_prototypes.findFirst();`

**tests/50-products-comprehensive.spec.ts:210**
- ❌ Table `furniture_collections` does not exist
- Code: `const collection = await prisma.furniture_collections.findFirst();`

**tests/55-partners-comprehensive.spec.ts:92**
- ❌ Table `partner_designers` does not exist
- Code: `const designer = await prisma.partner_designers.findFirst();`

**tests/55-partners-comprehensive.spec.ts:107**
- ❌ Table `partner_designers` does not exist
- Code: `const designer = await prisma.partner_designers.findFirst({`

**tests/55-partners-comprehensive.spec.ts:123**
- ❌ Table `partner_designers` does not exist
- Code: `const designer = await prisma.partner_designers.findFirst();`

**tests/55-partners-comprehensive.spec.ts:137**
- ❌ Table `partner_designers` does not exist
- Code: `const designer = await prisma.partner_designers.findFirst();`

**tests/55-partners-comprehensive.spec.ts:151**
- ❌ Table `partner_designers` does not exist
- Code: `const designer = await prisma.partner_designers.findFirst();`

**tests/55-partners-comprehensive.spec.ts:236**
- ❌ Table `partner_factories` does not exist
- Code: `const factory = await prisma.partner_factories.findFirst();`

**tests/55-partners-comprehensive.spec.ts:251**
- ❌ Table `partner_factories` does not exist
- Code: `const factory = await prisma.partner_factories.findFirst({`

**tests/55-partners-comprehensive.spec.ts:267**
- ❌ Table `partner_factories` does not exist
- Code: `const factory = await prisma.partner_factories.findFirst();`

**tests/55-partners-comprehensive.spec.ts:281**
- ❌ Table `partner_factories` does not exist
- Code: `const factory = await prisma.partner_factories.findFirst();`

**tests/55-partners-comprehensive.spec.ts:295**
- ❌ Table `partner_factories` does not exist
- Code: `const factory = await prisma.partner_factories.findFirst();`

**tests/55-partners-comprehensive.spec.ts:309**
- ❌ Table `partner_factories` does not exist
- Code: `const factory = await prisma.partner_factories.findFirst();`

**tests/55-partners-comprehensive.spec.ts:340**
- ❌ Table `partner_designers` does not exist
- Code: `const designer = await prisma.partner_designers.findFirst();`

**tests/55-partners-comprehensive.spec.ts:354**
- ❌ Table `partner_designers` does not exist
- Code: `const designer = await prisma.partner_designers.findFirst();`

**tests/70-api-admin.spec.ts:101**
- ❌ Table `the` does not exist
- Code: `// First, get a user from the list`

**tests/70-api-admin.spec.ts:567**
- ❌ Table `user` does not exist
- 💡 Did you mean 'users'?
- Code: `test('should remove role from user', async () => {`

**tests/ai-testing/page-scanner.ts:110**
- ❌ Table `route` does not exist
- Code: `* Extract module name from route path`

**tests/ai-testing/page-scanner.ts:159**
- ❌ Table `tRPC` does not exist
- Code: `* Extract procedures from tRPC router`

**tests/ai-testing/schema-validator.ts:51**
- ❌ Table `Prisma` does not exist
- Code: `* Extract all model names from Prisma schema`

**tests/ai-testing/schema-validator.ts:66**
- ❌ Table `database` does not exist
- Code: `* Get all tables from database`

**tests/ai-testing/schema-validator.ts:73**
- ❌ Table `pg_tables` does not exist
- Code: `FROM pg_tables`

**tests/ai-testing/schema-validator.ts:159**
- ❌ Table `Prisma` does not exist
- Code: ``Run 'npx prisma db push' to sync ${missingTables.length} missing tables from Prisma schema to database``

**tests/ai-testing/test-orchestrator.ts:118**
- ❌ Table `analysis` does not exist
- Code: `routers: ['production-tracking'], // Known new router from analysis`

**tests/api/all-routers.test.ts:72**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:90**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:104**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.tables`

**tests/api/all-routers.test.ts:117**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:129**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:141**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:156**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:168**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:180**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:192**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:206**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:219**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:237**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:252**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:267**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:279**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:293**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:305**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:323**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:341**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/all-routers.test.ts:356**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.tables`

**tests/api/routers/auth.test.ts:38**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/routers/auth.test.ts:52**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/auth.test.ts:66**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/routers/auth.test.ts:80**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/auth.test.ts:98**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/routers/auth.test.ts:110**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/routers/auth.test.ts:124**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/routers/financial.test.ts:38**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:54**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:77**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:97**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:111**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:133**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:151**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:167**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:186**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:205**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:215**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:232**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:248**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/financial.test.ts:274**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.table_constraints AS tc`

**tests/api/routers/financial.test.ts:275**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.key_column_usage AS kcu`

**tests/api/routers/financial.test.ts:277**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.constraint_column_usage AS ccu`

**tests/api/routers/portal.test.ts:36**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/routers/portal.test.ts:50**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/portal.test.ts:64**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/portal.test.ts:80**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/portal.test.ts:97**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/portal.test.ts:114**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/portal.test.ts:130**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/portal.test.ts:142**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/routers/portal.test.ts:156**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/routers/portal.test.ts:170**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/portal.test.ts:184**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/api/routers/portal.test.ts:198**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/api/routers/portal.test.ts:217**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/config/test-config.ts:4**
- ❌ Table `project` does not exist
- 💡 Did you mean 'projects'?
- Code: `// Load test environment variables from project root`

**tests/e2e/auth/authenticated-flows.test.ts:140**
- ❌ Table `portal` does not exist
- Code: `// Try to access admin page from portal context`

**tests/e2e/auth/authenticated-flows.test.ts:149**
- ❌ Table `admin` does not exist
- Code: `// Should be redirected away from admin or to login`

**tests/helpers/auth-helper.ts:25**
- ❌ Table `file` does not exist
- Code: `// Helper to load session from file`

**tests/helpers/auth-helper.ts:85**
- ❌ Table `file` does not exist
- Code: `// Try to load session from file first - this ELIMINATES rate limiting!`

**tests/helpers/database-helper.ts:162**
- ❌ Table `database` does not exist
- Code: `* Delete test data from database (bypasses RLS)`

**tests/helpers/portal-auth-helper.ts:54**
- ❌ Table `file` does not exist
- Code: `// Try to load session from file first (ZERO rate limiting!)`

**tests/helpers/portal-auth-helper.ts:74**
- ❌ Table `FILE` does not exist
- Code: `return; // ✅ SESSION REUSED FROM FILE - NO API CALL!`

**tests/helpers/portal-auth-helper.ts:115**
- ❌ Table `API` does not exist
- Code: `throw new Error('No auth token returned from API');`

**tests/helpers/security-test-helper.ts:35**
- ❌ Table `first_name` does not exist
- Code: `// Create user profile (full_name is auto-generated from first_name + last_name)`

**tests/integration/auth/authentication-flows.test.ts:43**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/auth/authentication-flows.test.ts:55**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/auth/authentication-flows.test.ts:69**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/auth/authentication-flows.test.ts:84**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/auth/authentication-flows.test.ts:98**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/auth/authentication-flows.test.ts:115**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/auth/authentication-flows.test.ts:138**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/auth/authentication-flows.test.ts:158**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/auth/authentication-flows.test.ts:174**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/auth/authentication-flows.test.ts:187**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/auth/authentication-flows.test.ts:207**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/auth/authentication-flows.test.ts:225**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/auth/authentication-flows.test.ts:239**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/auth/authentication-flows.test.ts:251**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/auth/authentication-flows.test.ts:275**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/auth/authentication-flows.test.ts:289**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/auth/authentication-flows.test.ts:303**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/auth/authentication-flows.test.ts:317**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/auth/authentication-flows.test.ts:334**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/auth/authentication-flows.test.ts:348**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/auth/authentication-flows.test.ts:362**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/auth/authentication-flows.test.ts:378**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/auth/authentication-flows.test.ts:392**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/database/schema-sync.test.ts:39**
- ❌ Table `pg_tables` does not exist
- Code: `FROM pg_tables`

**tests/integration/database/schema-sync.test.ts:52**
- ❌ Table `pg_tables` does not exist
- Code: `FROM pg_tables`

**tests/integration/database/schema-sync.test.ts:85**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/database/schema-sync.test.ts:108**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/database/schema-sync.test.ts:137**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.table_constraints AS tc`

**tests/integration/database/schema-sync.test.ts:138**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.key_column_usage AS kcu`

**tests/integration/database/schema-sync.test.ts:156**
- ❌ Table `pg_indexes` does not exist
- Code: `FROM pg_indexes`

**tests/integration/database/schema-sync.test.ts:170**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.table_constraints tc`

**tests/integration/financial/calculation-accuracy.test.ts:44**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:62**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:84**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/financial/calculation-accuracy.test.ts:103**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:121**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:144**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:165**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:190**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/financial/calculation-accuracy.test.ts:204**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:228**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:248**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:270**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:292**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:315**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:330**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:352**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:370**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:388**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/financial/calculation-accuracy.test.ts:407**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:433**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.table_constraints AS tc`

**tests/integration/financial/calculation-accuracy.test.ts:434**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.key_column_usage AS kcu`

**tests/integration/financial/calculation-accuracy.test.ts:436**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.constraint_column_usage AS ccu`

**tests/integration/financial/calculation-accuracy.test.ts:459**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.table_constraints AS tc`

**tests/integration/financial/calculation-accuracy.test.ts:460**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.key_column_usage AS kcu`

**tests/integration/financial/calculation-accuracy.test.ts:462**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.constraint_column_usage AS ccu`

**tests/integration/financial/calculation-accuracy.test.ts:481**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/financial/calculation-accuracy.test.ts:496**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/security/multi-tenant-isolation.test.ts:44**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/security/multi-tenant-isolation.test.ts:62**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/security/multi-tenant-isolation.test.ts:74**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/security/multi-tenant-isolation.test.ts:90**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/security/multi-tenant-isolation.test.ts:102**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/security/multi-tenant-isolation.test.ts:114**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/security/multi-tenant-isolation.test.ts:130**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/security/multi-tenant-isolation.test.ts:143**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/security/multi-tenant-isolation.test.ts:160**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/security/multi-tenant-isolation.test.ts:173**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/security/multi-tenant-isolation.test.ts:188**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/security/multi-tenant-isolation.test.ts:202**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/security/multi-tenant-isolation.test.ts:219**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/security/multi-tenant-isolation.test.ts:233**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/security/multi-tenant-isolation.test.ts:249**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/security/multi-tenant-isolation.test.ts:261**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/security/multi-tenant-isolation.test.ts:277**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/security/multi-tenant-isolation.test.ts:289**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**tests/integration/security/multi-tenant-isolation.test.ts:303**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**tests/integration/security/multi-tenant-isolation.test.ts:317**
- ❌ Table `portal` does not exist
- Code: `it('should have foreign keys from portal data to clients', async () => {`

**tests/integration/security/multi-tenant-isolation.test.ts:331**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.table_constraints AS tc`

**tests/integration/security/multi-tenant-isolation.test.ts:332**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.key_column_usage AS kcu`

**tests/integration/security/multi-tenant-isolation.test.ts:334**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.constraint_column_usage AS ccu`

**tests/integration/security/multi-tenant-isolation.test.ts:357**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/EXECUTE-RLS-NOW.sql:28**
- ❌ Table `invoice_line_items` does not exist
- Code: `ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;`

**scripts/EXECUTE-RLS-NOW.sql:396**
- ❌ Table `pg_tables` does not exist
- Code: `FROM pg_tables`

**scripts/EXECUTE-RLS-NOW.sql:411**
- ❌ Table `pg_policies` does not exist
- Code: `FROM pg_policies`

**scripts/EXECUTE-RLS-NOW.sql:421**
- ❌ Table `pg_policies` does not exist
- Code: `FROM pg_policies`

**scripts/EXECUTE-RLS-NOW.sql:465**
- ❌ Table `invoice_line_items` does not exist
- Code: `ALTER TABLE invoice_line_items DISABLE ROW LEVEL SECURITY;`

**scripts/accessibility-audit.ts:296**
- ❌ Table `h1` does not exist
- Code: `markdown += `// BEFORE: Skips from h1 to h3\n`;`

**scripts/analyze-database.ts:58**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.tables`

**scripts/analyze-database.ts:79**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.table_constraints AS tc`

**scripts/analyze-database.ts:80**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.key_column_usage AS kcu`

**scripts/analyze-database.ts:82**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.constraint_column_usage AS ccu`

**scripts/analyze-database.ts:87**
- ❌ Table `pg_indexes` does not exist
- Code: `SELECT 1 FROM pg_indexes`

**scripts/audit/wcag-audit.ts:254**
- ❌ Table `globals` does not exist
- Code: `message: 'Hardcoded Tailwind color detected. Use semantic CSS classes from globals.css for WCAG compliance.',`

**scripts/audit-console-errors.ts:286**
- ❌ Table `error` does not exist
- Code: `// Extract pattern from error`

**scripts/audit-console-errors.ts:504**
- ❌ Table `project` does not exist
- 💡 Did you mean 'projects'?
- Code: `// Go up one level from project root to find docs folder`

**scripts/backfill-hybrid-skus.ts:49**
- ❌ Table `sku_full` does not exist
- Code: `// In production, you'd extract materials from sku_full or other fields`

**scripts/check-all-remaining-tables.ts:17**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/check-crm-tables.ts:11**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/check-db-tables.ts:9**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.tables`

**scripts/check-partner-contacts.ts:7**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/check-partner-performance-all-fields.ts:7**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/check-partner-performance-schema.ts:7**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/check-partner-performance.ts:6**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/check-partners-fields.ts:7**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/check-perf-fields.ts:7**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/check-schema-sync.ts:9**
- ❌ Table `propagating` does not exist
- Code: `* - Prevent type errors from propagating to runtime`

**scripts/check-schema-sync.ts:49**
- ❌ Table `database` does not exist
- Code: `// Get all tables from database`

**scripts/check-schema-sync.ts:52**
- ❌ Table `pg_tables` does not exist
- Code: `FROM pg_tables`

**scripts/check-table-counts.sql:11**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.tables`

**scripts/check-tasks-detail.ts:7**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/check-tasks-table.ts:7**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/clean-test-data.ts:6**
- ❌ Table `database` does not exist
- Code: `* Removes all test data from database`

**scripts/clean-test-data.ts:20**
- ❌ Table `payment` does not exist
- 💡 Did you mean 'payments'?
- Code: `const deletedPayments = await prisma.payment.deleteMany({`

**scripts/clean-test-data.ts:26**
- ❌ Table `invoice` does not exist
- 💡 Did you mean 'invoices'?
- Code: `const deletedInvoices = await prisma.invoice.deleteMany({`

**scripts/clean-test-data.ts:32**
- ❌ Table `order` does not exist
- 💡 Did you mean 'orders'?
- Code: `const deletedOrders = await prisma.order.deleteMany({`

**scripts/clean-test-data.ts:38**
- ❌ Table `product` does not exist
- 💡 Did you mean 'products'?
- Code: `const deletedProducts = await prisma.product.deleteMany({`

**scripts/clean-test-data.ts:44**
- ❌ Table `project` does not exist
- 💡 Did you mean 'projects'?
- Code: `const deletedProjects = await prisma.project.deleteMany({`

**scripts/clean-test-data.ts:50**
- ❌ Table `task` does not exist
- 💡 Did you mean 'tasks'?
- Code: `const deletedTasks = await prisma.task.deleteMany({`

**scripts/clean-test-data.ts:56**
- ❌ Table `contact` does not exist
- 💡 Did you mean 'contacts'?
- Code: `const deletedContacts = await prisma.contact.deleteMany({`

**scripts/clean-test-data.ts:62**
- ❌ Table `lead` does not exist
- 💡 Did you mean 'leads'?
- Code: `const deletedLeads = await prisma.lead.deleteMany({`

**scripts/clean-test-data.ts:74**
- ❌ Table `client` does not exist
- 💡 Did you mean 'clients'?
- Code: `const deletedClients = await prisma.client.deleteMany({`

**scripts/create-test-users-in-supabase.ts:105**
- ❌ Table `auth` does not exist
- Code: `// Get the user ID from auth`

**scripts/enable-realtime-all-tables.sql:36**
- ❌ Table `auth` does not exist
- Code: `inspector_name = (SELECT email FROM auth.users WHERE id = auth.uid())`

**scripts/enable-realtime-all-tables.sql:88**
- ❌ Table `pg_publication_tables` does not exist
- Code: `FROM pg_publication_tables`

**scripts/enable-realtime-all-tables.sql:89**
- ❌ Table `pg_publication` does not exist
- Code: `JOIN pg_publication ON pg_publication_tables.pubname = pg_publication.pubname`

**scripts/enable-realtime-production-orders.sql:18**
- ❌ Table `to` does not exist
- Code: `-- Join to orders table to check customer_id`

**scripts/enable-realtime-production-orders.sql:36**
- ❌ Table `pg_publication_tables` does not exist
- Code: `FROM pg_publication_tables`

**scripts/enable-realtime-production-orders.sql:37**
- ❌ Table `pg_publication` does not exist
- Code: `JOIN pg_publication ON pg_publication_tables.pubname = pg_publication.pubname`

**scripts/enable-rls-policies.sql:22**
- ❌ Table `invoice_line_items` does not exist
- Code: `ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;`

**scripts/enable-rls-policies.sql:488**
- ❌ Table `pg_tables` does not exist
- Code: `FROM pg_tables`

**scripts/enable-rls-policies.sql:507**
- ❌ Table `pg_policies` does not exist
- Code: `FROM pg_policies`

**scripts/fix-base-sku-underscores.ts:52**
- ❌ Table `the` does not exist
- Code: `// Remove all underscores from the SKU`

**scripts/run-overnight-tests.ts:425**
- ❌ Table `message` does not exist
- Code: `// Extract pattern from message`

**scripts/run-overnight-tests.ts:447**
- ❌ Table `groups` does not exist
- Code: `// Create patterns from groups with 2+ occurrences`

**scripts/run-overnight-tests.ts:588**
- ❌ Table `overnight` does not exist
- Code: `await execAsync('git commit -m "checkpoint: Before automated fixes from overnight testing"', { cwd: PROJECT_ROOT });`

**scripts/seed/seed-customer-journeys.ts:4**
- ❌ Table `Contact` does not exist
- 💡 Did you mean 'contacts'?
- Code: `* Seeds realistic customer journeys from Contact → Lead → Customer → Project → Order → Production → Shipment → Invoice → Payment`

**scripts/seed/utils/helpers.ts:87**
- ❌ Table `array` does not exist
- Code: `* Random element from array`

**scripts/seed/utils/helpers.ts:94**
- ❌ Table `array` does not exist
- Code: `* Random elements from array (multiple)`

**scripts/seed-notifications.sql:44**
- ❌ Table `public` does not exist
- Code: `FROM public.notifications`

**scripts/seed-playwright-test-data.ts:162**
- ❌ Table `now` does not exist
- Code: `estimated_completion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now`

**scripts/seed-portal-test-data.ts:375**
- ❌ Table `factory` does not exist
- Code: `description: 'Package picked up from factory',`

**scripts/seed-realistic-data-fixed.sql:78**
- ❌ Table `the` does not exist
- Code: `-- Note: This requires matching customer IDs from the customers table`

**scripts/seed-realistic-data.sql:77**
- ❌ Table `the` does not exist
- Code: `-- Note: This requires matching customer IDs from the customers table`

**scripts/table-card-layout-audit.ts:234**
- ❌ Table `stacking` does not exist
- Code: `/* Prevent table cells from stacking */`

**scripts/test-functional-all.ts:17**
- ❌ Table `ALL` does not exist
- 💡 Did you mean 'deals'?
- Code: `* 2. Compile ALL errors from ALL modules`

**scripts/test-functional-crm.ts:15**
- ❌ Table `correct` does not exist
- Code: `* - Data is displayed from correct sources`

**scripts/tests/critical/api-coverage.ts:162**
- ❌ Table `test` does not exist
- 💡 Did you mean 'items'?
- Code: `// Other errors might be OK (e.g., validation errors from test input)`

**scripts/tests/critical/auth-security.ts:8**
- ❌ Table `non` does not exist
- Code: `* - Admin routes protected from non-admins`

**scripts/tests/critical/database-integrity.ts:131**
- ❌ Table `information_schema` does not exist
- Code: `SELECT FROM information_schema.tables`

**scripts/tests/critical/database-integrity.ts:147**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/tests/critical/database-integrity.ts:166**
- ❌ Table `Prisma` does not exist
- Code: `// Expected tables from Prisma schema`

**scripts/tests/critical/database-integrity.ts:241**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.table_constraints AS tc`

**scripts/tests/critical/database-integrity.ts:242**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.key_column_usage AS kcu`

**scripts/tests/critical/database-integrity.ts:245**
- ❌ Table `information_schema` does not exist
- Code: `JOIN information_schema.constraint_column_usage AS ccu`

**scripts/tests/critical/database-integrity.ts:280**
- ❌ Table `auth` does not exist
- Code: `SELECT id FROM auth.users`

**scripts/tests/critical/database-integrity.ts:363**
- ❌ Table `pg_indexes` does not exist
- Code: `FROM pg_indexes`

**scripts/tests/critical/database-integrity.ts:410**
- ❌ Table `_prisma_migrations` does not exist
- Code: `FROM _prisma_migrations`

**scripts/validate-schema-references.ts:173**
- ❌ Table `table_name` does not exist
- Code: `// Pattern 1: Supabase queries - .from('table_name')`

**scripts/validate-schema-references.ts:189**
- ❌ Table `clauses` does not exist
- Code: `// Pattern 3: SQL FROM/JOIN clauses`

**scripts/validate-schema-references.ts:210**
- ❌ Table `context` does not exist
- 💡 Did you mean 'concepts'?
- Code: `// Try to infer table from context (previous .from() call)`

**scripts/validate-schema-references.ts:298**
- ❌ Table `context` does not exist
- 💡 Did you mean 'concepts'?
- Code: `* Try to infer table name from context`

**scripts/verify-all-test-tables.ts:20**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/verify-database-schema.ts:13**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/verify-database-schema.ts:28**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/verify-database-schema.ts:44**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/verify-database-schema.ts:59**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.columns`

**scripts/verify-database-schema.ts:74**
- ❌ Table `information_schema` does not exist
- Code: `FROM information_schema.tables`

**scripts/verify-realtime-tables.ts:19**
- ❌ Table `pg_publication_tables` does not exist
- Code: `FROM pg_publication_tables`

**scripts/verify-realtime-tables.ts:20**
- ❌ Table `pg_publication` does not exist
- Code: `JOIN pg_publication ON pg_publication_tables.pubname = pg_publication.pubname`

**scripts/verify-realtime-tables.ts:47**
- ❌ Table `pg_policies` does not exist
- Code: `FROM pg_policies`

**scripts/visual-layout-audit.ts:104**
- ❌ Table `the` does not exist
- Code: `// For each detail page type, find an actual record ID from the list`

### Invalid Column References (9)

**src/app/api/auth/refresh.ts:32**
- ❌ Column `auth_sessions.user_id` does not exist
- Code: `.eq('user_id', decoded.userId)`

**src/app/api/auth/refresh.ts:64**
- ❌ Column `auth_sessions.id` does not exist
- Code: `.eq('id', sessions.id);`

**src/app/api/auth/signin.ts:61**
- ❌ Column `magic_links.email` does not exist
- Code: `.eq('email', body.email)          .eq('used', false)`

**src/app/api/auth/signin.ts:61**
- ❌ Column `magic_links.used` does not exist
- Code: `.eq('email', body.email)          .eq('used', false)`

**src/app/api/auth/signin.ts:82**
- ❌ Column `magic_links.id` does not exist
- Code: `.eq('id', magicLink.id);`

**tests/helpers/security-test-helper.ts:285**
- ❌ Column `portal_module_settings.user_id` does not exist
- Code: `.eq('user_id', userId)`

**tests/helpers/security-test-helper.ts:293**
- ❌ Column `portal_configurations.user_id` does not exist
- Code: `.eq('user_id', userId)`

**tests/helpers/security-test-helper.ts:378**
- ❌ Column `portal_module_settings.user_id` does not exist
- Code: `await supabaseAdmin.from('portal_module_settings').delete().eq('user_id', userId);`

**tests/helpers/security-test-helper.ts:379**
- ❌ Column `portal_configurations.user_id` does not exist
- Code: `await supabaseAdmin.from('portal_configurations').delete().eq('user_id', userId);`

### Invalid Enum Values (2)

**src/lib/auth/AuthProvider.tsx:143**
- ❌ Enum value `user_type_enum.Employee` does not exist
- 💡 Valid values: employee, contractor, designer, manufacturer, finance, super_admin, customer
- Code: `const isAdmin = profile?.user_type === 'Super Admin' || profile?.user_type === 'Employee';`

**src/middleware.ts:116**
- ❌ Enum value `user_type_enum.admin` does not exist
- 💡 Valid values: employee, contractor, designer, manufacturer, finance, super_admin, customer
- Code: `const isAdmin = userData?.user_type === 'admin' || userData?.user_type === 'super_admin';`

---

## 📁 Violations by File

### src/__tests__/server/api/data-isolation.test.ts (1 violations)

- **Line 10:** table - `accessing`

### src/app/admin/dashboard/page.tsx (1 violations)

- **Line 34:** table - `approvals`

### src/app/admin/integrations/quickbooks/page.tsx (2 violations)

- **Line 80:** table - `QuickBooks`
- **Line 93:** table - `QuickBooks`

### src/app/admin/roles/page.tsx (1 violations)

- **Line 125:** table - `this`
  - Did you mean 'items'?

### src/app/api/auth/dev-login/route.ts (1 violations)

- **Line 15:** table - `request`

### src/app/api/auth/google/callback/route.ts (3 violations)

- **Line 4:** table - `Google`
- **Line 15:** table - `OAuth`
- **Line 51:** table - `Google`

### src/app/api/auth/logout/route.ts (1 violations)

- **Line 40:** table - `Supabase`

### src/app/api/auth/portal-test-login/route.ts (1 violations)

- **Line 56:** table - `the`

### src/app/api/auth/refresh.ts (4 violations)

- **Line 31:** table - `auth_sessions`
- **Line 32:** column - `auth_sessions.user_id`
- **Line 60:** table - `auth_sessions`
- **Line 64:** column - `auth_sessions.id`

### src/app/api/auth/signin.ts (7 violations)

- **Line 59:** table - `magic_links`
- **Line 61:** column - `magic_links.email`
- **Line 61:** column - `magic_links.used`
- **Line 80:** table - `magic_links`
- **Line 82:** column - `magic_links.id`
- **Line 145:** table - `auth_sessions`
- **Line 169:** table - `auth_audit_logs`

### src/app/api/invoices/[id]/pdf/route.tsx (2 violations)

- **Line 71:** table - `line`
- **Line 92:** table - `settings`

### src/app/api/push/subscribe/route.ts (2 violations)

- **Line 7:** table - `Supabase`
- **Line 24:** table - `pushSubscription`
  - Did you mean 'push_subscriptions'?

### src/app/api/push/unsubscribe/route.ts (3 violations)

- **Line 7:** table - `Supabase`
- **Line 22:** table - `database`
- **Line 24:** table - `pushSubscription`
  - Did you mean 'push_subscriptions'?

### src/app/api/quickbooks/callback/route.ts (3 violations)

- **Line 8:** table - `QuickBooks`
- **Line 14:** table - `QuickBooks`
- **Line 100:** table - `QuickBooks`

### src/app/api/quickbooks/webhook/route.ts (10 violations)

- **Line 9:** table - `QuickBooks`
- **Line 54:** table - `QuickBooks`
- **Line 89:** table - `QuickBooks`
- **Line 113:** table - `QuickBooks`
- **Line 121:** table - `QuickBooks`
- **Line 156:** table - `QuickBooks`
- **Line 170:** table - `QuickBooks`
- **Line 178:** table - `QuickBooks`
- **Line 213:** table - `QuickBooks`
- **Line 229:** table - `QuickBooks`

### src/app/auth/callback/route.ts (4 violations)

- **Line 20:** table - `dev`
  - Did you mean 'deals'?
- **Line 73:** table - `Supabase`
- **Line 139:** table - `using`
  - Did you mean 'users'?
- **Line 155:** table - `Supabase`

### src/app/auth/employee/page-client.tsx (2 violations)

- **Line 33:** table - `URL`
  - Did you mean 'users'?
- **Line 50:** table - `limn`

### src/app/crm/contacts/page.tsx (1 violations)

- **Line 113:** table - `selected`

### src/app/crm/projects/page.tsx (7 violations)

- **Line 352:** table - `collection`
  - Did you mean 'collections'?
- **Line 354:** table - `IDs`
  - Did you mean 'items'?
- **Line 656:** table - `all`
  - Did you mean 'deals'?
- **Line 1457:** table - `API`
- **Line 1606:** table - `project`
  - Did you mean 'projects'?
- **Line 1618:** table - `base`
  - Did you mean 'tasks'?
- **Line 1698:** table - `IDs`
  - Did you mean 'items'?

### src/app/dashboards/shipping/page.tsx (1 violations)

- **Line 185:** table - `ship`

### src/app/design/projects/page.tsx (1 violations)

- **Line 206:** table - `concept`
  - Did you mean 'concepts'?

### src/app/documents/[id]/page.tsx (1 violations)

- **Line 100:** table - `file`

### src/app/financials/invoices/[id]/page.tsx (1 violations)

- **Line 135:** table - `first`

### src/app/financials/payments/[id]/page.tsx (1 violations)

- **Line 127:** table - `payment`
  - Did you mean 'payments'?

### src/app/portal/customer/page.tsx (2 violations)

- **Line 23:** table - `designer`
  - Did you mean 'designers'?
- **Line 39:** table - `portal`

### src/app/portal/customer/shipping/page.tsx (1 violations)

- **Line 243:** table - `the`

### src/app/portal/designer/layout.tsx (1 violations)

- **Line 37:** table - `tRPC`

### src/app/portal/designer/page.tsx (1 violations)

- **Line 34:** table - `portal`

### src/app/portal/factory/layout.tsx (1 violations)

- **Line 38:** table - `tRPC`

### src/app/portal/factory/page.tsx (1 violations)

- **Line 36:** table - `portal`

### src/app/portal/layout.tsx (1 violations)

- **Line 40:** table - `tRPC`

### src/app/portal/qc/layout.tsx (1 violations)

- **Line 38:** table - `tRPC`

### src/app/portal/qc/page.tsx (1 violations)

- **Line 35:** table - `portal`

### src/app/production/orders/[id]/page.tsx (2 violations)

- **Line 678:** table - `production`
  - Did you mean 'products'?
- **Line 685:** table - `this`
  - Did you mean 'items'?

### src/app/production/prototypes/new/page.tsx (1 violations)

- **Line 242:** table - `catalog`

### src/app/production/prototypes/page.tsx (1 violations)

- **Line 254:** table - `concept`
  - Did you mean 'concepts'?

### src/app/production/shipments/page.tsx (2 violations)

- **Line 35:** table - `production`
  - Did you mean 'products'?
- **Line 181:** table - `production`
  - Did you mean 'products'?

### src/app/products/collections/[id]/page.tsx (1 violations)

- **Line 260:** table - `the`

### src/app/products/concepts/[id]/page.tsx (1 violations)

- **Line 328:** table - `this`
  - Did you mean 'items'?

### src/app/products/ordered-items/page.tsx (1 violations)

- **Line 499:** table - `API`

### src/app/share/page.tsx (2 violations)

- **Line 4:** table - `other`
  - Did you mean 'orders'?
- **Line 32:** table - `URL`
  - Did you mean 'users'?

### src/app/shipping/page.tsx (1 violations)

- **Line 174:** table - `production`
  - Did you mean 'products'?

### src/app/shipping/tracking/page.tsx (2 violations)

- **Line 144:** table - `database`
- **Line 155:** table - `SEKO`
  - Did you mean 'users'?

### src/app/tasks/my/page.tsx (1 violations)

- **Line 61:** table - `session`
  - Did you mean 'sessions'?

### src/app/tasks/templates/page.tsx (2 violations)

- **Line 9:** table - `template`
- **Line 13:** table - `the`

### src/app/terms/page.tsx (1 violations)

- **Line 87:** table - `use`
  - Did you mean 'users'?

### src/components/DataFreshnessIndicator.tsx (1 violations)

- **Line 4:** table - `cache`

### src/components/ServiceWorkerUpdateManager.tsx (3 violations)

- **Line 106:** table - `service`
- **Line 119:** table - `service`
- **Line 122:** table - `service`

### src/components/SmartInstallPrompt.tsx (1 violations)

- **Line 72:** table - `localStorage`

### src/components/TaskActivities.tsx (1 violations)

- **Line 63:** table - `auth`

### src/components/TaskAdvancedFilters.tsx (1 violations)

- **Line 149:** table - `APIs`
  - Did you mean 'tasks'?

### src/components/TaskAssignedUsers.tsx (2 violations)

- **Line 81:** table - `the`
- **Line 248:** table - `Task`
  - Did you mean 'tasks'?

### src/components/TaskAttachments.tsx (2 violations)

- **Line 68:** table - `auth`
- **Line 218:** table - `progress`

### src/components/TaskBulkOperations.tsx (1 violations)

- **Line 87:** table - `auth`

### src/components/TaskCreateForm.tsx (1 violations)

- **Line 51:** table - `auth`

### src/components/TaskDependencies.tsx (2 violations)

- **Line 110:** table - `API`
- **Line 175:** table - `the`

### src/components/TaskEntityLinks.tsx (1 violations)

- **Line 80:** table - `auth`

### src/components/TaskNotifications.tsx (2 violations)

- **Line 79:** table - `auth`
- **Line 82:** table - `API`

### src/components/TaskTimeTracking.tsx (2 violations)

- **Line 72:** table - `auth`
- **Line 215:** table - `the`

### src/components/admin/ApprovalDashboard.tsx (1 violations)

- **Line 103:** table - `list`

### src/components/admin/UserManagementPanel.tsx (1 violations)

- **Line 393:** table - `the`

### src/components/catalog/CatalogDocumentsTab.tsx (1 violations)

- **Line 15:** table - `Design`
  - Did you mean 'designers'?

### src/components/common/Breadcrumbs.tsx (1 violations)

- **Line 58:** table - `global`

### src/components/common/DataTable.tsx (1 violations)

- **Line 66:** table - `object`

### src/components/common/EmptyState.tsx (1 violations)

- **Line 29:** table - `lucide`

### src/components/common/FormDialog.tsx (1 violations)

- **Line 233:** table - `onSubmit`

### src/components/common/LoadingState.tsx (1 violations)

- **Line 24:** table - `globals`

### src/components/common/StatusBadge.tsx (3 violations)

- **Line 90:** table - `status`
  - Did you mean 'tasks'?
- **Line 98:** table - `priority`
- **Line 106:** table - `department`

### src/components/crm/CRMNotifications.tsx (1 violations)

- **Line 582:** table - `Meeting`

### src/components/crm/CRMTagsManager.tsx (1 violations)

- **Line 445:** table - `predefined`

### src/components/crm/CRMTaskIntegration.tsx (1 violations)

- **Line 357:** table - `the`

### src/components/dashboards/CustomDashboardBuilder.tsx (1 violations)

- **Line 422:** table - `the`

### src/components/dashboards/DashboardComparisonView.tsx (1 violations)

- **Line 231:** table - `different`

### src/components/furniture/DimensionDisplay.tsx (1 violations)

- **Line 83:** table - `field`

### src/components/providers/ThemeProvider.tsx (1 violations)

- **Line 29:** table - `localStorage`

### src/components/shop-drawings/ApprovalStatus.tsx (1 violations)

- **Line 180:** table - `one`

### src/components/shop-drawings/VersionTimeline.tsx (1 violations)

- **Line 55:** table - `bytes`
  - Did you mean 'items'?

### src/components/ui/command-palette.tsx (3 violations)

- **Line 83:** table - `paginated`
- **Line 180:** table - `keyboard`
- **Line 224:** table - `localStorage`

### src/components/ui/delete-confirm-dialog.tsx (1 violations)

- **Line 89:** table - `the`

### src/hooks/useAdaptiveCaching.ts (1 violations)

- **Line 62:** table - `browser`

### src/hooks/useAuth.tsx (1 violations)

- **Line 9:** table - `the`

### src/hooks/useOptimisticUpdate.ts (2 violations)

- **Line 75:** table - `server`
- **Line 135:** table - `array`

### src/lib/api/client.tsx (1 violations)

- **Line 52:** table - `getting`

### src/lib/auth/AuthProvider.tsx (1 violations)

- **Line 143:** enum - `user_type_enum.Employee`
  - Valid values: employee, contractor, designer, manufacturer, finance, super_admin, customer

### src/lib/auth/server.ts (2 violations)

- **Line 27:** table - `Supabase`
- **Line 47:** table - `database`

### src/lib/db.ts (4 violations)

- **Line 25:** table - `Prisma`
- **Line 74:** table - `Phase`
- **Line 559:** table - `the`
- **Line 2080:** table - `all`
  - Did you mean 'deals'?

### src/lib/google-drive/service-account-client.ts (5 violations)

- **Line 19:** table - `environment`
- **Line 113:** table - `browser`
- **Line 118:** table - `buffer`
- **Line 169:** table - `Google`
- **Line 187:** table - `Google`

### src/lib/oauth/google-drive-client.ts (6 violations)

- **Line 12:** table - `environment`
- **Line 65:** table - `OAuth`
- **Line 74:** table - `Google`
- **Line 89:** table - `initial`
- **Line 102:** table - `token`
- **Line 136:** table - `Google`

### src/lib/oauth/token-encryption.ts (1 violations)

- **Line 14:** table - `environment`

### src/lib/pwa/offline-analytics.ts (1 violations)

- **Line 225:** table - `localStorage`

### src/lib/pwa/offline-storage.ts (6 violations)

- **Line 193:** table - `offline`
- **Line 295:** table - `offline`
- **Line 317:** table - `server`
- **Line 524:** table - `sync`
- **Line 529:** table - `sync`
- **Line 581:** table - `queue`

### src/lib/pwa/push-notifications.ts (2 violations)

- **Line 335:** table - `server`
- **Line 338:** table - `server`

### src/lib/quickbooks/auth.ts (3 violations)

- **Line 22:** table - `database`
- **Line 57:** table - `database`
- **Line 79:** table - `database`

### src/lib/quickbooks/client.ts (5 violations)

- **Line 141:** table - `database`
- **Line 290:** table - `QuickBooks`
- **Line 336:** table - `QuickBooks`
- **Line 366:** table - `QuickBooks`
- **Line 401:** table - `QuickBooks`

### src/lib/security/csrf.ts (2 violations)

- **Line 26:** table - `request`
- **Line 32:** table - `header`
  - Did you mean 'leads'?

### src/lib/seko/client.ts (2 violations)

- **Line 5:** table - `multiple`
- **Line 123:** table - `multiple`

### src/lib/storage/google-drive-storage.ts (2 violations)

- **Line 101:** table - `Google`
- **Line 122:** table - `Google`

### src/lib/storage/hybrid-storage.ts (1 violations)

- **Line 78:** table - `filename`

### src/lib/storage/supabase-storage.ts (1 violations)

- **Line 68:** table - `Supabase`

### src/lib/storage.ts (2 violations)

- **Line 113:** table - `Supabase`
- **Line 260:** table - `Supabase`

### src/lib/supabase/server.ts (1 violations)

- **Line 21:** table - `a`

### src/lib/utils/dimension-validation.ts (1 violations)

- **Line 245:** table - `database`

### src/lib/utils/full-sku-generator.ts (8 violations)

- **Line 5:** table - `catalog`
- **Line 171:** table - `specifications`
- **Line 225:** table - `material`
  - Did you mean 'materials'?
- **Line 245:** table - `material`
  - Did you mean 'materials'?
- **Line 295:** table - `base`
  - Did you mean 'tasks'?
- **Line 302:** table - `catalog`
- **Line 368:** table - `all`
  - Did you mean 'deals'?
- **Line 409:** table - `parts`
  - Did you mean 'partners'?

### src/lib/utils/pdf-export.ts (1 violations)

- **Line 34:** table - `HTML`
  - Did you mean 'items'?

### src/lib/utils/product-sku-generator.ts (4 violations)

- **Line 82:** table - `catalog`
- **Line 108:** table - `order`
  - Did you mean 'orders'?
- **Line 122:** table - `specifications`
- **Line 132:** table - `Object`

### src/lib/utils/project-sku-generator.ts (4 violations)

- **Line 15:** table - `client`
  - Did you mean 'clients'?
- **Line 45:** table - `project`
  - Did you mean 'projects'?
- **Line 95:** table - `last`
  - Did you mean 'leads'?
- **Line 149:** table - `last`
  - Did you mean 'leads'?

### src/lib/utils/unit-conversion.ts (1 violations)

- **Line 35:** table - `a`

### src/middleware/auth.ts (2 violations)

- **Line 60:** table - `request`
- **Line 66:** table - `cookie`

### src/middleware.ts (1 violations)

- **Line 116:** enum - `user_type_enum.admin`
  - Valid values: employee, contractor, designer, manufacturer, finance, super_admin, customer

### src/modules/dashboard/DashboardPage.tsx (1 violations)

- **Line 81:** table - `last`
  - Did you mean 'leads'?

### src/server/api/routers/admin.ts (1 violations)

- **Line 662:** table - `a`

### src/server/api/routers/analytics.ts (3 violations)

- **Line 55:** table - `paid`
- **Line 483:** table - `quality_defects`
- **Line 521:** table - `quality_defects`

### src/server/api/routers/catalog.ts (1 violations)

- **Line 253:** table - `base`
  - Did you mean 'tasks'?

### src/server/api/routers/dashboards.ts (4 violations)

- **Line 412:** table - `historical`
- **Line 439:** table - `historical`
- **Line 608:** table - `actual`
- **Line 1109:** table - `configuration`

### src/server/api/routers/documents.ts (2 violations)

- **Line 261:** table - `storage`
- **Line 264:** table - `database`

### src/server/api/routers/oauth.ts (2 violations)

- **Line 170:** table - `database`
- **Line 173:** table - `database`

### src/server/api/routers/orders.ts (3 violations)

- **Line 262:** table - `base`
  - Did you mean 'tasks'?
- **Line 333:** table - `completed`
- **Line 334:** table - `cancelled`

### src/server/api/routers/packing.ts (3 violations)

- **Line 5:** table - `production`
  - Did you mean 'products'?
- **Line 209:** table - `production`
  - Did you mean 'products'?
- **Line 290:** table - `production`
  - Did you mean 'products'?

### src/server/api/routers/portal.ts (7 violations)

- **Line 48:** table - `middleware`
- **Line 88:** table - `middleware`
- **Line 222:** table - `portal`
- **Line 340:** table - `through`
- **Line 362:** table - `through`
- **Line 809:** table - `order`
  - Did you mean 'orders'?
- **Line 1548:** table - `metadata`

### src/server/api/routers/production-invoices.ts (2 violations)

- **Line 458:** table - `all`
  - Did you mean 'deals'?
- **Line 461:** table - `first`

### src/server/api/routers/production-orders.ts (2 violations)

- **Line 93:** table - `project`
  - Did you mean 'projects'?
- **Line 153:** table - `project`
  - Did you mean 'projects'?

### src/server/api/routers/prototypes.ts (1 violations)

- **Line 1380:** table - `all`
  - Did you mean 'deals'?

### src/server/api/routers/quickbooks-sync.ts (1 violations)

- **Line 11:** table - `database`

### src/server/api/routers/shipping.ts (6 violations)

- **Line 72:** table - `SEKO`
  - Did you mean 'users'?
- **Line 104:** table - `SEKO`
  - Did you mean 'users'?
- **Line 310:** table - `SEKO`
  - Did you mean 'users'?
- **Line 485:** table - `SEKO`
  - Did you mean 'users'?
- **Line 506:** table - `database`
- **Line 507:** table - `SEKO`
  - Did you mean 'users'?

### src/server/api/routers/shop-drawings.ts (4 violations)

- **Line 260:** table - `user`
  - Did you mean 'users'?
- **Line 341:** table - `user`
  - Did you mean 'users'?
- **Line 403:** table - `user`
  - Did you mean 'users'?
- **Line 498:** table - `user`
  - Did you mean 'users'?

### src/server/api/routers/storage.ts (2 violations)

- **Line 224:** table - `storage`
- **Line 232:** table - `database`

### src/server/api/routers/tasks.ts (1 violations)

- **Line 437:** table - `all`
  - Did you mean 'deals'?

### src/server/api/routers/user-profile.ts (1 violations)

- **Line 185:** table - `avatars`

### src/server/api/trpc/context.ts (3 violations)

- **Line 49:** table - `the`
- **Line 77:** table - `Supabase`
- **Line 85:** table - `session`
  - Did you mean 'sessions'?

### src/services/auth/auth.service.ts (2 violations)

- **Line 74:** table - `pending_sign_ups`
- **Line 86:** table - `pending_sign_ups`

### tests/00-schema-drift-detection.spec.ts (8 violations)

- **Line 45:** table - `both`
- **Line 48:** table - `information_schema`
- **Line 123:** table - `information_schema`
- **Line 156:** table - `information_schema`
- **Line 182:** table - `information_schema`
- **Line 183:** table - `information_schema`
- **Line 186:** table - `information_schema`
- **Line 228:** table - `pg_indexes`

### tests/01-authentication.spec.ts (1 violations)

- **Line 17:** table - `login`

### tests/05-database.spec.ts (1 violations)

- **Line 16:** table - `database`

### tests/06-permissions.spec.ts (1 violations)

- **Line 26:** table - `one`

### tests/12-trpc-api.spec.ts (1 violations)

- **Line 553:** table - `storage`

### tests/14-security.spec.ts (1 violations)

- **Line 343:** table - `different`

### tests/15-customer-portal.spec.ts (3 violations)

- **Line 388:** table - `API`
- **Line 392:** table - `UI`
- **Line 396:** table - `API`

### tests/18-pwa-mobile.spec.ts (4 violations)

- **Line 7:** table - `file`
- **Line 144:** table - `file`
- **Line 169:** table - `file`
- **Line 201:** table - `file`

### tests/19-responsive-design.spec.ts (2 violations)

- **Line 89:** table - `domcontentloaded`
- **Line 134:** table - `domcontentloaded`

### tests/20-gap-analysis.spec.ts (5 violations)

- **Line 75:** table - `file`
- **Line 421:** table - `auto`
- **Line 449:** table - `real`
  - Did you mean 'deals'?
- **Line 475:** table - `advanced`
- **Line 501:** table - `customization`

### tests/25-tasks-module.spec.ts (2 violations)

- **Line 234:** table - `kanban`
- **Line 252:** table - `kanban`

### tests/27-products-module.spec.ts (2 violations)

- **Line 820:** table - `product`
  - Did you mean 'products'?
- **Line 846:** table - `product`
  - Did you mean 'products'?

### tests/28-dashboards-module.spec.ts (3 violations)

- **Line 576:** table - `dashboard`
- **Line 596:** table - `dashboard`
- **Line 614:** table - `dashboard`

### tests/29-data-persistence-e2e.spec.ts (2 violations)

- **Line 94:** table - `URL`
  - Did you mean 'users'?
- **Line 157:** table - `database`

### tests/30-crm-contacts-comprehensive.spec.ts (2 violations)

- **Line 414:** table - `database`
- **Line 437:** table - `database`

### tests/30-security-data-isolation.spec.ts (1 violations)

- **Line 178:** table - `portal`

### tests/31-crm-customers-comprehensive.spec.ts (2 violations)

- **Line 283:** table - `database`
- **Line 301:** table - `database`

### tests/32-crm-leads-comprehensive.spec.ts (1 violations)

- **Line 189:** table - `database`

### tests/33-production-orders-comprehensive.spec.ts (2 violations)

- **Line 317:** table - `database`
- **Line 335:** table - `database`

### tests/40-customer-portal-comprehensive.spec.ts (3 violations)

- **Line 45:** table - `accessing`
- **Line 51:** table - `customer`
  - Did you mean 'customers'?
- **Line 161:** table - `database`

### tests/41-designer-portal-comprehensive.spec.ts (1 violations)

- **Line 33:** table - `accessing`

### tests/42-factory-portal-comprehensive.spec.ts (1 violations)

- **Line 34:** table - `accessing`

### tests/43-qc-portal-comprehensive.spec.ts (1 violations)

- **Line 36:** table - `accessing`

### tests/50-products-comprehensive.spec.ts (5 violations)

- **Line 77:** table - `database`
- **Line 78:** table - `furniture_catalog`
- **Line 126:** table - `furniture_concepts`
- **Line 173:** table - `furniture_prototypes`
- **Line 210:** table - `furniture_collections`

### tests/55-partners-comprehensive.spec.ts (13 violations)

- **Line 92:** table - `partner_designers`
- **Line 107:** table - `partner_designers`
- **Line 123:** table - `partner_designers`
- **Line 137:** table - `partner_designers`
- **Line 151:** table - `partner_designers`
- **Line 236:** table - `partner_factories`
- **Line 251:** table - `partner_factories`
- **Line 267:** table - `partner_factories`
- **Line 281:** table - `partner_factories`
- **Line 295:** table - `partner_factories`
- **Line 309:** table - `partner_factories`
- **Line 340:** table - `partner_designers`
- **Line 354:** table - `partner_designers`

### tests/70-api-admin.spec.ts (2 violations)

- **Line 101:** table - `the`
- **Line 567:** table - `user`
  - Did you mean 'users'?

### tests/ai-testing/page-scanner.ts (2 violations)

- **Line 110:** table - `route`
- **Line 159:** table - `tRPC`

### tests/ai-testing/schema-validator.ts (4 violations)

- **Line 51:** table - `Prisma`
- **Line 66:** table - `database`
- **Line 73:** table - `pg_tables`
- **Line 159:** table - `Prisma`

### tests/ai-testing/test-orchestrator.ts (1 violations)

- **Line 118:** table - `analysis`

### tests/api/all-routers.test.ts (21 violations)

- **Line 72:** table - `information_schema`
- **Line 90:** table - `information_schema`
- **Line 104:** table - `information_schema`
- **Line 117:** table - `information_schema`
- **Line 129:** table - `information_schema`
- **Line 141:** table - `information_schema`
- **Line 156:** table - `information_schema`
- **Line 168:** table - `information_schema`
- **Line 180:** table - `information_schema`
- **Line 192:** table - `information_schema`
- **Line 206:** table - `information_schema`
- **Line 219:** table - `information_schema`
- **Line 237:** table - `information_schema`
- **Line 252:** table - `information_schema`
- **Line 267:** table - `information_schema`
- **Line 279:** table - `information_schema`
- **Line 293:** table - `information_schema`
- **Line 305:** table - `information_schema`
- **Line 323:** table - `information_schema`
- **Line 341:** table - `information_schema`
- **Line 356:** table - `information_schema`

### tests/api/routers/auth.test.ts (7 violations)

- **Line 38:** table - `information_schema`
- **Line 52:** table - `information_schema`
- **Line 66:** table - `information_schema`
- **Line 80:** table - `information_schema`
- **Line 98:** table - `information_schema`
- **Line 110:** table - `information_schema`
- **Line 124:** table - `information_schema`

### tests/api/routers/financial.test.ts (16 violations)

- **Line 38:** table - `information_schema`
- **Line 54:** table - `information_schema`
- **Line 77:** table - `information_schema`
- **Line 97:** table - `information_schema`
- **Line 111:** table - `information_schema`
- **Line 133:** table - `information_schema`
- **Line 151:** table - `information_schema`
- **Line 167:** table - `information_schema`
- **Line 186:** table - `information_schema`
- **Line 205:** table - `information_schema`
- **Line 215:** table - `information_schema`
- **Line 232:** table - `information_schema`
- **Line 248:** table - `information_schema`
- **Line 274:** table - `information_schema`
- **Line 275:** table - `information_schema`
- **Line 277:** table - `information_schema`

### tests/api/routers/portal.test.ts (13 violations)

- **Line 36:** table - `information_schema`
- **Line 50:** table - `information_schema`
- **Line 64:** table - `information_schema`
- **Line 80:** table - `information_schema`
- **Line 97:** table - `information_schema`
- **Line 114:** table - `information_schema`
- **Line 130:** table - `information_schema`
- **Line 142:** table - `information_schema`
- **Line 156:** table - `information_schema`
- **Line 170:** table - `information_schema`
- **Line 184:** table - `information_schema`
- **Line 198:** table - `information_schema`
- **Line 217:** table - `information_schema`

### tests/config/test-config.ts (1 violations)

- **Line 4:** table - `project`
  - Did you mean 'projects'?

### tests/e2e/auth/authenticated-flows.test.ts (2 violations)

- **Line 140:** table - `portal`
- **Line 149:** table - `admin`

### tests/helpers/auth-helper.ts (2 violations)

- **Line 25:** table - `file`
- **Line 85:** table - `file`

### tests/helpers/database-helper.ts (1 violations)

- **Line 162:** table - `database`

### tests/helpers/portal-auth-helper.ts (3 violations)

- **Line 54:** table - `file`
- **Line 74:** table - `FILE`
- **Line 115:** table - `API`

### tests/helpers/security-test-helper.ts (5 violations)

- **Line 35:** table - `first_name`
- **Line 285:** column - `portal_module_settings.user_id`
- **Line 293:** column - `portal_configurations.user_id`
- **Line 378:** column - `portal_module_settings.user_id`
- **Line 379:** column - `portal_configurations.user_id`

### tests/integration/auth/authentication-flows.test.ts (23 violations)

- **Line 43:** table - `information_schema`
- **Line 55:** table - `information_schema`
- **Line 69:** table - `information_schema`
- **Line 84:** table - `information_schema`
- **Line 98:** table - `information_schema`
- **Line 115:** table - `information_schema`
- **Line 138:** table - `information_schema`
- **Line 158:** table - `information_schema`
- **Line 174:** table - `information_schema`
- **Line 187:** table - `information_schema`
- **Line 207:** table - `information_schema`
- **Line 225:** table - `information_schema`
- **Line 239:** table - `information_schema`
- **Line 251:** table - `information_schema`
- **Line 275:** table - `information_schema`
- **Line 289:** table - `information_schema`
- **Line 303:** table - `information_schema`
- **Line 317:** table - `information_schema`
- **Line 334:** table - `information_schema`
- **Line 348:** table - `information_schema`
- **Line 362:** table - `information_schema`
- **Line 378:** table - `information_schema`
- **Line 392:** table - `information_schema`

### tests/integration/database/schema-sync.test.ts (8 violations)

- **Line 39:** table - `pg_tables`
- **Line 52:** table - `pg_tables`
- **Line 85:** table - `information_schema`
- **Line 108:** table - `information_schema`
- **Line 137:** table - `information_schema`
- **Line 138:** table - `information_schema`
- **Line 156:** table - `pg_indexes`
- **Line 170:** table - `information_schema`

### tests/integration/financial/calculation-accuracy.test.ts (27 violations)

- **Line 44:** table - `information_schema`
- **Line 62:** table - `information_schema`
- **Line 84:** table - `information_schema`
- **Line 103:** table - `information_schema`
- **Line 121:** table - `information_schema`
- **Line 144:** table - `information_schema`
- **Line 165:** table - `information_schema`
- **Line 190:** table - `information_schema`
- **Line 204:** table - `information_schema`
- **Line 228:** table - `information_schema`
- **Line 248:** table - `information_schema`
- **Line 270:** table - `information_schema`
- **Line 292:** table - `information_schema`
- **Line 315:** table - `information_schema`
- **Line 330:** table - `information_schema`
- **Line 352:** table - `information_schema`
- **Line 370:** table - `information_schema`
- **Line 388:** table - `information_schema`
- **Line 407:** table - `information_schema`
- **Line 433:** table - `information_schema`
- **Line 434:** table - `information_schema`
- **Line 436:** table - `information_schema`
- **Line 459:** table - `information_schema`
- **Line 460:** table - `information_schema`
- **Line 462:** table - `information_schema`
- **Line 481:** table - `information_schema`
- **Line 496:** table - `information_schema`

### tests/integration/security/multi-tenant-isolation.test.ts (24 violations)

- **Line 44:** table - `information_schema`
- **Line 62:** table - `information_schema`
- **Line 74:** table - `information_schema`
- **Line 90:** table - `information_schema`
- **Line 102:** table - `information_schema`
- **Line 114:** table - `information_schema`
- **Line 130:** table - `information_schema`
- **Line 143:** table - `information_schema`
- **Line 160:** table - `information_schema`
- **Line 173:** table - `information_schema`
- **Line 188:** table - `information_schema`
- **Line 202:** table - `information_schema`
- **Line 219:** table - `information_schema`
- **Line 233:** table - `information_schema`
- **Line 249:** table - `information_schema`
- **Line 261:** table - `information_schema`
- **Line 277:** table - `information_schema`
- **Line 289:** table - `information_schema`
- **Line 303:** table - `information_schema`
- **Line 317:** table - `portal`
- **Line 331:** table - `information_schema`
- **Line 332:** table - `information_schema`
- **Line 334:** table - `information_schema`
- **Line 357:** table - `information_schema`

### scripts/EXECUTE-RLS-NOW.sql (5 violations)

- **Line 28:** table - `invoice_line_items`
- **Line 396:** table - `pg_tables`
- **Line 411:** table - `pg_policies`
- **Line 421:** table - `pg_policies`
- **Line 465:** table - `invoice_line_items`

### scripts/accessibility-audit.ts (1 violations)

- **Line 296:** table - `h1`

### scripts/analyze-database.ts (5 violations)

- **Line 58:** table - `information_schema`
- **Line 79:** table - `information_schema`
- **Line 80:** table - `information_schema`
- **Line 82:** table - `information_schema`
- **Line 87:** table - `pg_indexes`

### scripts/audit/wcag-audit.ts (1 violations)

- **Line 254:** table - `globals`

### scripts/audit-console-errors.ts (2 violations)

- **Line 286:** table - `error`
- **Line 504:** table - `project`
  - Did you mean 'projects'?

### scripts/backfill-hybrid-skus.ts (1 violations)

- **Line 49:** table - `sku_full`

### scripts/check-all-remaining-tables.ts (1 violations)

- **Line 17:** table - `information_schema`

### scripts/check-crm-tables.ts (1 violations)

- **Line 11:** table - `information_schema`

### scripts/check-db-tables.ts (1 violations)

- **Line 9:** table - `information_schema`

### scripts/check-partner-contacts.ts (1 violations)

- **Line 7:** table - `information_schema`

### scripts/check-partner-performance-all-fields.ts (1 violations)

- **Line 7:** table - `information_schema`

### scripts/check-partner-performance-schema.ts (1 violations)

- **Line 7:** table - `information_schema`

### scripts/check-partner-performance.ts (1 violations)

- **Line 6:** table - `information_schema`

### scripts/check-partners-fields.ts (1 violations)

- **Line 7:** table - `information_schema`

### scripts/check-perf-fields.ts (1 violations)

- **Line 7:** table - `information_schema`

### scripts/check-schema-sync.ts (3 violations)

- **Line 9:** table - `propagating`
- **Line 49:** table - `database`
- **Line 52:** table - `pg_tables`

### scripts/check-table-counts.sql (1 violations)

- **Line 11:** table - `information_schema`

### scripts/check-tasks-detail.ts (1 violations)

- **Line 7:** table - `information_schema`

### scripts/check-tasks-table.ts (1 violations)

- **Line 7:** table - `information_schema`

### scripts/clean-test-data.ts (10 violations)

- **Line 6:** table - `database`
- **Line 20:** table - `payment`
  - Did you mean 'payments'?
- **Line 26:** table - `invoice`
  - Did you mean 'invoices'?
- **Line 32:** table - `order`
  - Did you mean 'orders'?
- **Line 38:** table - `product`
  - Did you mean 'products'?
- **Line 44:** table - `project`
  - Did you mean 'projects'?
- **Line 50:** table - `task`
  - Did you mean 'tasks'?
- **Line 56:** table - `contact`
  - Did you mean 'contacts'?
- **Line 62:** table - `lead`
  - Did you mean 'leads'?
- **Line 74:** table - `client`
  - Did you mean 'clients'?

### scripts/create-test-users-in-supabase.ts (1 violations)

- **Line 105:** table - `auth`

### scripts/enable-realtime-all-tables.sql (3 violations)

- **Line 36:** table - `auth`
- **Line 88:** table - `pg_publication_tables`
- **Line 89:** table - `pg_publication`

### scripts/enable-realtime-production-orders.sql (3 violations)

- **Line 18:** table - `to`
- **Line 36:** table - `pg_publication_tables`
- **Line 37:** table - `pg_publication`

### scripts/enable-rls-policies.sql (3 violations)

- **Line 22:** table - `invoice_line_items`
- **Line 488:** table - `pg_tables`
- **Line 507:** table - `pg_policies`

### scripts/fix-base-sku-underscores.ts (1 violations)

- **Line 52:** table - `the`

### scripts/run-overnight-tests.ts (3 violations)

- **Line 425:** table - `message`
- **Line 447:** table - `groups`
- **Line 588:** table - `overnight`

### scripts/seed/seed-customer-journeys.ts (1 violations)

- **Line 4:** table - `Contact`
  - Did you mean 'contacts'?

### scripts/seed/utils/helpers.ts (2 violations)

- **Line 87:** table - `array`
- **Line 94:** table - `array`

### scripts/seed-notifications.sql (1 violations)

- **Line 44:** table - `public`

### scripts/seed-playwright-test-data.ts (1 violations)

- **Line 162:** table - `now`

### scripts/seed-portal-test-data.ts (1 violations)

- **Line 375:** table - `factory`

### scripts/seed-realistic-data-fixed.sql (1 violations)

- **Line 78:** table - `the`

### scripts/seed-realistic-data.sql (1 violations)

- **Line 77:** table - `the`

### scripts/table-card-layout-audit.ts (1 violations)

- **Line 234:** table - `stacking`

### scripts/test-functional-all.ts (1 violations)

- **Line 17:** table - `ALL`
  - Did you mean 'deals'?

### scripts/test-functional-crm.ts (1 violations)

- **Line 15:** table - `correct`

### scripts/tests/critical/api-coverage.ts (1 violations)

- **Line 162:** table - `test`
  - Did you mean 'items'?

### scripts/tests/critical/auth-security.ts (1 violations)

- **Line 8:** table - `non`

### scripts/tests/critical/database-integrity.ts (9 violations)

- **Line 131:** table - `information_schema`
- **Line 147:** table - `information_schema`
- **Line 166:** table - `Prisma`
- **Line 241:** table - `information_schema`
- **Line 242:** table - `information_schema`
- **Line 245:** table - `information_schema`
- **Line 280:** table - `auth`
- **Line 363:** table - `pg_indexes`
- **Line 410:** table - `_prisma_migrations`

### scripts/validate-schema-references.ts (4 violations)

- **Line 173:** table - `table_name`
- **Line 189:** table - `clauses`
- **Line 210:** table - `context`
  - Did you mean 'concepts'?
- **Line 298:** table - `context`
  - Did you mean 'concepts'?

### scripts/verify-all-test-tables.ts (1 violations)

- **Line 20:** table - `information_schema`

### scripts/verify-database-schema.ts (5 violations)

- **Line 13:** table - `information_schema`
- **Line 28:** table - `information_schema`
- **Line 44:** table - `information_schema`
- **Line 59:** table - `information_schema`
- **Line 74:** table - `information_schema`

### scripts/verify-realtime-tables.ts (3 violations)

- **Line 19:** table - `pg_publication_tables`
- **Line 20:** table - `pg_publication`
- **Line 47:** table - `pg_policies`

### scripts/visual-layout-audit.ts (1 violations)

- **Line 104:** table - `the`

---

## 🔧 How to Fix

1. **Review each violation** listed above
2. **Check Prisma schema** for correct table/column names
3. **Update code** to use valid schema references
4. **Re-run validator** to verify fixes: `npx ts-node scripts/validate-schema-references.ts`

---

**Prepared by:** Schema Validator
**Date:** 2025-10-09T23:01:27.863Z
