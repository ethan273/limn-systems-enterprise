# Prime Directive for Claude Code

## 🚨 CRITICAL: NO SHORTCUTS EVER

**This is the most important rule. It overrides everything else.**

**NO SHORTCUTS. QUALITY IS IMPERATIVE. BUILD THE BEST POSSIBLE SOLUTIONS THAT ARE PERMANENT AND ERROR-FREE.**

Everything else follows from this.

---

## 📚 Documentation Structure

This file has been **modularized for maintainability**. For detailed information, see the topic-specific files below.

### Patterns (Development Patterns & Best Practices)
- **[Database Patterns](patterns/database-patterns.md)** - ctx.db usage, Prisma 3-step queries, schema sync, permissions
- **[Auth Patterns](patterns/auth-patterns.md)** - getCurrentUser, API auth, admin authorization, tRPC security
- **[RBAC Patterns](patterns/rbac-patterns.md)** - ⭐ NEW - Permission checking, multi-tenancy, templates, sessions
- **[UI Patterns](patterns/ui-patterns.md)** - Logo usage, theming, UI conventions
- **[Email Patterns](patterns/email-patterns.md)** - Campaign system, webhooks, rate limiting, unsubscribe
- **[Build Patterns](patterns/build-patterns.md)** - Client/server separation, Prisma bundling, type safety

### Critical (Production & Quality Requirements)
- **[Production Readiness](critical/production-readiness.md)** - Schema sync, E2E testing, security, deployment
- **[Performance](critical/performance.md)** - Database indexes, React Query cache, pagination

### Reference (Standards & History)
- **[Lessons Learned](reference/lessons-learned.md)** - Past failures, error protocols, accountability
- **[Standards](reference/standards.md)** - Code quality, communication, verification checklists

---

## Core Principles

### 1. NO SHORTCUTS
- There are **NO time constraints**
- **Quality is imperative**, not speed
- **Always build the best possible solutions** that are permanent and error-free
- Do not optimize for speed at the expense of correctness
- Do not skip verification steps
- Do not make assumptions without proof

### 2. COMPLETE VERIFICATION REQUIRED
- **Never claim "production ready"** without running `./scripts/pre-deploy-check.sh` successfully
- **Never claim "fixed"** without verifying the fix works
- **Never claim "tested"** without showing test results
- **All builds must complete successfully** - timeouts are blockers, not warnings

### 3. ZERO TOLERANCE FOR:
- ❌ Exposed credentials/secrets
- ❌ Type errors in production code
- ❌ Build failures
- ❌ Unverified claims
- ❌ "It should work" statements without proof
- ❌ Shortcuts that compromise quality

### 4. ALWAYS DO:
- ✅ Run complete verification before claiming success
- ✅ Investigate timeouts and errors thoroughly
- ✅ Scan for secrets in ALL files (including .md)
- ✅ Verify type safety with `npm run type-check`
- ✅ Verify production build with `npm run build`
- ✅ Test fixes manually when possible
- ✅ Be conservative, not optimistic

---

## 🔴 CRITICAL Quick Reference

### Environment & Database Configuration

**Environment Files:**
- **Development:** `.env` - Contains dev database URL and credentials
- **Production:** `production-credentials.env` - Contains prod database URL and credentials

**Database URL Variables:**
- DEV: `DEV_DB_URL` in `production-credentials.env`
- PROD: `PROD_DB_URL` in `production-credentials.env`
- Current: `DATABASE_URL` in `.env` (usually points to dev)

**CRITICAL RULE:** When applying database changes, migrations, or indexes:
1. ✅ **ALWAYS** apply to BOTH dev and prod databases
2. ✅ **ALWAYS** check `production-credentials.env` for prod credentials
3. ✅ **ALWAYS** verify both databases have matching changes
4. ✅ **NEVER** assume .env contains prod credentials

### Schema Sync Status

**Status**: ✅ 100% SYNCED (October 28, 2025)

**Achievement**: Complete database-to-Prisma schema synchronization achieved via `npx prisma db pull --force`

**Current State**:
- 🎯 **4,297 database columns** across 316 tables fully accessible via Prisma Client
- 🎯 **0 critical issues** - All Prisma fields exist in database
- 🎯 **0 high priority issues** - All database columns represented in Prisma
- 🎯 **0 medium issues** - All nullable types correctly synced
- 🎯 **58 low priority (documented)** - Zod validation-only fields (intentional, see docs)

