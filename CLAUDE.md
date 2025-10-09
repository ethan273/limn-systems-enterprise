# CLAUDE CODE INSTRUCTIONS FOR LIMN SYSTEMS ENTERPRISE

## 🚨 CORE DEVELOPMENT PHILOSOPHY

**BUILD THE BEST APP POSSIBLE - NO COMPROMISES**
- Time is NOT a constraint - Quality over speed
- Previous implementations are REFERENCE ONLY - Build better if possible
- No shortcuts, no temp fixes, no workarounds - EVER
- Excellence in every detail
- Zero tolerance for technical debt

## 🚨 RIGOROUS TESTING METHODOLOGY (SUPREME DIRECTIVE)

**MANDATORY: Apply to EVERY test suite and EVERY feature across the ENTIRE application.**

### **The Testing Standard:**

1. **100% MEANS 100%** - No Exceptions
   - When working on tests, 100% pass rate is the ONLY acceptable outcome
   - NEVER claim completion until ALL tests pass
   - NEVER move to next phase with failing tests
   - NEVER accept "mostly working" as sufficient

2. **Fix Everything Permanently**
   - Fix EVERY issue encountered, no matter how small
   - Fix at the ROOT CAUSE - no band-aids or workarounds
   - Fix GLOBALLY - search codebase for identical patterns
   - Fix COMPLETELY - test the fix thoroughly before moving on

3. **No Deferring Issues**
   - NEVER put off fixes for "later"
   - NEVER skip over problems to work on "easier" things
   - NEVER mark something as "known issue" without fixing it
   - Fix it NOW, fix it RIGHT, fix it PERMANENTLY

4. **Transparency & Honesty**
   - If stuck, say so - don't claim false progress
   - If infrastructure blocks testing, document clearly
   - If something doesn't work, report it - don't hide it
   - Report actual percentages, not aspirational ones

5. **Systematic Approach**
   - Read test specifications thoroughly
   - Understand EXACT requirements before coding
   - Verify fixes with actual test runs
   - Don't assume - always verify

### **Application to ALL Work:**

This methodology applies to:
- ✅ ALL test suites (01-20+, not just portals)
- ✅ ALL features (existing and new)
- ✅ ALL bugs and issues encountered
- ✅ ALL code quality checks (lint, typecheck, build)
- ✅ ALL functionality (UI, API, database, auth)

### **NEVER:**
- ❌ Claim 100% without actual 100% pass rate
- ❌ Skip over failing tests
- ❌ Accept partial fixes
- ❌ Defer problems to later
- ❌ Use workarounds instead of real fixes
- ❌ Hide issues or failures
- ❌ Move forward with known broken functionality

**THIS IS NOT NEGOTIABLE. THIS IS THE STANDARD.**

## 🚨 ZERO-TOLERANCE ISSUE POLICY (ABSOLUTE REQUIREMENT)

**EVERY issue encountered MUST be reported and fixed - NO EXCEPTIONS**

### **What Constitutes an "Issue":**
- Any error (compile-time, runtime, test failure)
- Any warning (ESLint, TypeScript, deprecation, console)
- Any unexpected behavior or output
- Any test flakiness or intermittent failure
- Any TODO/FIXME comments in code
- Any "workaround" or temporary solution
- Any deferred problem or "known issue"

### **Required Response to EVERY Issue:**
1. **REPORT IMMEDIATELY** - Never skip over or dismiss
2. **ANALYZE ROOT CAUSE** - Understand why it's happening
3. **PROPOSE SOLUTION** - Multiple options if applicable
4. **ASK FOR APPROVAL** - Don't decide criticality alone
5. **FIX PERMANENTLY** - No band-aids or workarounds
6. **VERIFY FIX** - Test thoroughly before moving on
7. **DOCUMENT** - What was found, why, how fixed

### **NEVER:**
- ❌ Categorize something as "non-critical" without user approval
- ❌ Skip warnings thinking "it's just a warning"
- ❌ Hide issues in progress reports
- ❌ Use temporary workarounds without explicit permission
- ❌ Defer fixes to "later" without documentation
- ❌ Assume something is "acceptable" without asking

