# API Router Analysis Report

**Generated:** 10/3/2025, 8:37:02 AM

## Summary

- **Total Routers:** 30
- **Total Procedures:** 311
- **Missing Authentication:** 47
- **Dangerous Queries:** 80
- **Missing Validation:** 143

## Routers Overview

| Router | Procedures | Public | Protected |
|--------|------------|--------|----------|
| auth.ts | 2 | 2 | 0 |
| catalog.ts | 17 | 17 | 0 |
| clients.ts | 2 | 2 | 0 |
| crm.ts | 7 | 7 | 0 |
| design-briefs.ts | 6 | 0 | 6 |
| design-projects-router.ts | 6 | 0 | 6 |
| factoryReviews.ts | 12 | 12 | 0 |
| invoices.ts | 9 | 0 | 9 |
| mood-boards.ts | 9 | 1 | 8 |
| oauth.ts | 5 | 5 | 0 |
| order-items.ts | 5 | 5 | 0 |
| ordered-items-production.ts | 8 | 0 | 8 |
| orders.ts | 7 | 7 | 0 |
| packing.ts | 10 | 10 | 0 |
| partners.ts | 14 | 0 | 14 |
| payments.ts | 10 | 0 | 10 |
| portal.ts | 0 | 0 | 0 |
| production-invoices.ts | 9 | 9 | 0 |
| production-orders.ts | 7 | 7 | 0 |
| production-tracking.ts | 7 | 7 | 0 |
| products.ts | 20 | 20 | 0 |
| projects.ts | 4 | 4 | 0 |
| prototypes.ts | 61 | 61 | 0 |
| qc.ts | 18 | 18 | 0 |
| quickbooks-sync.ts | 5 | 5 | 0 |
| shipping.ts | 7 | 0 | 7 |
| shop-drawings.ts | 11 | 11 | 0 |
| storage.ts | 7 | 7 | 0 |
| tasks.ts | 23 | 23 | 0 |
| users.ts | 3 | 3 | 0 |

## ⚠️ Missing Authentication (47)

Public procedures in sensitive routers that may need authentication:

### orders.ts:110
- **Procedure:** `createWithAutoProject`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### orders.ts:173
- **Procedure:** `getFullDetails`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### orders.ts:216
- **Procedure:** `createWithItems`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### orders.ts:307
- **Procedure:** `updateStatus`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### orders.ts:375
- **Procedure:** `generateProjectSku`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### orders.ts:391
- **Procedure:** `getWithProductionDetails`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-invoices.ts:147
- **Procedure:** `getAll`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-invoices.ts:179
- **Procedure:** `getById`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-invoices.ts:205
- **Procedure:** `getByProductionOrder`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-invoices.ts:223
- **Procedure:** `recordPayment`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-invoices.ts:333
- **Procedure:** `update`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-invoices.ts:353
- **Procedure:** `cancel`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-invoices.ts:377
- **Procedure:** `getPaymentHistory`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-invoices.ts:391
- **Procedure:** `getOutstanding`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-invoices.ts:436
- **Procedure:** `createForOrder`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-orders.ts:211
- **Procedure:** `getAll`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-orders.ts:241
- **Procedure:** `getById`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-orders.ts:278
- **Procedure:** `create`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-orders.ts:320
- **Procedure:** `updateStatus`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-orders.ts:373
- **Procedure:** `update`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-orders.ts:408
- **Procedure:** `delete`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-orders.ts:432
- **Procedure:** `getByFactory`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-tracking.ts:66
- **Procedure:** `getDashboardStats`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-tracking.ts:149
- **Procedure:** `getProductionProgress`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-tracking.ts:202
- **Procedure:** `getMilestones`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-tracking.ts:216
- **Procedure:** `createMilestone`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-tracking.ts:234
- **Procedure:** `updateMilestone`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-tracking.ts:246
- **Procedure:** `deleteMilestone`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### production-tracking.ts:255
- **Procedure:** `createDefaultMilestones`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:20
- **Procedure:** `getAllInspections`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:96
- **Procedure:** `getInspectionById`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:170
- **Procedure:** `createInspection`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:220
- **Procedure:** `updateInspectionStatus`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:252
- **Procedure:** `getDefects`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:307
- **Procedure:** `addDefect`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:340
- **Procedure:** `updateDefect`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:371
- **Procedure:** `getPhotos`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:404
- **Procedure:** `uploadPhoto`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:450
- **Procedure:** `deletePhoto`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:470
- **Procedure:** `getComments`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:495
- **Procedure:** `addComment`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:543
- **Procedure:** `deleteComment`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:563
- **Procedure:** `getCheckpoints`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:581
- **Procedure:** `addCheckpoint`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:621
- **Procedure:** `updateCheckpoint`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:653
- **Procedure:** `getInspectionStats`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

