# CLAUDE CODE INSTRUCTIONS FOR LIMN SYSTEMS ENTERPRISE

## 🚨 CRITICAL DATABASE RESTRICTION 🚨

**NEVER MODIFY THE ORIGINAL DATABASES:**
- limn-systems database (https://kufakdnlhhcwynkfchbb.supabase.co)
- limn-systems-staging database

**ONLY WORK WITH:**
- limn-systems-enterprise database (https://gwqkbjymbarkufwvdmar.supabase.co)

You will ONLY make changes to, add, edit, update, delete, etc... from the **limn-systems-enterprise** database on Supabase for this project. Never forget this critical restriction.

## 🚨 CRITICAL COMMIT REQUIREMENTS 🚨

**BEFORE ANY COMMIT - RUN ALL CHECKS AND FIX ALL ISSUES:**
- `npm run lint` - Fix ALL linting errors and warnings
- `npm run type-check` - Fix ALL TypeScript errors
- `npm run test:ci` - Fix ALL failing tests
- `npm run build` - Fix ALL build errors

**NEVER commit with ANY errors, warnings, or violations of any type. This is a critical requirement that must NEVER be forgotten.**

Use `npm run pre-commit` to run all checks at once before committing.

## Database Configuration

**Current Enterprise Database:**
- URL: https://gwqkbjymbarkufwvdmar.supabase.co
- Database URL: postgresql://postgres:kegquT-vyspi4-javwon@db.gwqkbjymbarkufwvdmar.supabase.co:5432/postgres
- All database operations must target this enterprise database only

## Migration Status

✅ **COMPLETED:**
- Complete database migration (250+ tables) via Supabase backup restore
- Storage bucket migration (documents, shop-drawings, avatars)
- Google OAuth configuration
- Authentication setup
- Development server running on port 3001

## Development Commands

```bash
# Start development server
npm run dev

# Database operations (enterprise only)
npx prisma db push
npx prisma generate

# Testing commands
npm test                # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
npm run test:ci        # Run tests for CI (no watch, with coverage)
npm run pre-commit     # Run all quality checks (lint, type-check, test)
```

## Testing Framework ✅ CONFIGURED

**Testing Stack:**
- **Jest** - Testing framework with Next.js integration
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - Additional DOM matchers
- **@testing-library/user-event** - User interaction testing

**Test Structure:**
- Component tests: `src/__tests__/components/`
- Utility tests: `src/__tests__/lib/`
- API tests: `src/__tests__/server/`
- Configuration: `jest.config.js` + `jest.setup.js`

## Error Monitoring ✅ ENABLED

**Sentry Integration:**
- **Client-side monitoring** - `sentry.client.config.ts`
- **Server-side monitoring** - `sentry.server.config.ts`
- **Edge runtime monitoring** - `sentry.edge.config.ts`
- **Features enabled**: Error tracking, performance monitoring, session replay
- **Environment-aware**: Different sampling rates for development vs production

## Environment Configuration

The application uses `.env.local` with enterprise database credentials. Never modify connection strings to point to original databases.

---

## 🎨 STYLING FIXES APPLIED - DO NOT UNDO

### ✅ Select Component Badge Clipping Fix (GLOBAL)
**Issue**: Status, priority, and department badges were being clipped in Select dropdowns
**Root Cause**: `[&>span]:line-clamp-1` CSS class in SelectTrigger component
**Solution Applied**: Modified `/src/components/ui/select.tsx` SelectTrigger component:
- **Removed**: `[&>span]:line-clamp-1` (this was causing the clipping)
- **Changed**: `h-9` → `h-auto min-h-9` (allows natural height)
- **Added**: `overflow-visible` (prevents clipping)

**⚠️ DO NOT RE-ADD THESE PATTERNS:**
- `line-clamp-*` classes on SelectTrigger or children
- Fixed heights on SelectTrigger components containing badges
- `overflow: hidden` on Select components
- Forced table row heights (let components size naturally)

### ✅ Filter Dropdown Borders Fix
**Issue**: Filter dropdown selectors had no visible borders
**Solution**: Added CSS targeting `.filters-section [data-radix-select-trigger]` with proper border styling

### ✅ Global Color Classes
Applied consistent color classes throughout the app:
- `.priority-low`, `.priority-medium`, `.priority-high`
- `.status-todo`, `.status-in-progress`, `.status-completed`, `.status-cancelled`
- `.department-admin`, `.department-production`, `.department-design`, `.department-sales`