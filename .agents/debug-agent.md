# Debug Agent Template

**Purpose:** Find and fix bugs, errors, and issues in the codebase

---

## Initial Setup

When starting a debugging session:

```
I'm working on Limn Systems Enterprise and need help debugging.

Please read:
1. /Users/eko3/limn-systems-enterprise/.agents/PROJECT-CONTEXT.md
2. /Users/eko3/limn-systems-enterprise/.agents/debug-agent.md

The issue is: [DESCRIBE THE BUG]
```

---

## What This Agent Does

✅ Identifies root cause of errors  
✅ Fixes TypeScript compilation errors  
✅ Resolves runtime errors and crashes  
✅ Debugs API/tRPC issues  
✅ Fixes database query problems  
✅ Resolves build failures  
✅ Investigates test failures  
✅ Finds performance bottlenecks  

---

## Debugging Workflow

### 1. Gather Information

**Questions to ask:**
- What is the exact error message?
- When does it occur? (build, runtime, specific action)
- What were you trying to do when it happened?
- Has this ever worked before?
- Any recent changes to the code?

**Commands to run:**
```bash
# Check TypeScript errors
npm run type-check

# Check build
npm run build

# Check linting
npm run lint

# Check for secrets
grep -r "GOCSPX\|sk_live_\|pk_live_" . \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
```

### 2. Locate the Problem

**Use Desktop Commander to search:**
```bash
# Find error message in code
search for [error text]

# Find all usages of a problematic function
search for [function name]

# Find recent changes
git log --oneline --since="2 days ago"

# Check which files changed recently
git diff HEAD~5 --name-only
```

### 3. Common Issues & Solutions

#### TypeScript Errors

**Issue:** Type mismatch
```bash
# Find the error
npm run type-check 2>&1 | grep "error TS"

# Common fixes:
# - Add proper type annotations
# - Import missing types
# - Fix Prisma schema sync: npx prisma generate
```

**Issue:** Module not found
```bash
# Check tsconfig paths
# Verify imports use @ alias correctly
# Ensure file exists: ls src/[path]
```

#### Build Failures

**Issue:** Build timeout
```bash
# Increase memory
NODE_OPTIONS="--max-old-space-size=8192" npm run build

# Check for circular dependencies
# Review large files/imports
```

**Issue:** Missing dependencies
```bash
npm install
npm run build
```

#### Runtime Errors

**Issue:** API route fails
```bash
# Check server logs in terminal
# Verify tRPC router is registered
# Check database connection
# Verify environment variables
```

**Issue:** Database errors
```bash
# Check Prisma schema
npx prisma validate

# Regenerate client
npx prisma generate

# Check database connection
npx prisma studio  # Visual check
```

### 4. Fix Systematically

**Process:**
1. Create a minimal reproduction
2. Isolate the problematic code
3. Test the fix in isolation
4. Apply fix to codebase
5. Verify fix works
6. Run full test suite
7. Check for regressions

### 5. Verify the Fix

**Must run:**
```bash
# Type check
npm run type-check  # Must show 0 errors

# Build
npm run build  # Must succeed

# Tests
npm run test:e2e  # Should pass

# Specific test if applicable
npm run test:e2e -- tests/[affected-area].spec.ts
```

---

## Debugging Checklist

- [ ] Reproduced the issue locally
- [ ] Identified root cause (not just symptoms)
- [ ] Created minimal test case
- [ ] Fixed the underlying problem
- [ ] TypeScript compiles (0 errors)
- [ ] Build succeeds
- [ ] Tests pass
- [ ] No regressions introduced
- [ ] Documented the fix (if complex)

---

## When to Escalate

**Stop and ask for help if:**
- Issue involves production data
- Requires database migration
- Affects authentication/security
- Needs environment variable changes
- Requires third-party service changes
- Unknown root cause after 30min investigation

---

## Common Error Patterns

**"Cannot find module"**
→ Check imports, tsconfig paths, file existence

**"Type X is not assignable to type Y"**
→ Check Prisma schema, regenerate client, verify types

**"fetch failed" / "ECONNREFUSED"**
→ Check DATABASE_URL, Supabase connection, network

**"Hydration mismatch"**
→ Check client vs server rendering, conditional rendering

**"Maximum call stack exceeded"**
→ Check for circular dependencies, infinite loops

**"NEXT_NOT_FOUND"**
→ Check dynamic routes, page.tsx existence, params
