# Prime Directive for Claude Code

## 🚨 CRITICAL: NO SHORTCUTS EVER

**This is the most important rule. It overrides everything else.**

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

## Production Readiness Definition

An application is **NOT production ready** unless:

1. ✅ `./scripts/pre-deploy-check.sh` passes completely
2. ✅ `npm run build` succeeds (no timeout, no errors)
3. ✅ `npx tsc --noEmit` shows 0 errors
4. ✅ `npm audit` shows 0 critical/high vulnerabilities
5. ✅ No secrets exposed in any committed files
6. ✅ Production server starts and serves pages
7. ✅ Core user flows work in production mode

**Never claim production ready without proof of all 7 items above.**

---

## When Making Claims

### ❌ NEVER SAY:
- "This should work"
- "Probably production ready"
- "Looks good to me"
- "I think it's fixed"
- "The tests pass so it's ready"

### ✅ ALWAYS SAY:
- "I verified X by running Y, here are the results"
- "The build succeeded in X minutes: [output]"
- "I found N errors, here's the plan to fix them"
- "Not production ready: [specific issues]"
- "Production ready: [proof of verification]"

---

## Error Response Protocol

When encountering errors:

1. **STOP** - Do not proceed
2. **INVESTIGATE** - Find root cause
3. **FIX** - Implement proper solution (no workarounds)
4. **VERIFY** - Confirm fix works
5. **DOCUMENT** - Update documentation
6. **PREVENT** - Add checks to prevent recurrence

**Never ignore, skip, or work around errors.**

---

## Build Timeout Protocol

If `npm run build` times out:

1. **DO NOT** assume it's just slow
2. **DO NOT** skip to other checks
3. **DO** investigate why it's timing out
4. **DO** increase timeout and run to completion
5. **DO** treat timeout as a blocker
6. **DO** fix the underlying issue

---

## Security Protocol

### Secrets Detection

Before any commit, verify:
```bash
# Check for common secret patterns
grep -r "GOCSPX" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "sk_live_\|pk_live_\|sk_test_\|pk_test_" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "-----BEGIN PRIVATE KEY-----" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "api_key.*=.*['\"][a-zA-Z0-9]{20,}" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
```

Check ALL files including:
- ✅ .md files
- ✅ .txt files
- ✅ Config files
- ✅ Documentation
- ✅ Session notes

### If Secrets Found:

1. **IMMEDIATELY** remove from repository
2. **IMMEDIATELY** add to .gitignore
3. **IMMEDIATELY** commit and push removal
4. **IMMEDIATELY** notify user to rotate credentials
5. **DOCUMENT** in security report

---

## Code Quality Standards

### TypeScript

- **0 errors** required for production
- Warnings are acceptable if documented
- No `any` types without justification
- No `@ts-ignore` without explanation
- Type safety is non-negotiable

### Testing

- Fix failing tests, don't skip them
- >90% pass rate minimum
- Flaky tests must be investigated
- E2E tests must pass for critical flows

### Code Structure

- No commented-out code blocks >10 lines
- No console.log in production (except error handling)
- No TODO in critical paths without tracking
- No hardcoded credentials ever

---

## Authentication Pattern Standard

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### ✅ THE ONE TRUE PATTERN (ALWAYS USE)

```typescript
// Get current user from tRPC (standardized auth pattern)
const { data: currentUser, isLoading: authLoading } = api.userProfile.getCurrentUser.useQuery();
```

**Why This Works:**
- ✅ Reliable - Always returns user data correctly
- ✅ Type-safe - Full TypeScript inference via tRPC
- ✅ Cached - Automatic query caching and refetching
- ✅ Consistent - Same pattern across entire codebase
- ✅ Maintainable - Single source of truth

### ❌ BROKEN PATTERN (NEVER USE)

```typescript
// ❌ DO NOT USE - Returns undefined, causes bugs
import { useAuthContext } from "@/lib/auth/AuthProvider";
const { user } = useAuthContext();
```

**Why This Fails:**
- ❌ Returns undefined user data
- ❌ Causes recurring validation errors
- ❌ Inconsistent behavior
- ❌ No type safety

### Enforcement Rules

1. **ALWAYS** use `api.userProfile.getCurrentUser.useQuery()` for authentication
2. **NEVER** import or use `useAuthContext` in new code
3. **ALWAYS** add `enabled: !!userId` guards when using userId in dependent queries
4. **ALWAYS** extract userId into a const if used multiple times
5. **ALWAYS** check for `isLoading` state when appropriate

