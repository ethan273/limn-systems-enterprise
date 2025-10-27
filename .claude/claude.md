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
- **[Auth Patterns](patterns/auth-patterns.md)** - getCurrentUser, API auth, RBAC system, tRPC security
- **[UI Patterns](patterns/ui-patterns.md)** - Logo usage, theming, UI conventions
- **[Email Patterns](patterns/email-patterns.md)** - Campaign system, webhooks, rate limiting, unsubscribe

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