**Schema Audit Tools**:
```bash
# Run schema mismatch audit
npm run schema:audit

# Pull latest database schema to Prisma
npx prisma db pull --force
npx prisma format
npx prisma generate
```

**Documentation**:
- Full audit report: `/Users/eko3/limn-systems-enterprise-docs/02-QUALITY-TOOLS/schema-audit/schema-audit-v2-2025-10-28.md`
- Remediation plan: `/Users/eko3/limn-systems-enterprise-docs/02-QUALITY-TOOLS/schema-audit/REMEDIATION-PLAN-2025-10-28.md`
- Zod validation fields: `/Users/eko3/limn-systems-enterprise-docs/02-QUALITY-TOOLS/schema-audit/ZOD-VALIDATION-FIELDS-DOCUMENTED.md`

**CI/CD Integration**: Schema audit runs automatically on every PR via GitHub Actions

**⚠️ IMPORTANT FOR FUTURE SESSIONS**:
- Schema is NOW 100% synced - any "high priority" schema issues in future audits are NEW drift
- The 58 "low priority" Zod fields are intentional and documented - ignore them
- Run `npm run schema:audit` after any database schema changes
- Use `npx prisma db pull` instead of manual schema updates

### Performance Optimization Status

**Status**: ✅ MAJOR OPTIMIZATIONS COMPLETE (October 28, 2025)

**Achievement**: Implemented Options 1 (partial), 2 (complete), and 5 (partial) with outstanding results

**Performance Improvements**:
- 🚀 **Dashboard Load**: 95% faster (60s → 3-5s)
- 🚀 **Global Search**: 85% faster (2000ms → 300ms)
- 🚀 **Materials Query**: 10x faster (O(n*m) → O(log n))
- 🚀 **Bundle Size**: -60MB (removed AWS SDK v2)
- 🚀 **Build Memory**: -50% (8GB → 4GB)
- 🚀 **Database Indexes**: +18 strategic indexes (1,296 → 1,314)

**What Was Optimized**:
1. ✅ Dashboard queries - eliminated "fetch all" anti-pattern
2. ✅ Global search - added 5 composite indexes
3. ✅ Materials query - refactored from O(n*m) to database-level JOINs
4. ✅ Orders/Projects queries - added pagination to 6 critical queries
5. ✅ Composite indexes - 13 performance indexes for filtering/sorting
6. ✅ Bundle optimization - removed duplicate AWS SDK, reduced memory

**Database Index Migrations Applied**:
```bash
# Applied to BOTH dev and prod databases
psql $DEV_DB_URL < scripts/migrations/add-global-search-indexes.sql
psql $PROD_DB_URL < scripts/migrations/add-global-search-indexes.sql

psql $DEV_DB_URL < scripts/migrations/add-composite-performance-indexes.sql
psql $PROD_DB_URL < scripts/migrations/add-composite-performance-indexes.sql
```

**Optimized Routers**:
- `src/server/api/routers/dashboards.ts` - Dashboard analytics queries
- `src/server/api/routers/products.ts` - Materials by collection query
- `src/server/api/routers/orders.ts` - Orders by project query
- `src/server/api/routers/projects.ts` - Project-related queries (4 fixes)

**Documentation**:
- Full summary: `/Users/eko3/limn-systems-enterprise-docs/02-QUALITY-TOOLS/OPTIMIZATION-FINAL-SUMMARY.md`
- Analysis: `/Users/eko3/limn-systems-enterprise-docs/02-QUALITY-TOOLS/OPTIMIZATION-ANALYSIS-2025-10-28.md`
- Session 1 summary: `/Users/eko3/limn-systems-enterprise-docs/02-QUALITY-TOOLS/OPTIMIZATION-SESSION1-SUMMARY.md`

**Git Commits** (all pushed to main):
- `43841eb` - Dashboard optimization + search indexes (Session 1)
- `0fee0ea` - Composite performance indexes (Session 2)
- `c0c523a` - Bundle optimization (Session 2)
- `285274f` - Query optimization & pagination fixes (Session 2)

**⚠️ IMPORTANT FOR FUTURE SESSIONS**:
- Performance optimizations are **production ready** and deployed
- Remaining work: 377 low-traffic unpaginated queries (low priority)
- Dynamic imports for heavy libraries (optional, ~40MB savings)
- Do NOT re-optimize already optimized queries
- See OPTIMIZATION-FINAL-SUMMARY.md for complete details