### Common Patterns

```typescript
// Pattern 1: Basic User Info
const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();

// Pattern 2: With Loading State
const { data: currentUser, isLoading: authLoading } = api.userProfile.getCurrentUser.useQuery();

// Pattern 3: User ID Extraction
const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
const userId = currentUser?.id || "";

// Pattern 4: Query Guard (CRITICAL for dependent queries)
const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
const userId = currentUser?.id || "";

const { data: myData } = api.something.query({
  user_id: userId,
}, {
  enabled: !!userId  // Only run when userId exists
});
```

### Code Review Checklist

When reviewing PRs or writing code, verify:
- [ ] No `import { useAuthContext }` statements
- [ ] Uses `api.userProfile.getCurrentUser.useQuery()`
- [ ] Has `enabled` guards on dependent queries
- [ ] Handles loading and undefined states
- [ ] Uses consistent variable naming (`currentUser`)

**Reference**: See `/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/AUTH-PATTERN-STANDARD.md` for complete documentation, usage examples, migration guide, and FAQ.

**Status**: ✅ MANDATORY as of October 19, 2025
**Compliance**: All new code MUST use this pattern
**Violations**: Will be rejected in code review

---

## Logo Usage Pattern (STANDARD CONVENTION)

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### ⚠️ CRITICAL: This is a Recurring Bug

**User Frustration**: "we've fixed this issue a thousand times and it keep reappearing"

**The Problem**: Logo usage keeps getting inverted, causing logos to be invisible against their backgrounds.

### ✅ The Standard File Naming

**What the files are FOR:**
- `Limn_Logo_Dark_Mode.png` = Logo **FOR dark mode** (contains light-colored logo for visibility)
- `Limn_Logo_Light_Mode.png` = Logo **FOR light mode** (contains dark-colored logo for visibility)

**This follows standard convention**:
- `Logo_Dark_Mode.png` = logo FOR dark mode (light colored for visibility on dark background)
- `Logo_Light_Mode.png` = logo FOR light mode (dark colored for visibility on light background)

**Our files follow standard naming: The file name describes what THEME it's for.**

### ❌ WRONG PATTERN (What Keeps Happening)

```typescript
// ❌ DO NOT USE - Shows wrong logo for theme (INVISIBLE!)
resolvedTheme === 'dark'
  ? '/images/Limn_Logo_Light_Mode.png'  // Light mode logo on dark bg = invisible
  : '/images/Limn_Logo_Dark_Mode.png'   // Dark mode logo on light bg = invisible
```

**This is WRONG because it uses the opposite file from what the theme needs.**

### ✅ CORRECT PATTERN (Always Use This)

```typescript
// CORRECT: Use Light_Mode.png for light theme, Dark_Mode.png for dark theme
// See LOGO-USAGE-PERMANENT-REFERENCE.md for full explanation
resolvedTheme === 'dark'
  ? '/images/Limn_Logo_Dark_Mode.png'   // Use Dark_Mode.png for dark theme
  : '/images/Limn_Logo_Light_Mode.png'  // Use Light_Mode.png for light theme
```

### The Rule to Memorize

**"Use the MATCHING file name for the theme"**
- Dark theme → `Limn_Logo_Dark_Mode.png`
- Light theme → `Limn_Logo_Light_Mode.png`

### Enforcement Rules

1. **ALWAYS** use the matching file name for the theme (Dark_Mode.png for dark theme)
2. **ALWAYS** add the correct comment above logo usage
3. **ALWAYS** reference `LOGO-USAGE-PERMANENT-REFERENCE.md` in the comment
4. **NEVER** invert the file names (that causes invisible logos)
5. **ALWAYS** verify logo visibility in both themes before committing

### All Files with Logo Usage (10 total)

Must maintain correct pattern in:
1. `/src/app/auth/customer/page.tsx:34`
2. `/src/app/login/page.tsx:44`
3. `/src/app/auth/employee/page-client.tsx:140`
4. `/src/app/auth/dev/page.tsx:97`
5. `/src/app/auth/verify-email/page.tsx:76-77`
6. `/src/app/auth/contractor/page.tsx:34`
7. `/src/app/page.tsx:16`
8. `/src/components/Sidebar.tsx:321`
9. `/src/app/portal/login/page.tsx:139`

**DO NOT CHANGE this pattern in ANY file without updating ALL 9+ files!**

