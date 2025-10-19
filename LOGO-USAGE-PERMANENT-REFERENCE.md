# PERMANENT LOGO USAGE REFERENCE

## ✅ Logo File Naming (STANDARD CONVENTION)

The logo file names follow **STANDARD** naming convention:

### File Names and What They're For:
- **`Limn_Logo_Dark_Mode.png`** = Logo **FOR dark mode** (light colored for visibility)
- **`Limn_Logo_Light_Mode.png`** = Logo **FOR light mode** (dark colored for visibility)

### Correct Usage Pattern:

```typescript
// ✅ CORRECT (standard naming convention)
resolvedTheme === 'dark'
  ? '/images/Limn_Logo_Dark_Mode.png'   // Use Dark_Mode.png for dark theme
  : '/images/Limn_Logo_Light_Mode.png'  // Use Light_Mode.png for light theme

// ❌ WRONG (this is the bug that keeps coming back!)
resolvedTheme === 'dark'
  ? '/images/Limn_Logo_Light_Mode.png'  // Shows dark logo on dark bg (invisible!)
  : '/images/Limn_Logo_Dark_Mode.png'   // Shows light logo on light bg (invisible!)
```

### Why This Makes Sense:
Standard convention:
- `Logo_Dark_Mode.png` = logo FOR dark mode (contains light-colored logo for visibility on dark background)
- `Logo_Light_Mode.png` = logo FOR light mode (contains dark-colored logo for visibility on light background)

**Our files follow this standard convention:**
- `Limn_Logo_Dark_Mode.png` = For dark mode (light colored logo inside)
- `Limn_Logo_Light_Mode.png` = For light mode (dark colored logo inside)

### The Rule (MEMORIZE THIS):
**"Use the matching file name for the theme"**
- Dark theme → `Limn_Logo_Dark_Mode.png`
- Light theme → `Limn_Logo_Light_Mode.png`

## All Files Using Logos:
1. `/src/app/auth/customer/page.tsx:34`
2. `/src/app/login/page.tsx:44`
3. `/src/app/auth/employee/page-client.tsx:140`
4. `/src/app/auth/dev/page.tsx:97`
5. `/src/app/auth/verify-email/page.tsx:76-77`
6. `/src/app/auth/contractor/page.tsx:34`
7. `/src/app/page.tsx:16`
8. `/src/components/Sidebar.tsx:321`
9. `/src/app/portal/login/page.tsx:139`

**Last Updated**: October 19, 2025
**DO NOT CHANGE** this pattern without updating ALL 9+ files!