### Email Campaign System Configuration

**Status**: ✅ PRODUCTION READY (October 26, 2025)

**Environment Variables Required**:
```bash
# Email Service Provider
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cron Jobs (Vercel)
CRON_SECRET=your-secure-random-string-here

# Error Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Application URL (for unsubscribe links)
NEXT_PUBLIC_URL=https://your-production-domain.com
```

**Setup:**
```bash
# Add to .env
nano .env
# Add all variables above

# Add to Vercel
vercel env add RESEND_API_KEY
vercel env add RESEND_WEBHOOK_SECRET
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add CRON_SECRET
vercel env add NEXT_PUBLIC_SENTRY_DSN
```

**Critical Deployment Blockers - RESOLVED**:
1. ✅ Scheduled Campaign Sending (Vercel Cron)
2. ✅ Email Webhook Integration (Resend)
3. ✅ Unsubscribe System (CAN-SPAM compliance)
4. ✅ Rate Limiting (Upstash Redis)
5. ✅ Error Monitoring (Sentry with PII redaction)
6. ✅ Database Backups (Automated daily backups)

**See**: `/Users/eko3/limn-systems-enterprise-docs/00-MASTER-PLANS/PRODUCTION-DEPLOYMENT-GUIDE.md`

### RBAC System Configuration

**Status**: ✅ COMPLETE - All 5 Phases Implemented (October 27, 2025)

**System Overview:**
- **15 Database Tables**: Core roles, permissions, delegation, conditions, analytics
- **88% API Coverage**: 81 tRPC endpoints across 5 routers
- **5 Implementation Phases**: All complete with comprehensive documentation

**Key Components:**
1. **Phase 1**: Core RBAC (roles, permissions, user-role assignments)
2. **Phase 2**: Advanced Features (conditions, delegation, approval workflows, analytics)
3. **Phase 3**: Multi-tenancy (tenant isolation, cross-tenant access)
4. **Phase 4**: Permission Templates (reusable patterns, role templates)
5. **Phase 5**: Session Constraints (IP, time, device, location-based access)

**Critical Files:**
- **Patterns**: `/Users/eko3/limn-systems-enterprise/.claude/patterns/rbac-patterns.md`
- **Service**: `src/lib/services/rbac-service.ts` (core functions)
- **Routers**: `src/server/api/routers/rbac.ts` (13 endpoints)
- **Database**: 15 tables with 91+ indexes for performance

**Documentation:**
- Phase 2.3 Complete: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/RBAC-Phase-2.3-COMPLETE-DOCUMENTATION.md`
- SSO Integration: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/RBAC-SSO-INTEGRATION.md`
- Implementation Progress: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/RBAC-IMPLEMENTATION-PROGRESS-HIGH-PRIORITY.md`
- Comprehensive Audit: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/RBAC-COMPREHENSIVE-AUDIT-2025-10-27.md`

**Integration Notes:**
- ✅ Works seamlessly with existing auth system (Supabase Auth)
- ✅ Integrates with Google Workspace SSO for automatic role assignment
- ✅ Row Level Security (RLS) enabled on all RBAC tables
- ✅ Type-safe tRPC API with Zod validation
- ✅ Analytics and audit logging for compliance

**Usage Example:**
```typescript
// Check if user has permission
import { hasPermission } from '@/lib/services/rbac-service';

const canEdit = await hasPermission(userId, 'edit_content', {
  resource: { type: 'flipbook', id: flipbookId }
});

// Get effective roles (including delegation)
import { getEffectiveRoles } from '@/lib/services/rbac-service';

const roles = await getEffectiveRoles(userId);
const isAdmin = roles.includes('admin');
```

**See [RBAC Patterns](patterns/rbac-patterns.md) for complete implementation guide**

### Automation System Configuration

**Status**: ✅ COMPLETE - All 4 Sessions Implemented (October 30, 2025)

**System Overview:**
- **15 Files Created**: 5 UI pages, 5 test suites, 3 services, 2 infrastructure files
- **6,000+ Lines of Code**: Production-ready automation system
- **90+ tRPC Endpoints**: Across 8 routers (workflows, templates, automation, monitoring, real-time events)
- **Multi-Channel Alerts**: Email, in-app, Google Chat notifications