### **Issue Tracking:**
All deferred issues MUST be:
- Documented in `PRODUCTION-CHECKLIST.md`
- Tagged with severity, reason for deferral, and test plan
- Tracked until 100% resolved
- Reviewed before every production deployment

**THIS POLICY IS ABSOLUTE AND NON-NEGOTIABLE.**

## 🚨 CRITICAL QUALITY REQUIREMENTS (PRIME DIRECTIVE)

**EVERY LINE OF CODE MUST BE 100% PRODUCTION-READY:**

**Pre-Delivery Validation (ALL must pass with ZERO issues):**
```bash
npm run lint           # 0 warnings, 0 errors
npm run type-check     # 0 TypeScript errors
npm run build          # Must complete successfully
```

**Zero Tolerance For:**
- ESLint warnings/errors
- TypeScript errors
- Security violations
- React hook violations
- Console errors/warnings
- Broken functionality
- Deprecated code
- Accessibility violations

**IF ANY CHECK FAILS:** Fix automatically BEFORE showing code to user.

## 🚨 GLOBAL CSS ARCHITECTURE (MANDATORY)

**ALL styling in global CSS files - ZERO hardcoded styles in components:**
- ✅ Semantic class names (`.sidebar`, `.card`) - NOT utility combinations
- ✅ CSS variables for colors/fonts
- ✅ No inline Tailwind utilities
- ✅ One place to change styling

**Example:**
```tsx
// ❌ WRONG
<div className="bg-background text-foreground p-4">

// ✅ CORRECT
<div className="card">
```

## 🚨 TESTING & DEBUGGING REQUIREMENTS

**ALWAYS before delivery:**
1. Check actual browser console errors (not just compile-time)
2. Test ALL functionality: buttons, forms, dropdowns, workflows
3. Verify UI renders correctly (sidebar, header, data display)
4. Test with real data (create test data if needed)
5. Fix ALL runtime errors automatically

**For database-dependent features:**
- Create test data via SQL/Prisma if database is empty
- Test pagination, sorting, filtering with real data
- Verify edit/add/delete workflows work end-to-end

## 🚨 GLOBAL ERROR FIXING PATTERN

When finding ANY error:
1. **Compile ALL errors in module FIRST** - Don't fix immediately
2. **Search entire codebase** - Look for identical patterns everywhere
3. **Fix globally** - Apply fixes to ALL instances simultaneously
4. Never fix just one occurrence

## 🚨 COMMUNICATION REQUIREMENTS

**Always end responses with:**
```
🔴 SERVER STATUS: Development server running on http://localhost:3000
```

## 🚨 DATABASE & ENVIRONMENT

