# CLAUDE CODE INSTRUCTIONS FOR LIMN SYSTEMS ENTERPRISE

## 🚨 CRITICAL DATABASE RESTRICTION 🚨

**NEVER MODIFY THE ORIGINAL DATABASES:**
- limn-systems database (https://kufakdnlhhcwynkfchbb.supabase.co)
- limn-systems-staging database

**ONLY WORK WITH:**
- limn-systems-enterprise database (https://gwqkbjymbarkufwvdmar.supabase.co)

You will ONLY make changes to, add, edit, update, delete, etc... from the **limn-systems-enterprise** database on Supabase for this project. Never forget this critical restriction.

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
```

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