**Implementation Sessions:**
1. **Session 1**: Production UI (5 pages) - Workflows, templates, rules, monitoring, alerts
2. **Session 2**: Unit Tests (5 test suites) - Comprehensive test coverage with Vitest
3. **Session 3**: Real-Time Infrastructure - SSE endpoint + React hooks
4. **Session 4**: Alert System - Metrics, notifications, cron job

**Key Features:**
- Workflow execution engine with state management (idle → running → paused → completed/failed)
- Workflow templates with categories (approval, notification, task_creation, status_update, custom)
- Task automation rules with trigger events (order_created, order_status_changed, etc.)
- Performance monitoring (execution time, failure rate, queue size)
- Threshold-based alerting with cooldown periods
- P95/P99 performance metrics
- Multi-channel notifications (email via Resend, in-app, Google Chat)
- Real-time event streaming via SSE with heartbeat and reconnection
- Cron job for alert evaluation (runs every 5 minutes)

**Critical Files:**
- **UI Pages**: `src/app/automation/*` (5 pages, 3,600 lines)
- **Routers**: `src/server/api/routers/workflow-*.ts`, `task-automation.ts`, `realtime-events.ts`
- **Services**: `src/lib/services/metrics-service.ts`, `alert-notification-service.ts`
- **Cron Job**: `src/app/api/cron/evaluate-alerts/route.ts`
- **Real-Time**: `src/lib/realtime/client.ts`, `src/app/api/events/route.ts`
- **Tests**: `src/server/api/routers/__tests__/*.test.ts` (5 files)

**Environment Variables (All Configured):**
```bash
CRON_SECRET=<configured in .env and Vercel>
RESEND_WEBHOOK_SECRET=<configured in .env and Vercel>
UPSTASH_REDIS_REST_URL=<configured in .env and Vercel>
UPSTASH_REDIS_REST_TOKEN=<configured in .env and Vercel>
GOOGLE_CHAT_WEBHOOK_URL=<configured in Vercel>
```

**Cron Jobs (vercel.json):**
```json
{
  "path": "/api/cron/evaluate-alerts",
  "schedule": "*/5 * * * *"
}
```

**Database Tables:**
- `automation_workflows` - Workflow definitions
- `automation_logs` - Execution logs
- `workflow_templates` - Reusable templates
- `task_automation_rules` - Automation rules
- `task_automation_logs` - Rule execution logs
- `alert_rules` - Alert configurations
- `alert_triggers` - Triggered alerts
- `real_time_events` - Real-time event queue

**React Hooks (Real-Time):**
```typescript
// Entity-specific events
import { useRealtimeEvents } from '@/lib/realtime/client';
const { events, refetch } = useRealtimeEvents({ entityType, entityId });

// User's undelivered events
import { useMyEvents } from '@/lib/realtime/client';
const { events, markAsDelivered } = useMyEvents();

// SSE connection
import { useSSE } from '@/lib/realtime/client';
const { connected, events, reconnect } = useSSE({ endpoint: '/api/events' });

// Event publishing
import { usePublishEvent } from '@/lib/realtime/client';
const { publishEvent } = usePublishEvent();
```

**Metrics Available:**
- `execution_time` - Average, P95, P99 execution times
- `failure_rate` - Percentage-based failure rate
- `queue_size` - Pending + running workflow count
- `resource_usage` - Memory, CPU (placeholder for future)
- `custom` - User-defined metrics (placeholder for future)

**Alert Notification Channels:**
1. **Email** - HTML templates via Resend with severity indicators
2. **In-App** - Creates `real_time_events` entries for UI display
3. **Google Chat** - Rich card format with action buttons
4. **SMS** - Placeholder for future Twilio integration

**Documentation:**
- Complete Report: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/AUTOMATION-PHASE-3-COMPLETE-2025-10-30.md`
- Session Summary: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/PHASE-3-AUTOMATION-SESSION-SUMMARY-2025-10-30.md`
- Application State: `/Users/eko3/limn-systems-enterprise-docs/00-SESSION-START/APPLICATION-STATE-2025-10-30-PHASE-3-COMPLETE.md`

**Git Commits** (all pushed to main):
- `30291f2` - Automation configuration (vercel.json, .env.example)
- `927a9cb` - Sessions 2-4 (tests, real-time, alerts)
- `9247917` - Session 1 (5 UI pages)

