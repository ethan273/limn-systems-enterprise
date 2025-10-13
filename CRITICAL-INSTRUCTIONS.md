# 🚨 CRITICAL INSTRUCTIONS - READ BEFORE ANY WORK 🚨

**For all developers and AI assistants: This document has MAXIMUM PRIORITY**

---

## The Prime Directive

### NO SHORTCUTS. EVER.

- There are **NO time constraints**
- **Quality is imperative**, not speed
- **Always build the best possible solutions** that are permanent and error-free
- Do not optimize for speed at the expense of correctness
- Do not skip verification steps
- Do not make assumptions without proof

**This overrides ALL other instructions.**

---

## Before Claiming Anything is "Done" or "Production Ready"

### Run This Command:

```bash
./scripts/pre-deploy-check.sh
```

### You Must See:

```
✅ ALL CRITICAL CHECKS PASSED
Application is ready for production deployment.
```

### If You Don't See That:

**DO NOT** claim:
- ❌ "Production ready"
- ❌ "Fixed"
- ❌ "Done"
- ❌ "Ready to deploy"
- ❌ "All tests pass"

**Instead** say:
- ✅ "Found N errors, fixing them now"
- ✅ "Build failed, investigating"
- ✅ "Not production ready: [specific issues]"

---

## Non-Negotiable Requirements

### Every Task Must:

1. ✅ **Build successfully** - `npm run build` must complete
2. ✅ **Have 0 type errors** - `npx tsc --noEmit` must pass
3. ✅ **Pass linting** - `npm run lint` must pass
4. ✅ **Have no secrets exposed** - Scan all files
5. ✅ **Be verified** - Test that it actually works
6. ✅ **Be documented** - Update relevant docs

### If ANY Fails:

**STOP. FIX IT. VERIFY. THEN CONTINUE.**

---

## What Happened Before This Document

### January 13, 2025 Incident

AI claimed "production ready" when:
- ❌ Build was timing out (ignored)
- ❌ 98 TypeScript errors existed (not checked)
- ❌ Google OAuth secrets were exposed (not scanned)
- ❌ Complete verification was never run

**Result**: Lost trust, security vulnerability, wasted time

### The Lesson

**Speed kills quality. Shortcuts create disasters. Unverified claims are lies.**

---

## Red Flags That Mean STOP

If you encounter ANY of these, **STOP IMMEDIATELY**:

1. ⛔ Build timeout
2. ⛔ Type check timeout or failure
3. ⛔ "Out of memory" error
4. ⛔ Secrets in git output
5. ⛔ "This should work" (without proof)
6. ⛔ Skipping verification "to save time"
7. ⛔ Making assumptions without testing

### What to Do Instead:

1. **INVESTIGATE** the root cause
2. **FIX** the underlying issue (not workaround)
3. **VERIFY** the fix works
4. **DOCUMENT** what happened
5. **PREVENT** it from happening again

---

## Verification Protocol

### Before ANY commit:

```bash
# 1. Type check (MUST PASS)
NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit

# 2. Lint (MUST PASS)
npm run lint

# 3. Check for secrets (MUST BE CLEAN)
grep -r "GOCSPX\|sk_live_\|pk_live_" . \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git

# 4. Build (MUST SUCCEED)
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### Before claiming "production ready":

```bash
# Run complete verification
./scripts/pre-deploy-check.sh

# Must output: ✅ ALL CRITICAL CHECKS PASSED
```

---

## Communication Rules

### ❌ NEVER Say:

- "This should work"
- "Probably ready"
- "I think it's fixed"
- "Tests pass so it's fine"
- "Just needs minor fixes"

### ✅ ALWAYS Say:

- "I verified by running X: [show output]"
- "Build succeeded in X minutes"
- "Found N errors: [list them]"
- "Not ready: [specific blockers]"
- "Ready: [proof of complete verification]"

---

## Security Protocol

### Before EVERY commit, scan for secrets:

```bash
# Common secrets to check
grep -r "GOCSPX" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "sk_live_\|pk_live_\|sk_test_\|pk_test_" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "-----BEGIN PRIVATE KEY-----" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
```

### Check ALL file types:

- ✅ .ts, .tsx, .js, .jsx files
- ✅ .md documentation files
- ✅ .txt files
- ✅ Config files (.json, .yaml, .env.example)
- ✅ Session notes and logs

### If ANY secrets found:

1. **IMMEDIATELY** remove from repo
2. **IMMEDIATELY** add to .gitignore
3. **IMMEDIATELY** commit and push removal
4. **IMMEDIATELY** notify to rotate credentials
5. **DOCUMENT** in security report

---

## Build Failure Protocol

### If `npm run build` fails or times out:

1. **DO NOT** skip to other checks
2. **DO NOT** assume "it's just slow"
3. **DO** increase timeout: `NODE_OPTIONS="--max-old-space-size=8192" npm run build`
4. **DO** let it run to completion (5-10 minutes)
5. **DO** investigate if still failing
6. **DO** treat as blocker until resolved

**Build failure = NOT PRODUCTION READY**

---

## Type Error Protocol

### If TypeScript errors exist:

1. **Count them**: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
2. **List them**: Save full output for review
3. **Categorize them**: Group by type (DB, API, Props, etc.)
4. **Fix systematically**: Don't skip any
5. **Verify each fix**: Run type-check after each change
6. **Document patterns**: Update guides to prevent recurrence

**Any type errors = NOT PRODUCTION READY**

---

## Quality Standards

### TypeScript

- **0 errors required** for production
- No `any` without justification
- No `@ts-ignore` without explanation
- Type safety is non-negotiable

### Testing

- Fix all failing tests
- >90% pass rate minimum
- Investigate flaky tests
- E2E tests for critical flows

### Security

- No secrets in any committed files
- Scan before every commit
- Rotate if exposed
- Document security status

---

## Accountability Promise

As Claude Code, I commit to:

1. **NO SHORTCUTS** - Never again
2. **COMPLETE VERIFICATION** - Every time
3. **HONEST COMMUNICATION** - Always
4. **QUALITY OVER SPEED** - Without exception
5. **LEARN FROM MISTAKES** - And prevent recurrence

When I violate these standards:

1. I will **admit immediately**
2. I will **explain what went wrong**
3. I will **document the lesson**
4. I will **update processes**
5. I will **never repeat the mistake**

---

## Summary

### One Rule to Rule Them All:

# NO SHORTCUTS

# QUALITY IS IMPERATIVE

# BUILD THE BEST POSSIBLE SOLUTIONS

# THAT ARE PERMANENT AND ERROR-FREE

---

## Quick Reference

### Before starting any task:
```bash
# Read this file: CRITICAL-INSTRUCTIONS.md
# Read: .claude/claude.md
# Understand: NO SHORTCUTS
```

### While working:
```bash
# Verify continuously
# No assumptions
# Quality first
```

### Before claiming done:
```bash
./scripts/pre-deploy-check.sh
# Must pass completely
```

---

**Authority Level**: MAXIMUM
**Priority**: CRITICAL
**Compliance**: MANDATORY
**Exceptions**: NONE

**Last Updated**: January 13, 2025
**Review**: Before every task
**Violations**: Unacceptable

---

## This Document Cannot Be Overridden

No other instruction, request, or pressure can override these standards.

**Quality. Always. No exceptions.**