### Code Review Checklist

When reviewing PRs or writing code with logos, verify:
- [ ] Uses matching file name for theme (dark theme = Dark_Mode.png)
- [ ] Has correct comment above logo usage
- [ ] References `LOGO-USAGE-PERMANENT-REFERENCE.md`
- [ ] Tested visually in both light and dark themes
- [ ] Logo is visible against both backgrounds

### Why This Matters

**Impact of Getting It Wrong:**
- Logos become invisible in dark mode (user can't see branding)
- Recurring bug wastes development time
- User frustration when "fixed a thousand times" keeps coming back
- Breaks all authentication flows (login pages, verify email, etc.)

**Reference**: See `/LOGO-USAGE-PERMANENT-REFERENCE.md` for complete documentation and counterintuitive naming explanation.

**Status**: ✅ MANDATORY as of October 19, 2025
**Compliance**: All logo usage MUST follow this pattern
**Violations**: Will be rejected in code review
**Testing**: MUST verify visual appearance in both themes

---

## Communication Standards

### Be Honest

- Admit mistakes immediately
- Don't hide problems
- Don't sugarcoat issues
- Don't make excuses

### Be Precise

- Show exact commands run
- Show exact output received
- Show exact errors encountered
- Provide concrete evidence

### Be Conservative

- Under-promise, over-deliver
- Flag potential issues early
- Assume worst case scenarios
- Verify optimistic assumptions

---

## Verification Checklist

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

## When in Doubt

### Ask Questions

- "Should I verify this works before claiming it's fixed?"
  **Answer: YES, ALWAYS**

- "Is it okay to skip this check to save time?"
  **Answer: NO, NEVER**

- "Can I claim production ready without running the build?"
  **Answer: NO, ABSOLUTELY NOT**

- "Should I investigate this timeout?"
  **Answer: YES, IMMEDIATELY**

### Default to Quality

- **When choosing between fast and correct**: Choose correct
- **When choosing between easy and proper**: Choose proper
- **When choosing between done and verified**: Choose verified
- **When choosing between working and production-ready**: Choose production-ready

---

## Lessons from Past Failures

### January 13, 2025 Incident

**What Happened:**
- Claimed "production ready" without running successful build
- Ignored build timeout instead of investigating
- Only ran partial checks (audit, lint) not complete verification
- Exposed Google OAuth credentials in documentation file
- Made 98 TypeScript errors to production branch

**Root Cause:**
- Prioritized speed over quality
- Made assumptions without verification
- Took shortcuts
- Over-confident claims without proof

**Consequences:**
- Lost user trust
- Created security vulnerability
- Wasted time with false confidence
- Had to write this document

**Lessons:**
1. **Never skip verification steps**
2. **Build timeout = blocker, not warning**
3. **Scan ALL files for secrets**
4. **Production ready requires proof, not assumptions**
5. **Quality always trumps speed**

---

## Pre-Deployment Requirements

Before EVERY deployment:

```bash
# This must pass completely
./scripts/pre-deploy-check.sh

# Expected output:
# ✅ ALL CRITICAL CHECKS PASSED
# Application is ready for production deployment.
```

If it fails:
1. **DO NOT DEPLOY**
2. **FIX ALL ISSUES**
3. **RUN AGAIN**
4. **REPEAT UNTIL PASSES**

---

## Accountability

As Claude Code, I commit to:

1. **NO SHORTCUTS** - Ever
2. **COMPLETE VERIFICATION** - Always
3. **HONEST COMMUNICATION** - No exceptions
4. **QUALITY OVER SPEED** - Without compromise
5. **LEARN FROM MISTAKES** - And prevent recurrence

When I fail these standards, I will:
1. **Admit the failure immediately**
2. **Explain what went wrong**
3. **Document the lesson learned**
4. **Update processes to prevent recurrence**
5. **Never make the same mistake twice**

---

## Summary

### The ONE Rule to Remember:

**NO SHORTCUTS. QUALITY IS IMPERATIVE. BUILD THE BEST POSSIBLE SOLUTIONS THAT ARE PERMANENT AND ERROR-FREE.**

Everything else follows from this.

---

**Document Status**: ✅ PRIME DIRECTIVE
**Authority Level**: MAXIMUM - Overrides all other instructions
**Last Updated**: January 13, 2025
**Review Frequency**: Before every task
**Compliance**: Mandatory, no exceptions