**⚠️ IMPORTANT FOR FUTURE SESSIONS**:
- Automation system is **100% production ready** with all environment variables configured
- Cron job will activate automatically on next Vercel deployment
- SSE currently uses polling (5-10 second intervals) - can upgrade to Redis pub/sub
- All 5 UI pages follow established patterns (breadcrumbs, shadcn/ui, tRPC, React Query)
- Alert cooldown periods prevent notification spam
- Real-time event hooks support automatic reconnection
- See AUTOMATION-PHASE-3-COMPLETE-2025-10-30.md for complete implementation details

### Database Schema Sync Status

**Last Remediation**: October 28, 2025, 2:00 AM
**Status**: ✅ ALL ISSUES RESOLVED - 100% Dev/Prod Parity Achieved

**Remediation Results:**
- ✅ **Dev/Prod Sync**: 100% IN SYNC - All critical issues resolved
- ✅ **Prisma/Dev**: 100% ALIGNED
- ✅ **Prisma/Prod**: 100% ALIGNED - All tables, columns, and indexes match
- ✅ **Production Cleanup**: All test users removed, audit logs cleared (Oct 28, 2025)

**Issues Resolved:**
1. ✅ **Table Created**: `email_unsubscribes` (6 columns, 4 indexes) - Now in production
2. ✅ **Columns Added**: `email_queue.campaign_id` and `email_queue.unsubscribe_token` - Now in production
3. ✅ **Indexes Created**: 7 critical email indexes - Now in production
4. ✅ **Performance**: 7 beneficial indexes added to dev - 20-70% query speed improvement
5. ✅ **Cleanup**: 4 duplicate indexes removed from production

**Current Status:**
- **Column Count**: 4290 in both dev and prod (100% match)
- **Table Count**: 214 in both dev and prod (100% match)
- **Index Count**: 1708 in both dev and prod (100% match)
- **Email System**: Fully operational in production
- **CAN-SPAM Compliance**: Restored

**Prevention Systems Implemented:**
- ✅ `scripts/validate-schema-sync.sh` - Automated dev/prod comparison
- ✅ `scripts/deploy-migrations.sh` - Safe migration deployment with backups
- ✅ Pre-deploy check enhanced with schema validation (step 6c)
- ✅ Deployment automatically blocked if schemas don't match

**Documentation:**
- **Audit Report**: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/DATABASE-SCHEMA-COMPREHENSIVE-AUDIT-2025-10-27.md`
- **Completion Report**: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/DATABASE-SCHEMA-REMEDIATION-COMPLETE-2025-10-27.md`
- **SQL Scripts**: All remediation scripts saved in docs folder

**Verification Command:**
```bash
./scripts/validate-schema-sync.sh
# Output: ✅ PASS: Dev and Prod schemas are in sync
```

### Production User Management

**Last Cleanup**: October 28, 2025, 2:00 AM
**Status**: ✅ PRODUCTION CLEAN - Only Real Users Remain

**Current Production Users (5):**
- ✅ ethan@limn.us.com (Super Admin)
- ✅ daniel@limn.us.com (Super Admin)
- ✅ toma@limn.us.com (Designer)
- ✅ lauren@limn.us.com (Manufacturer)
- ✅ nathalie@limn.us.com (Finance)

**Cleanup Actions Performed:**
- Deleted 5 test users (admin@test.com, customer-user, designer-user, factory-user, dev-user)
- Removed 205 test SSO login records
- Deleted 25 test shop drawings
- Cleared all old audit logs (21 records from Aug-Oct 2025)
- Removed 1 test user role assignment

**Production Data Status:**
- User profiles: Clean (5 real users only)
- Auth users (Supabase): Clean (5 real users only)
- Activity logs: Fresh start (cleared Oct 28, 2025)
- Login tracking: Active (working correctly)

### Pino Universal Logger

**Last Updated**: October 30, 2025
**Status**: ✅ PRODUCTION READY - Universal Logger Implemented
**Commit**: 1fef54e

**Implementation:**
- **File**: `src/lib/logger.ts` (258 lines, fully documented)
- **Server**: Uses Pino (5x-10x faster than Winston)
- **Client**: Enhanced console with Pino-compatible API
- **Auto-detection**: `typeof window === 'undefined'`
- **Type-safe**: Full TypeScript support with structured logging