**ONLY work with:**
- limn-systems-enterprise database (https://gwqkbjymbarkufwvdmar.supabase.co)
- Database URL: postgresql://postgres:kegquT-vyspi4-javwon@db.gwqkbjymbarkufwvdmar.supabase.co:5432/postgres

**NEVER modify:**
- limn-systems database
- limn-systems-staging database

## 🚨 DATABASE SCHEMA SYNC (CRITICAL REQUIREMENT)

**PRISMA SCHEMA AND DATABASE MUST ALWAYS BE IN PERFECT SYNC - NO EXCEPTIONS**

### **After EVERY schema change:**
```bash
# 1. Update prisma/schema.prisma with new models/fields
# 2. Push changes to database IMMEDIATELY
npx prisma db push

# 3. Regenerate Prisma Client
npx prisma generate

# 4. Verify sync completed successfully
```

### **Rules for Schema Changes:**
1. **NEVER** modify schema without pushing to database
2. **NEVER** modify database without updating schema.prisma
3. **ALWAYS** run `prisma db push` after schema edits
4. **ALWAYS** run `prisma generate` after db push
5. **VERIFY** changes applied successfully before continuing

### **Schema Sync Checklist:**
- ✅ Edit prisma/schema.prisma
- ✅ Run `npx prisma db push`
- ✅ Run `npx prisma generate`
- ✅ Verify TypeScript types updated
- ✅ Test new fields/models work

**WHY THIS MATTERS:**
- Mismatched schemas cause TypeScript errors
- Features fail at runtime despite passing type checks
- Database queries return unexpected results
- Impossible to debug when schema is out of sync

**THIS IS NON-NEGOTIABLE. KEEP SCHEMAS SYNCHRONIZED AT ALL TIMES.**

## 🚨 COMMIT REQUIREMENTS

**Before ANY commit:**
- Run `npm run lint` - Fix ALL issues
- Run `npm run type-check` - Fix ALL issues
- Run `npm run build` - Must succeed

**Git Safety:**
- NEVER update git config
- NEVER run destructive commands without explicit user request
- NEVER skip hooks
- NEVER force push to main/master
- Only commit when user explicitly asks

**Commit message format:**
```
Summary of changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 🚨 DEVELOPMENT COMMANDS

```bash
# Development
npm run dev                    # Start dev server (port 3000)
pkill -f "next dev" && npm run dev  # Clean restart

# Quality Checks
npm run lint
npm run type-check
npm run build

# Database
npx prisma db push
npx prisma generate
```

## 🚨 MEMORY MANAGEMENT (CRITICAL)

**MANDATORY: Check memory BEFORE starting any session work!**

### **Why This Matters:**
- Next.js 15 + Turbopack uses 2-4GB per dev server instance
- Multiple dev servers = memory exhaustion and system crashes
- Playwright tests use significant memory (especially with workers)
- macOS may have multiple stale Node processes running

### **AT START OF EVERY SESSION:**

```bash
# 1. ALWAYS run memory check first
./check-memory.sh

# 2. Kill any existing dev servers/tests
pkill -f "next dev"
pkill -f "playwright"

# 3. Verify clean state
ps aux | grep -E "next-server|playwright" | grep -v grep

# 4. Start ONLY ONE dev server
npm run dev
```

### **Memory Check Script Usage:**
```bash
./check-memory.sh  # Shows system status, duplicate processes, warnings
```

**Script alerts you to:**
- ⚠️ Duplicate dev servers (2+ next-server processes)
- ⚠️ High memory usage (>8GB Node processes)
- 🎯 Active test processes
- 💡 Quick cleanup commands

### **Running Tests (Memory-Safe):**

```bash
# ALWAYS use limited workers to prevent memory exhaustion
npx playwright test <test-file> --workers=1  # Safest
npx playwright test <test-file> --workers=2  # Balance

# NEVER run with default workers (3+) for long test suites
```

### **Test Configuration (playwright.config.ts):**
```typescript
workers: process.env.CI ? 1 : 2,  // NOT 3+
use: {
  video: 'retain-on-failure',     // NOT 'on'
  trace: 'retain-on-failure',     // NOT 'on'
}
```

### **Signs of Memory Issues:**
- Terminal warnings: "JavaScript heap out of memory"
- System slowdown or beach ball
- Multiple `next-server` processes in Activity Monitor
- Test timeouts or hangs
- "ENOMEM" errors

### **Emergency Cleanup:**
```bash
# Kill everything and start fresh
pkill -f "next dev"
pkill -f "playwright"
pkill -f "node"

# Wait 5 seconds
sleep 5

# Verify clean
./check-memory.sh

# Restart
npm run dev
```

### **Prevention Checklist:**

**Before Starting Dev Server:**
- ✅ Run `./check-memory.sh`
- ✅ Kill existing servers: `pkill -f "next dev"`
- ✅ Only start ONE instance: `npm run dev`
- ✅ NEVER run multiple `npm run dev` commands

**Before Running Tests:**
- ✅ Verify only ONE dev server is running
- ✅ Use `--workers=1` or `--workers=2` (NOT 3+)
- ✅ Run test suites sequentially, not all at once
- ✅ Kill test processes after completion

**During Long Sessions:**
- ✅ Run `./check-memory.sh` every hour
- ✅ Restart dev server if memory > 4GB
- ✅ Watch for duplicate processes

### **NEVER:**
- ❌ Start multiple dev servers simultaneously
- ❌ Run tests without checking memory first
- ❌ Use default Playwright workers (3+) for large suites
- ❌ Leave test processes running in background
- ❌ Ignore memory warnings

### **Production Settings:**
```json
// next.config.js already configured:
turbopack: { memoryLimit: 8192 }  // Per instance limit

// package.json test scripts:
"test:portal": "NODE_OPTIONS='--max-old-space-size=4096' npx playwright test tests/15-*.spec.ts --workers=1"
```

**CRITICAL**: If you see duplicate `next-server` processes, IMMEDIATELY run:
```bash
pkill -f "next dev" && npm run dev
```

## 🚨 PLAYWRIGHT E2E TESTING INFRASTRUCTURE (CRITICAL)

**MANDATORY: Understand this testing architecture before running or modifying tests.**

### **The Problem We Solved:**
- 286 end-to-end tests × Supabase API calls = constant 429 rate limiting errors
- Pro plan still had limits on auth.admin API calls
- Tests taking 15+ minutes and failing due to rate limits, not actual bugs

### **The Solution: File-Based Session Persistence**

**Session Warmup Pattern** eliminates Supabase rate limiting:
1. **Pre-generate sessions once** using `/scripts/warmup-test-sessions.ts`
2. **Save to disk** in `/tests/.auth-sessions/`
3. **Reuse across all tests** - Zero Supabase API calls during test runs
4. **Sessions valid for 45 minutes** - Regenerate only when expired

### **Session Warmup Script Usage:**

**BEFORE running ANY Playwright tests, generate session files:**

```bash
# 1. Ensure dev server is running
npm run dev

# 2. Run warmup script (creates 6 session files)
npx ts-node scripts/warmup-test-sessions.ts

# 3. Verify session files created
ls -lh tests/.auth-sessions/
# Should see: dev-session.json, designer-session.json, customer-session.json,
#             factory-session.json, contractor-session.json, user-session.json

# 4. Run tests with session reuse (ZERO rate limiting!)
npx playwright test --workers=2
```

**When to regenerate sessions:**
- ✅ After 45 minutes (sessions expire)
- ✅ After clearing test data
- ✅ After modifying dev-login API
- ✅ If tests show "redirected to /login" errors

### **Test User Types (6 Types):**

All users managed by `/src/app/api/auth/dev-login/route.ts` (development-only endpoint):

| User Type | Email | User Type Enum | Purpose | Session File |
|-----------|-------|----------------|---------|--------------|
| **dev** | dev-user@limn.us.com | `admin` | Admin access testing | dev-session.json |
| **designer** | designer-user@limn.us.com | `employee` | Designer portal testing | designer-session.json |
| **customer** | customer-user@limn.us.com | `customer` | Customer portal testing | customer-session.json |
| **factory** | factory-user@limn.us.com | `employee` | Factory portal testing | factory-session.json |
| **contractor** | contractor-user@limn.us.com | `contractor` | Contractor portal testing | contractor-session.json |
| **user** | regular-user@limn.us.com | `employee` | Non-admin access control testing | user-session.json |

**User IDs are deterministic:**
- dev: `550e8400-e29b-41d4-a716-446655440000`
- designer: `550e8400-e29b-41d4-a716-446655440001`
- customer: `550e8400-e29b-41d4-a716-446655440002`
- factory: `550e8400-e29b-41d4-a716-446655440003`
- contractor: `550e8400-e29b-41d4-a716-446655440004`
- user: `550e8400-e29b-41d4-a716-446655440005`

### **How Session Reuse Works:**

**Auth Helper (`/tests/helpers/auth-helper.ts`) logic:**

```typescript
export async function login(page: Page, email: string, password: string) {
  // 1. Map email to user type (e.g., admin@test.com → 'dev')
  let userType = getUserTypeFromEmail(email);

  // 2. Try to load session from file FIRST
  const savedSession = loadSessionFromFile(userType);
  if (savedSession) {
    // 2a. Check if session is still valid (< 45 min old)
    const age = Date.now() - savedSession.timestamp;
    if (age < 45 * 60 * 1000) {
      // 2b. Apply cookies to browser context
      await page.context().addCookies(savedSession.cookies);

      // 2c. Navigate to dashboard
      await page.goto('/dashboard');

      // 2d. Verify not redirected to login
      if (!page.url().includes('/login')) {
        return; // ✅ SESSION REUSED - NO API CALL!
      }
    }
    // Session expired, delete file
    fs.unlinkSync(sessionFilePath);
  }

  // 3. Only if no valid session file, create new session via API
  await createNewSession(userType);
}
```

**Result**: 286 tests reuse 6 session files = **ZERO rate limiting** ✅

### **Test Commands:**

```bash
# Run full test suite (286 tests)
npx playwright test --workers=2

# Run specific test file
npx playwright test tests/01-authentication.spec.ts --workers=1

# Run all portal tests
npx playwright test tests/15-customer-portal.spec.ts tests/16-designer-portal.spec.ts tests/17-factory-portal.spec.ts --workers=2

# Run with UI (debugging)
npx playwright test --ui

# Run specific test by line number
npx playwright test tests/16-designer-portal.spec.ts:136
```

### **Session File Format:**

```json
{
  "cookies": [
    {
      "name": "sb-gwqkbjymbarkufwvdmar-auth-token",
      "value": "base64-eyJhY2Nlc3NfdG9rZW4i...",
      "domain": "localhost",
      "path": "/",
      "expires": 1794503683.363721,
      "httpOnly": false,
      "secure": false,
      "sameSite": "Lax"
    }
  ],
  "storageState": {
    "cookies": [...],
    "origins": []
  },
  "timestamp": 1759943689508  // Used for expiry check
}
```

### **CRITICAL PRE-PRODUCTION CHECKLIST:**

**Before deploying to production, verify these items:**

#### 1. **Middleware Admin Access Control (CRITICAL BUG FIX APPLIED)**
**File**: `/src/middleware.ts`

**ISSUE FIXED**: Middleware was querying wrong table and non-existent column, causing admin access to completely fail.

**Verify this code is present:**
```typescript
// Admin access control - only admins can access /admin routes
if (pathname.startsWith('/admin')) {
  const { data: userData } = await supabase
    .from('user_profiles')  // ✅ MUST be user_profiles (NOT 'users')
    .select('user_type')    // ✅ MUST only select user_type (NOT 'is_admin')
    .eq('id', user.id)
    .single();

  const isAdmin = userData?.user_type === 'admin' || userData?.user_type === 'super_admin';

  if (!isAdmin) {
    console.log(`🚫 Middleware: User ${user.id} denied access to admin area (user_type: ${userData?.user_type})`);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }
}
```

**❌ NEVER USE**:
```typescript
.from('users')              // ❌ WRONG - doesn't have user_type
.select('user_type, is_admin')  // ❌ WRONG - is_admin doesn't exist
```

#### 2. **Development-Only Code Protection**

**Verify `/src/app/api/auth/dev-login/route.ts` has protection:**
```typescript
export async function POST(request: NextRequest) {
  // CRITICAL: Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  // ... rest of dev-login logic
}
```

**Files that MUST have `NODE_ENV === 'production'` checks:**
- ✅ `/src/app/api/auth/dev-login/route.ts`
- ✅ Any other test-only API routes

#### 3. **Session Files Are Development Artifacts**

**DO NOT deploy these directories to production:**
- `/tests/.auth-sessions/` - Development session cache
- `/scripts/warmup-test-sessions.ts` - Development script

**These are .gitignored** - Verify:
```bash
grep -E "auth-sessions|warmup" .gitignore
# Should output: tests/.auth-sessions/
```

#### 4. **Test Validity in Production**

**Q**: Will tests pass in real-world production conditions?
**A**: ✅ **YES** - Session reuse doesn't affect test validity:

- **What we changed**: How sessions are *created and cached* (development-only optimization)
- **What we didn't change**: The actual authentication flow, middleware logic, access controls, or business logic
- **Test behavior**: Tests still verify real Supabase sessions, real cookies, real middleware checks
- **Production impact**: Zero - dev-login endpoint returns 404 in production, normal OAuth flow unchanged

**The session reuse pattern only optimizes test infrastructure speed/reliability, not application behavior.**

### **Troubleshooting:**

**Issue**: Tests showing "redirected to /login" errors
**Fix**:
```bash
# Regenerate sessions
npx ts-node scripts/warmup-test-sessions.ts
```

**Issue**: "Failed to create session" in warmup script
**Fix**:
```bash
# 1. Verify dev server is running
lsof -i :3000

# 2. Restart dev server if needed
pkill -f "next dev" && npm run dev

# 3. Wait 10 seconds, then retry warmup
npx ts-node scripts/warmup-test-sessions.ts
```

**Issue**: Database enum error "invalid input value for enum user_type_enum"
**Fix**: Check dev-login API - user_type must be one of: `employee`, `customer`, `contractor`, `admin`, `super_admin`

### **NEVER:**
- ❌ Commit `/tests/.auth-sessions/` files to git (contains real session tokens)
- ❌ Use dev-login endpoint in production
- ❌ Run tests without pre-warming sessions (causes rate limiting)
- ❌ Deploy middleware changes without verifying admin access control logic
- ❌ Modify session warmup script without testing all 6 user types

## 🚨 TECHNICAL STACK

- **Next.js**: 15.5.4 with App Router & Turbopack
- **Database**: Prisma 5.22.0 + PostgreSQL (Supabase)
- **API**: tRPC 11.5.1 (type-safe)
- **Auth**: Supabase Auth
- **Testing**: Jest + React Testing Library
- **Monitoring**: Sentry (errors + performance)
- **Security**: ESLint security plugin + npm audit

## 🚨 TURBOPACK CONFIGURATION

**Dev script uses Turbopack:**
```json
{
  "dev": "next dev --turbo"
}
```

**Next.js 15 config syntax:**
```javascript
// next.config.js
const nextConfig = {
  turbopack: { memoryLimit: 8192 },
  typedRoutes: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"]
    }
  }
}
```

## 🚨 CRITICAL FIXES TO REMEMBER

### Furniture Dimension System ✅
- React key duplication: Use `key={${groupName}-${field}}`
- Dual units: Always show inches + cm
- Auto conversions: `kg = lbs * 0.453592`, `cm = inches * 2.54`
- Files: `/src/components/furniture/DimensionDisplay.tsx`

### Playwright Chromium Setup
If version mismatch occurs:
```bash
cd /Users/eko3/Library/Caches/ms-playwright
ln -sf chromium-[installed] chromium-[expected]
```

## 🚨 ADMIN PORTAL (Phase 1 Complete) ✅

**Database:**
- `user_permissions` table (can_view, can_create, can_edit, can_delete, can_approve)
- `default_permissions` table (user_type + module)
- 6 user types × 11 modules = 66 default permissions

**API:** `/src/server/api/routers/admin.ts`
- users.list, users.get, users.update
- permissions.getUserPermissions, updateUserPermission, bulkUpdatePermissions
- permissions.getDefaultPermissions, resetToDefaults

**UI:** `/admin/users`
- UserManagementPanel + PermissionPanel
- Search, filter by user type
- Toggle permissions per module
- Global CSS styled (~400 lines)

## 🚨 SECURITY

**ESLint Security Rules Enabled:**
- Object injection detection
- Unsafe regex detection
- Buffer security
- Child process monitoring
- Eval expression detection
- CSRF protection
- File system security
- Cryptographic security

**Run security checks:**
```bash
npm run security:check  # Full audit
```

## 🚨 STYLING EXAMPLES REMOVED

This file previously had extensive styling examples. They've been removed to reduce size. The key rules:
1. All styling in globals.css
2. Semantic class names only
3. CSS variables for theme
4. No hardcoded Tailwind utilities

## 🚨 PROACTIVE BEHAVIOR

- Use TodoWrite tool for complex multi-step tasks
- Mark todos completed immediately after finishing
- Never batch multiple completions
- Use Task tool for open-ended searches
- Check browser console for runtime errors
- Test functionality before delivery

## 🚨 TONE & VERBOSITY

- Concise, direct responses (< 4 lines when possible)
- Match detail level with task complexity
- Minimize preamble/postamble
- No unnecessary explanations unless requested
- Example: "2+2" → "4" (not "The answer is 4.")

---

**END OF CRITICAL INSTRUCTIONS**

*All requirements above are NON-NEGOTIABLE and apply to EVERY piece of code written.*
