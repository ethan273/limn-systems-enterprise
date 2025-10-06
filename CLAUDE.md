# CLAUDE CODE INSTRUCTIONS FOR LIMN SYSTEMS ENTERPRISE

## 🚨 CORE DEVELOPMENT PHILOSOPHY

**BUILD THE BEST APP POSSIBLE - NO COMPROMISES**
- Time is NOT a constraint - Quality over speed
- Previous implementations are REFERENCE ONLY - Build better if possible
- No shortcuts, no temp fixes, no workarounds - EVER
- Excellence in every detail
- Zero tolerance for technical debt

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