**Why Pino (Not Winston):**
- Winston requires Node.js `fs` module → incompatible with client components
- Pino works in both server and client environments
- 5x-10x faster than Winston with lower memory footprint
- Zero bundle bloat (tree-shaken for client)

**Dependencies:**
```bash
# Removed
winston, winston-daily-rotate-file, @types/triple-beam

# Added
pino@^9.14.0, pino-pretty@^11.3.0
```

**Usage Example:**
```typescript
import { log } from '@/lib/logger';

// Simple logging
log.info('User logged in');

// With metadata (structured logging)
log.error('Database error', { error: err.message, userId: '123' });

// Child logger with context
const authLogger = createLogger('Auth');
authLogger.info('Session created', { userId: '123' });
```

**Migration Status:**
- ✅ `src/middleware.ts` - 26 console statements migrated
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors
- ✅ Production build: SUCCESS (3.6min)
- ⏳ Remaining: 218 files with console statements (incremental migration ongoing)

**See**: `/Users/eko3/limn-systems-enterprise-docs/00-SESSION-START/SESSION-START-2025-10-30-PINO-LOGGER.md`

### External Portal Implementation Status

**Status**: ✅ PHASE 2 COMPLETE - All Portals Production Ready (October 29, 2025)

**Implementation**: 100% complete for all external portals with full CRUD operations

**Portals Implemented**:
1. ✅ **Customer Portal** - Profile management, documents, invoices
2. ✅ **Designer Portal** - Documents, quality reports, settings, deliverable submissions
3. ✅ **Factory Portal** - Documents, quality metrics, shipping management
4. ✅ **QC Portal** - Dashboard, inspections, enhanced uploads, status updates

**Key Features**:
- ✅ Entity-based authentication (customer, designer, factory, QC)
- ✅ Document upload/download via Supabase Storage
- ✅ Quality tracking with aggregate metrics
- ✅ Shipping management with mark-as-shipped functionality
- ✅ Inspection linking and bulk upload (QC portal)
- ✅ Deliverable submission with version tracking (designer portal)
- ✅ Type-safe tRPC APIs with Zod validation (25+ endpoints)
- ✅ Responsive UI with shadcn/ui components

**Technical Stack**:
- Frontend: Next.js 14 App Router, React Query, shadcn/ui
- Backend: tRPC v10, Prisma ORM, PostgreSQL
- Storage: Supabase Storage (documents bucket)
- Auth: Supabase Auth with entity-based procedures

**Documentation**:
- **Complete Guide**: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/PHASE-2-PORTALS-COMPLETE-2025-10-29.md`
- **Router Implementation**: `src/server/api/routers/portal.ts` (3,363 lines)
- **Portal Pages**: 10+ pages in `src/app/portal/{customer,designer,factory,qc}/`

**Verification**:
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 warnings
- ✅ Build: Success (50 seconds, 174 static pages)
- ✅ All manual flows tested

**⚠️ IMPORTANT FOR FUTURE SESSIONS**:
- All portal implementations are production-ready
- No additional portal features currently planned
- Next phase: User feedback and production monitoring

---

## 🎯 Pattern Quick Reference

### Database Access (ALWAYS USE ctx.db)

```typescript
// ✅ CORRECT: Use ctx.db for ALL database operations
export const myRouter = createTRPCRouter({
  myQuery: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const data = await ctx.db.my_table.findUnique({
        where: { id: input.id },
        include: { related_table: true },
      });
      return data;
    }),
});
```

**See [Database Patterns](patterns/database-patterns.md) for complete guide**

### Authentication (ALWAYS USE getCurrentUser)

```typescript
// ✅ CORRECT: Use tRPC for authentication
const { data: currentUser, isLoading: authLoading } = api.userProfile.getCurrentUser.useQuery();

// ✅ CORRECT: API routes
import { getUser } from '@/lib/auth/server';
const user = await getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

**See [Auth Patterns](patterns/auth-patterns.md) for complete guide**

### Logo Usage (MATCH the theme name)

```typescript
// ✅ CORRECT: Use MATCHING file name for theme
resolvedTheme === 'dark'
  ? '/images/Limn_Logo_Dark_Mode.png'   // Dark_Mode.png for dark theme
  : '/images/Limn_Logo_Light_Mode.png'  // Light_Mode.png for light theme
```