### qc.ts:737
- **Procedure:** `getInspectionsByCatalogItem`
- **Issue:** Using `publicProcedure` in sensitive router
- **Recommendation:** Consider using `protectedProcedure` if authentication is required

## 🔴 Dangerous Queries (80)

### Medium Severity (80)

- **auth.ts:221** - Potential N+1 query: findMany without include
- **catalog.ts:366** - Potential N+1 query: findMany without include
- **catalog.ts:469** - Potential N+1 query: findMany without include
- **catalog.ts:558** - Potential N+1 query: findMany without include
- **catalog.ts:633** - Potential N+1 query: findMany without include
- **catalog.ts:677** - Potential N+1 query: findMany without include
- **crm.ts:53** - Potential N+1 query: findMany without include
- **crm.ts:170** - Potential N+1 query: findMany without include
- **crm.ts:192** - Potential N+1 query: findMany without include
- **crm.ts:199** - Potential N+1 query: findMany without include
- **crm.ts:277** - Potential N+1 query: findMany without include
- **design-briefs.ts:25** - Potential N+1 query: findMany without include
- **design-briefs.ts:35** - Potential N+1 query: findMany without include
- **design-projects-router.ts:25** - Potential N+1 query: findMany without include
- **invoices.ts:246** - Potential N+1 query: findMany without include
- **packing.ts:310** - Potential N+1 query: findMany without include
- **partners.ts:393** - Potential N+1 query: findMany without include
- **partners.ts:453** - Potential N+1 query: findMany without include
- **portal.ts:31** - Missing error handling for database operation
- **portal.ts:49** - Missing error handling for database operation
- **portal.ts:93** - Missing error handling for database operation
- **portal.ts:111** - Missing error handling for database operation
- **portal.ts:144** - Missing error handling for database operation
- **portal.ts:250** - Potential N+1 query: findMany without include
- **portal.ts:283** - Missing error handling for database operation
- **portal.ts:311** - Missing error handling for database operation
- **portal.ts:361** - Potential N+1 query: findMany without include
- **portal.ts:448** - Missing error handling for database operation
- **portal.ts:474** - Missing error handling for database operation
- **portal.ts:566** - Missing error handling for database operation
- **portal.ts:609** - Missing error handling for database operation
- **portal.ts:634** - Potential N+1 query: findMany without include
- **portal.ts:652** - Missing error handling for database operation
- **portal.ts:694** - Potential N+1 query: findMany without include
- **portal.ts:746** - Potential N+1 query: findMany without include
- **production-invoices.ts:159** - Potential N+1 query: findMany without include
- **production-invoices.ts:380** - Potential N+1 query: findMany without include
- **production-orders.ts:222** - Potential N+1 query: findMany without include
- **production-orders.ts:451** - Potential N+1 query: findMany without include
- **production-tracking.ts:207** - Potential N+1 query: findMany without include
- **products.ts:8** - Potential N+1 query: findMany without include
- **products.ts:8** - Missing error handling for database operation
- **products.ts:63** - Potential N+1 query: findMany without include
- **products.ts:63** - Missing error handling for database operation
- **products.ts:95** - Missing error handling for database operation
- **products.ts:114** - Missing error handling for database operation
- **products.ts:127** - Missing error handling for database operation
- **products.ts:134** - Potential N+1 query: findMany without include
- **products.ts:134** - Missing error handling for database operation
- **products.ts:143** - Missing error handling for database operation
- **products.ts:158** - Missing error handling for database operation
- **products.ts:172** - Missing error handling for database operation
- **products.ts:182** - Potential N+1 query: findMany without include
- **products.ts:182** - Missing error handling for database operation
- **products.ts:190** - Missing error handling for database operation
- **products.ts:258** - Missing error handling for database operation
- **products.ts:285** - Missing error handling for database operation
- **products.ts:295** - Missing error handling for database operation
- **products.ts:339** - Missing error handling for database operation
- **products.ts:378** - Missing error handling for database operation
- **products.ts:400** - Missing error handling for database operation
- **products.ts:405** - Potential N+1 query: findMany without include
- **products.ts:405** - Missing error handling for database operation
- **products.ts:415** - Missing error handling for database operation
- **products.ts:426** - Missing error handling for database operation
- **products.ts:450** - Potential N+1 query: findMany without include
- **products.ts:450** - Missing error handling for database operation
- **products.ts:503** - Missing error handling for database operation
- **products.ts:517** - Missing error handling for database operation
- **products.ts:529** - Missing error handling for database operation
- **products.ts:542** - Missing error handling for database operation
- **products.ts:567** - Missing error handling for database operation
- **qc.ts:391** - Potential N+1 query: findMany without include
- **qc.ts:566** - Potential N+1 query: findMany without include
- **qc.ts:746** - Potential N+1 query: findMany without include
- **quickbooks-sync.ts:455** - Potential N+1 query: findMany without include
- **shipping.ts:195** - Potential N+1 query: findMany without include
- **shop-drawings.ts:520** - Potential N+1 query: findMany without include
- **tasks.ts:106** - Potential N+1 query: findMany without include
- **users.ts:14** - Potential N+1 query: findMany without include

