# Theme Switching Guide

## Overview

You now have two CSS theme files available:

1. **`globals.css`** - Current theme (Inter font, blue primary color)
2. **`globals-limn-brand.css`** - Limn brand theme (Roboto font, Glacier/Rose/Skyfall colors)

## Limn Brand Colors

The Limn brand theme uses these colors:

- **Glacier** (#88c0c0) - Primary teal color for buttons, links, and primary actions
- **Rose** (#d87891) - Secondary pink accent for highlights and secondary actions
- **Skyfall** (#7095ae) - Blue accent for tertiary elements
- **Amber** (#db7f38) - Warm highlight color for charts and special elements

## Limn Brand Fonts

- **Roboto** with multiple weights for hierarchy:
  - Extra Light (100) - for subtle text
  - Light (300) - default body text
  - Regular (400) - standard content
  - Bold (700) - headings and emphasis

## How to Switch Themes

### Method 1: Simple Import Switch (Recommended)

Edit `/src/app/layout.tsx` and change line 3:

**To use Limn brand theme:**
```typescript
import "./globals-limn-brand.css";
```

**To use current theme:**
```typescript
import "./globals.css";
```

Then refresh your browser (Cmd+R on Mac, Ctrl+R on Windows).

### Method 2: Quick Test Without Editing Layout

You can temporarily test the Limn theme by copying the file:

```bash
# Backup current theme
cp src/app/globals.css src/app/globals-backup.css

# Test Limn theme
cp src/app/globals-limn-brand.css src/app/globals.css

# Refresh browser to see changes

# Restore original
cp src/app/globals-backup.css src/app/globals.css
```

## What Changes When You Switch

### Colors
- **Primary buttons** - Change from blue to Glacier teal
- **Secondary buttons** - Change to Rose pink
- **Accent elements** - Change to Skyfall blue
- **Borders & inputs** - Subtle teal tints
- **Charts** - Limn color palette

### Typography
- **Font family** - Changes from Inter to Roboto
- **Font weights** - Lighter default weight (300 vs 400)
- **Hierarchy** - Uses Roboto's weight variations

### Both Themes Support
- Light mode (default)
- Dark mode (automatic based on system preference)
- All existing components and layouts
- Responsive design

## Testing Checklist

When testing the Limn theme, check these areas:

- [ ] Dashboard pages (charts and data visualizations)
- [ ] CRM pages (buttons and forms)
- [ ] Products pages (tables and cards)
- [ ] Production pages (status badges)
- [ ] Finance pages (data tables)
- [ ] Admin pages (settings and forms)
- [ ] Portal pages (customer/factory views)
- [ ] Forms and dialogs
- [ ] Navigation and sidebar
- [ ] Light mode appearance
- [ ] Dark mode appearance (toggle in system settings)

## Notes

- Both CSS files are complete and independent
- Switching themes requires only changing one import line
- No code changes needed - all components use CSS variables
- The dev server will hot-reload when you change the import
- Both themes maintain WCAG accessibility standards

## Comparison

| Feature | Current Theme | Limn Brand Theme |
|---------|--------------|------------------|
| Font | Inter | Roboto |
| Primary Color | Blue (#3b82f6) | Glacier (#88c0c0) |
| Secondary Color | Light grey | Rose (#d87891) |
| Accent Color | Blue | Skyfall (#7095ae) |
| Highlight | - | Amber (#db7f38) |
| Weight | Medium (400) | Light (300) |
| Character | Professional, corporate | Elegant, artistic |

## Quick Decision Points

**Keep Current Theme if:**
- You prefer the familiar blue color scheme
- You like the Inter font's technical feel
- Current branding is established

**Switch to Limn Brand if:**
- You want to match Limn's brand identity
- You prefer the softer, artistic color palette
- You want lighter, more elegant typography
- You need better brand consistency

## Need Help?

If you need to adjust colors or fonts further, edit:
- `/src/app/globals-limn-brand.css` (lines 53-109 for color variables)
- Font import on line 11
