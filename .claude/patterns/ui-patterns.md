# UI Patterns

**Part of Prime Directive** | [Back to Main](../CLAUDE.md)

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

---

## Navigation Module Organization (STANDARD CONVENTION)

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### Module Organization Rules

**Email Campaign & Template Pages**:
- ✅ **CORRECT**: Email pages belong in **Marketing** module
- ❌ **WRONG**: Email pages in Admin module

**Rationale**:
- Email campaigns are marketing tools, not admin configuration
- Marketers need access without full admin permissions
- Logical grouping: Marketing = Flipbooks + Email Campaigns + Templates
- Admin module should contain system administration only

### ✅ CORRECT PATTERN (Marketing Module)

```typescript
{
  label: "Marketing",
  icon: BookOpen,
  items: [
    { label: "Email Campaigns", href: "/admin/email-campaigns" },
    { label: "Email Templates", href: "/admin/email-templates" },
    { label: "Flipbook Library", href: "/flipbooks" },
    { label: "Flipbook Builder", href: "/flipbooks/builder" },
    { label: "Flipbook Analytics", href: "/flipbooks/analytics" },
  ]
}
```

**Note**: Routes still use `/admin/email-*` paths for now (route refactoring is separate task)

### Admin Module Access

**Allowed User Types**:
```typescript
{
  label: "Admin",
  icon: Shield,
  allowedUserTypes: ['super_admin', 'admin'], // Both super_admin AND admin
  items: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Users", href: "/admin/users" },
    { label: "Roles", href: "/admin/roles" },
    { label: "Security Events", href: "/admin/security-events" },
    { label: "Activity", href: "/admin/activity" },
    { label: "Analytics", href: "/admin/analytics" },
    { label: "API Management", href: "/admin/api-management" },
    { label: "Portal Management", href: "/admin/portals" },
    { label: "Approvals", href: "/admin/approvals" },
    { label: "Export", href: "/admin/export" },
  ]
}
```

**CRITICAL**: Both `super_admin` AND `admin` user types should see Admin module

### RBAC Role Loading Pattern

**Problem**: Admin module flickering or disappearing during initial load

**Solution**: Show modules during loading, hide only after roles loaded
```typescript
if (rolesLoading || roles.length === 0) {
  // During loading, show all modules to prevent flickering
  // Once loaded, if no roles, hide restricted modules
  return rolesLoading ? true : false;
}
```

### Module Expansion State

**Marketing Module Expansion**:
```typescript
"Marketing": pathname.startsWith('/flipbooks') || pathname.startsWith('/admin/email'),
```

**Admin Module Expansion**:
```typescript
"Admin": pathname.startsWith('/admin') && !pathname.startsWith('/admin/email'),
```

**Why**: Email pages should NOT expand Admin module (they're in Marketing now)

### Verification Checklist

When modifying navigation:
- [ ] Email pages appear in Marketing module
- [ ] Admin module visible to both super_admin and admin users
- [ ] No flickering during role loading
- [ ] Module expansion states correct for all paths
- [ ] Debug logging can be removed after verification

### Files Affected

**Primary Navigation Component**:
- `src/components/Sidebar.tsx:183-268` - Module definitions and filtering

**Related Files**:
- Navigation is centralized in Sidebar.tsx only
- No other files require changes for module organization

---

**Status**: ✅ MANDATORY as of October 19, 2025
**Compliance**: All logo usage MUST follow this pattern
**Violations**: Will be rejected in code review
**Testing**: MUST verify visual appearance in both themes
**Navigation**: ✅ UPDATED October 27, 2025 - Email pages in Marketing module
**Reference**: [Main CLAUDE.md](../CLAUDE.md)