**See [UI Patterns](patterns/ui-patterns.md) for complete guide**

---

## 🔒 Production Readiness Checklist

An application is **NOT production ready** unless:

1. ✅ `./scripts/pre-deploy-check.sh` passes completely
2. ✅ `npm run build` succeeds (no timeout, no errors)
3. ✅ `npx tsc --noEmit` shows 0 errors
4. ✅ `npm audit` shows 0 critical/high vulnerabilities
5. ✅ No secrets exposed in any committed files
6. ✅ Production server starts and serves pages
7. ✅ Core user flows work in production mode

**Never claim production ready without proof of all 7 items above.**

**See [Production Readiness](critical/production-readiness.md) for complete requirements**

---

## 📝 Verification Checklist

Before claiming **ANY** task is complete:

- [ ] Does it work? (tested manually or automatically)
- [ ] Does it build? (no errors)
- [ ] Does it type-check? (no errors)
- [ ] Does schema validate? (`npm run schema:validate` passes)
- [ ] Is it secure? (no secrets, no vulnerabilities)
- [ ] Is it documented? (updated relevant docs)
- [ ] Can it be verified? (repeatable test)

**All checkboxes must be ✅ before claiming complete.**

---

## 🗂️ Documentation Organization

**ALL documentation, logs, test results MUST go here:**
```
/Users/eko3/limn-systems-enterprise-docs/
```

**NEVER store these in app root:**
```
/Users/eko3/limn-systems-enterprise/  # ❌ Only source code here
```

**File Organization:**
1. **Test Logs** → `01-TESTING/test-runs-YYYY-MM-DD/`
2. **Test Results** → `01-TESTING/test-results-YYYY-MM-DD/`
3. **Analysis Docs** → `01-CURRENT/`
4. **Audit Reports** → `02-QUALITY-TOOLS/audit-reports/`
5. **Credentials** → `09-SECURITY/credentials/` (.gitignored)
6. **Session Notes** → `00-SESSION-START/` or `06-SESSION-HISTORY/`

**See [Production Readiness](critical/production-readiness.md) for complete organization rules**

---

## ❌ What NEVER to Say

- "This should work"
- "Probably production ready"
- "Looks good to me"
- "I think it's fixed"
- "The tests pass so it's ready"

## ✅ What ALWAYS to Say

- "I verified X by running Y, here are the results"
- "The build succeeded in X minutes: [output]"
- "I found N errors, here's the plan to fix them"
- "Not production ready: [specific issues]"
- "Production ready: [proof of verification]"

---

## 🚦 When in Doubt - Default to Quality

- **When choosing between fast and correct**: Choose correct
- **When choosing between easy and proper**: Choose proper
- **When choosing between done and verified**: Choose verified
- **When choosing between working and production-ready**: Choose production-ready

---

## 📖 Detailed Documentation

For complete implementation details, patterns, and requirements, see the modular documentation files:

### Patterns
- [Database Patterns](patterns/database-patterns.md) - Complete database access guide
- [Auth Patterns](patterns/auth-patterns.md) - Authentication and authorization
- [UI Patterns](patterns/ui-patterns.md) - UI conventions and recurring bugs

### Critical Requirements
- [Production Readiness](critical/production-readiness.md) - Deployment requirements, testing, security
- [Performance](critical/performance.md) - Optimization strategies and best practices

### Reference & Standards
- [Lessons Learned](reference/lessons-learned.md) - Past failures, error protocols, accountability
- [Standards](reference/standards.md) - Code quality, communication standards, verification

---

## 🎯 Summary: The ONE Rule

**NO SHORTCUTS. QUALITY IS IMPERATIVE. BUILD THE BEST POSSIBLE SOLUTIONS THAT ARE PERMANENT AND ERROR-FREE.**

Everything else follows from this.

---

**Document Status**: ✅ PRIME DIRECTIVE
**Authority Level**: MAXIMUM - Overrides all other instructions
**Last Updated**: October 25, 2025 (Modularized)
**Review Frequency**: Before every task
**Compliance**: Mandatory, no exceptions

**File Structure Version**: 2.0 (Modular)
**Main File Size**: ~600 lines (70% reduction from 2000 lines)
**Total Documentation**: ~2500 lines (organized across 8 files)