## ⚠️ Missing Input Validation (143)

Procedures without Zod input validation:

- **catalog.ts:261** - Procedure `create` missing `.input(z.object(...))`
- **catalog.ts:432** - Procedure `updateFurnitureDimensions` missing `.input(z.object(...))`
- **catalog.ts:475** - Procedure `addItemImage` missing `.input(z.object(...))`
- **design-briefs.ts:12** - Procedure `getAll` missing `.input(z.object(...))`
- **design-briefs.ts:121** - Procedure `create` missing `.input(z.object(...))`
- **design-briefs.ts:158** - Procedure `update` missing `.input(z.object(...))`
- **design-briefs.ts:189** - Procedure `approve` missing `.input(z.object(...))`
- **design-projects-router.ts:12** - Procedure `getAll` missing `.input(z.object(...))`
- **design-projects-router.ts:104** - Procedure `create` missing `.input(z.object(...))`
- **design-projects-router.ts:133** - Procedure `update` missing `.input(z.object(...))`
- **design-projects-router.ts:162** - Procedure `updateProgress` missing `.input(z.object(...))`
- **factoryReviews.ts:20** - Procedure `getAllSessions` missing `.input(z.object(...))`
- **factoryReviews.ts:191** - Procedure `createSession` missing `.input(z.object(...))`
- **factoryReviews.ts:245** - Procedure `updateSession` missing `.input(z.object(...))`
- **factoryReviews.ts:291** - Procedure `getPhotos` missing `.input(z.object(...))`
- **factoryReviews.ts:339** - Procedure `uploadPhoto` missing `.input(z.object(...))`
- **factoryReviews.ts:408** - Procedure `getComments` missing `.input(z.object(...))`
- **factoryReviews.ts:467** - Procedure `addComment` missing `.input(z.object(...))`
- **factoryReviews.ts:553** - Procedure `getActionItems` missing `.input(z.object(...))`
- **factoryReviews.ts:611** - Procedure `uploadDocument` missing `.input(z.object(...))`
- **invoices.ts:20** - Procedure `getAll` missing `.input(z.object(...))`
- **invoices.ts:322** - Procedure `create` missing `.input(z.object(...))`
- **invoices.ts:376** - Procedure `addLineItem` missing `.input(z.object(...))`
- **invoices.ts:426** - Procedure `updateLineItem` missing `.input(z.object(...))`
- **invoices.ts:538** - Procedure `getStats` missing `.input(z.object(...))`
- **mood-boards.ts:13** - Procedure `getAll` missing `.input(z.object(...))`
- **mood-boards.ts:136** - Procedure `create` missing `.input(z.object(...))`
- **mood-boards.ts:182** - Procedure `update` missing `.input(z.object(...))`
- **mood-boards.ts:211** - Procedure `updateLayout` missing `.input(z.object(...))`
- **mood-boards.ts:232** - Procedure `generateShareLink` missing `.input(z.object(...))`
- **oauth.ts:77** - Procedure `refreshToken` missing `.input(z.object(...))`
- **oauth.ts:137** - Procedure `disconnect` missing `.input(z.object(...))`
- **order-items.ts:89** - Procedure `create` missing `.input(z.object(...))`
- **ordered-items-production.ts:20** - Procedure `getAll` missing `.input(z.object(...))`
- **ordered-items-production.ts:188** - Procedure `updateQC` missing `.input(z.object(...))`
- **ordered-items-production.ts:225** - Procedure `updateStatus` missing `.input(z.object(...))`
- **ordered-items-production.ts:263** - Procedure `assignToShipment` missing `.input(z.object(...))`
- **ordered-items-production.ts:297** - Procedure `bulkUpdateQC` missing `.input(z.object(...))`
- **ordered-items-production.ts:330** - Procedure `getQCStats` missing `.input(z.object(...))`
- **packing.ts:20** - Procedure `getAllJobs` missing `.input(z.object(...))`
- **packing.ts:132** - Procedure `createJob` missing `.input(z.object(...))`
- **packing.ts:169** - Procedure `updateJobStatus` missing `.input(z.object(...))`
- **packing.ts:211** - Procedure `autoGenerateFromOrder` missing `.input(z.object(...))`
- **packing.ts:325** - Procedure `addBox` missing `.input(z.object(...))`
- **packing.ts:372** - Procedure `updateBox` missing `.input(z.object(...))`
- **packing.ts:452** - Procedure `getPackingStats` missing `.input(z.object(...))`
- **partners.ts:111** - Procedure `getAll` missing `.input(z.object(...))`
- **partners.ts:238** - Procedure `create` missing `.input(z.object(...))`
- **partners.ts:252** - Procedure `update` missing `.input(z.object(...))`
- **partners.ts:303** - Procedure `create` missing `.input(z.object(...))`
- **partners.ts:313** - Procedure `update` missing `.input(z.object(...))`
- **partners.ts:342** - Procedure `create` missing `.input(z.object(...))`
- **partners.ts:355** - Procedure `update` missing `.input(z.object(...))`
- **partners.ts:382** - Procedure `getPerformanceStats` missing `.input(z.object(...))`
- **partners.ts:438** - Procedure `getForSelection` missing `.input(z.object(...))`
- **payments.ts:20** - Procedure `getAll` missing `.input(z.object(...))`
- **payments.ts:234** - Procedure `getUnallocated` missing `.input(z.object(...))`
- **payments.ts:293** - Procedure `create` missing `.input(z.object(...))`
- **payments.ts:362** - Procedure `allocateToInvoice` missing `.input(z.object(...))`
- **payments.ts:472** - Procedure `update` missing `.input(z.object(...))`
- **payments.ts:597** - Procedure `getStats` missing `.input(z.object(...))`
- **production-invoices.ts:147** - Procedure `getAll` missing `.input(z.object(...))`
- **production-invoices.ts:223** - Procedure `recordPayment` missing `.input(z.object(...))`
- **production-invoices.ts:333** - Procedure `update` missing `.input(z.object(...))`
- **production-invoices.ts:391** - Procedure `getOutstanding` missing `.input(z.object(...))`
- **production-orders.ts:211** - Procedure `getAll` missing `.input(z.object(...))`
- **production-orders.ts:278** - Procedure `create` missing `.input(z.object(...))`
- **production-orders.ts:320** - Procedure `updateStatus` missing `.input(z.object(...))`
- **production-orders.ts:373** - Procedure `update` missing `.input(z.object(...))`
- **production-orders.ts:432** - Procedure `getByFactory` missing `.input(z.object(...))`
- **production-tracking.ts:216** - Procedure `createMilestone` missing `.input(z.object(...))`
- **production-tracking.ts:234** - Procedure `updateMilestone` missing `.input(z.object(...))`
- **products.ts:84** - Procedure `createCollection` missing `.input(z.object(...))`
- **products.ts:105** - Procedure `updateCollection` missing `.input(z.object(...))`
- **products.ts:235** - Procedure `createMaterial` missing `.input(z.object(...))`
- **products.ts:320** - Procedure `updateMaterial` missing `.input(z.object(...))`
- **prototypes.ts:20** - Procedure `getAll` missing `.input(z.object(...))`
- **prototypes.ts:260** - Procedure `create` missing `.input(z.object(...))`
- **prototypes.ts:342** - Procedure `update` missing `.input(z.object(...))`
- **prototypes.ts:406** - Procedure `updateStatus` missing `.input(z.object(...))`
- **prototypes.ts:446** - Procedure `search` missing `.input(z.object(...))`
- **prototypes.ts:521** - Procedure `getRecent` missing `.input(z.object(...))`
- **prototypes.ts:594** - Procedure `createProduction` missing `.input(z.object(...))`
- **prototypes.ts:630** - Procedure `updateProduction` missing `.input(z.object(...))`
- **prototypes.ts:682** - Procedure `updateProgress` missing `.input(z.object(...))`
- **prototypes.ts:708** - Procedure `assignFactory` missing `.input(z.object(...))`
- **prototypes.ts:734** - Procedure `assignManager` missing `.input(z.object(...))`
- **prototypes.ts:858** - Procedure `createMilestone` missing `.input(z.object(...))`
- **prototypes.ts:903** - Procedure `updateMilestone` missing `.input(z.object(...))`
- **prototypes.ts:959** - Procedure `updateMilestoneStatus` missing `.input(z.object(...))`
- **prototypes.ts:1013** - Procedure `updateMilestoneProgress` missing `.input(z.object(...))`
- **prototypes.ts:1055** - Procedure `reorderMilestones` missing `.input(z.object(...))`
- **prototypes.ts:1090** - Procedure `getPhotos` missing `.input(z.object(...))`
- **prototypes.ts:1212** - Procedure `uploadPhoto` missing `.input(z.object(...))`
- **prototypes.ts:1273** - Procedure `updatePhoto` missing `.input(z.object(...))`
- **prototypes.ts:1328** - Procedure `addPhotoAnnotation` missing `.input(z.object(...))`
- **prototypes.ts:1372** - Procedure `setFeaturedPhoto` missing `.input(z.object(...))`
- **prototypes.ts:1413** - Procedure `getPhotoComments` missing `.input(z.object(...))`
- **prototypes.ts:1467** - Procedure `addPhotoComment` missing `.input(z.object(...))`
- **prototypes.ts:1569** - Procedure `getDocuments` missing `.input(z.object(...))`
- **prototypes.ts:1663** - Procedure `uploadDocument` missing `.input(z.object(...))`
- **prototypes.ts:1717** - Procedure `updateDocument` missing `.input(z.object(...))`
- **prototypes.ts:1803** - Procedure `getReviews` missing `.input(z.object(...))`
- **prototypes.ts:1914** - Procedure `createReview` missing `.input(z.object(...))`
- **prototypes.ts:1960** - Procedure `updateReview` missing `.input(z.object(...))`
- **prototypes.ts:2000** - Procedure `addReviewParticipant` missing `.input(z.object(...))`
- **prototypes.ts:2057** - Procedure `getReviewActions` missing `.input(z.object(...))`
- **prototypes.ts:2098** - Procedure `createReviewAction` missing `.input(z.object(...))`
- **prototypes.ts:2134** - Procedure `updateReviewAction` missing `.input(z.object(...))`
- **prototypes.ts:2174** - Procedure `updateActionStatus` missing `.input(z.object(...))`
- **prototypes.ts:2208** - Procedure `assignAction` missing `.input(z.object(...))`
- **prototypes.ts:2238** - Procedure `getFeedback` missing `.input(z.object(...))`
- **prototypes.ts:2284** - Procedure `submitFeedback` missing `.input(z.object(...))`
- **prototypes.ts:2332** - Procedure `updateFeedback` missing `.input(z.object(...))`
- **prototypes.ts:2370** - Procedure `addressFeedback` missing `.input(z.object(...))`
- **prototypes.ts:2460** - Procedure `createRevision` missing `.input(z.object(...))`
- **qc.ts:20** - Procedure `getAllInspections` missing `.input(z.object(...))`
- **qc.ts:170** - Procedure `createInspection` missing `.input(z.object(...))`
- **qc.ts:220** - Procedure `updateInspectionStatus` missing `.input(z.object(...))`
- **qc.ts:252** - Procedure `getDefects` missing `.input(z.object(...))`
- **qc.ts:307** - Procedure `addDefect` missing `.input(z.object(...))`
- **qc.ts:340** - Procedure `updateDefect` missing `.input(z.object(...))`
- **qc.ts:371** - Procedure `getPhotos` missing `.input(z.object(...))`
- **qc.ts:404** - Procedure `uploadPhoto` missing `.input(z.object(...))`
- **qc.ts:495** - Procedure `addComment` missing `.input(z.object(...))`
- **qc.ts:581** - Procedure `addCheckpoint` missing `.input(z.object(...))`
- **qc.ts:621** - Procedure `updateCheckpoint` missing `.input(z.object(...))`
- **qc.ts:653** - Procedure `getInspectionStats` missing `.input(z.object(...))`
- **qc.ts:737** - Procedure `getInspectionsByCatalogItem` missing `.input(z.object(...))`
- **shipping.ts:72** - Procedure `getQuotes` missing `.input(z.object(...))`
- **shipping.ts:143** - Procedure `createShipment` missing `.input(z.object(...))`
- **shop-drawings.ts:16** - Procedure `getAll` missing `.input(z.object(...))`
- **shop-drawings.ts:187** - Procedure `create` missing `.input(z.object(...))`
- **shop-drawings.ts:279** - Procedure `uploadVersion` missing `.input(z.object(...))`
- **shop-drawings.ts:370** - Procedure `addComment` missing `.input(z.object(...))`
- **shop-drawings.ts:426** - Procedure `resolveComment` missing `.input(z.object(...))`
- **shop-drawings.ts:463** - Procedure `approveVersion` missing `.input(z.object(...))`
- **shop-drawings.ts:637** - Procedure `getComments` missing `.input(z.object(...))`
- **storage.ts:73** - Procedure `recordUpload` missing `.input(z.object(...))`
- **storage.ts:176** - Procedure `listFiles` missing `.input(z.object(...))`
- **tasks.ts:255** - Procedure `addAttachment` missing `.input(z.object(...))`
- **tasks.ts:312** - Procedure `addActivity` missing `.input(z.object(...))`
- **tasks.ts:340** - Procedure `addEntityLink` missing `.input(z.object(...))`

---

*Generated by API Router Analysis Script*
