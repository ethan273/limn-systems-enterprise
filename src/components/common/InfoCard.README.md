# InfoCard Component

## Overview

A production-ready, type-safe React component for displaying information in a standardized card format. Built on shadcn/ui components with complete global CSS styling architecture.

## Location

`/src/components/common/InfoCard.tsx`

## Features

- **100% Global CSS Styling** - No inline Tailwind utilities, all styling via semantic CSS classes
- **Zero ESLint Errors/Warnings** - Fully production-ready code
- **Complete TypeScript Type Safety** - Full type definitions with proper exports
- **Flexible Item Types** - Text, email, phone, link, and badge display types
- **Action Buttons** - Support for multiple actions with icons
- **Multiple Variants** - Default, bordered, and elevated card styles
- **Responsive Design** - Mobile-first with responsive grid layout
- **Dark Mode Support** - Automatic theme switching via CSS variables
- **Accessibility** - Semantic HTML with proper ARIA support

## Props

### InfoCardProps

```typescript
interface InfoCardProps {
  title: string;                    // Card title (required)
  subtitle?: string;                // Optional subtitle text
  icon?: React.ComponentType;       // Optional header icon
  items: InfoCardItem[];            // Array of information items (required)
  actions?: InfoCardAction[];       // Optional action buttons
  footer?: React.ReactNode;         // Optional footer content
  variant?: 'default' | 'bordered' | 'elevated';  // Card style variant
  className?: string;               // Additional CSS classes
}
```

### InfoCardItem

```typescript
interface InfoCardItem {
  label: string;                    // Item label (required)
  value: string | number | React.ReactNode;  // Item value (required)
  icon?: React.ComponentType;       // Optional value icon
  type?: 'text' | 'email' | 'phone' | 'link' | 'badge';  // Display type
  href?: string;                    // URL for link type
  badgeVariant?: 'default' | 'success' | 'warning' | 'destructive';  // Badge style
}
```

### InfoCardAction

```typescript
interface InfoCardAction {
  label: string;                    // Button label (required)
  onClick: () => void;              // Click handler (required)
  icon?: React.ComponentType;       // Optional button icon
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';  // Button style
}
```

## Item Types

### Text (default)
```typescript
{ label: 'Name', value: 'John Doe' }
```

### Email (with mailto: link)
```typescript
{ label: 'Email', value: 'john@example.com', type: 'email' }
```

### Phone (with tel: link)
```typescript
{ label: 'Phone', value: '555-0100', type: 'phone' }
```

### Link (with external URL)
```typescript
{ label: 'Website', value: 'example.com', type: 'link', href: 'https://example.com' }
```

### Badge (styled badge component)
```typescript
{ label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success' }
```

## Usage Examples

### Basic Card

```typescript
import { InfoCard } from '@/components/common/InfoCard';

<InfoCard
  title="Customer Information"
  items={[
    { label: 'Name', value: 'John Doe' },
    { label: 'Email', value: 'john@example.com', type: 'email' },
    { label: 'Phone', value: '555-0100', type: 'phone' },
  ]}
/>
```

### Card with Icon and Subtitle

```typescript
import { InfoCard } from '@/components/common/InfoCard';
import { User } from 'lucide-react';

<InfoCard
  title="Customer Information"
  subtitle="Contact details and status"
  icon={User}
  items={[
    { label: 'Name', value: 'John Doe' },
    { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success' },
  ]}
/>
```

### Card with Actions

```typescript
import { InfoCard } from '@/components/common/InfoCard';
import { Edit, Trash2 } from 'lucide-react';

<InfoCard
  title="Project Details"
  items={[
    { label: 'Project', value: 'Website Redesign' },
    { label: 'Budget', value: '$50,000' },
  ]}
  actions={[
    { label: 'Edit', onClick: handleEdit, icon: Edit },
    { label: 'Delete', onClick: handleDelete, icon: Trash2, variant: 'destructive' },
  ]}
/>
```

### Bordered Variant

```typescript
<InfoCard
  title="Project Details"
  variant="bordered"
  items={[
    { label: 'Status', value: 'In Progress', type: 'badge', badgeVariant: 'warning' },
    { label: 'Deadline', value: 'Dec 31, 2025' },
  ]}
/>
```

### Elevated Variant with Footer

```typescript
<InfoCard
  title="Contact Information"
  variant="elevated"
  items={[
    { label: 'Email', value: 'contact@company.com', type: 'email' },
    { label: 'Phone', value: '(555) 123-4567', type: 'phone' },
  ]}
  footer={<span>Last updated: Today</span>}
/>
```

### Complete Example

```typescript
import { InfoCard } from '@/components/common/InfoCard';
import { User, Mail, Phone, Edit, Trash2 } from 'lucide-react';

export default function CustomerDetailPage() {
  const handleEdit = () => {
    console.log('Edit clicked');
  };

  const handleDelete = () => {
    console.log('Delete clicked');
  };

  return (
    <div className="page-container">
      <InfoCard
        title="Customer Information"
        subtitle="Contact details and status"
        icon={User}
        variant="elevated"
        items={[
          { label: 'Name', value: 'John Doe' },
          { label: 'Email', value: 'john@example.com', type: 'email', icon: Mail },
          { label: 'Phone', value: '555-0100', type: 'phone', icon: Phone },
          { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success' },
          { label: 'Website', value: 'example.com', type: 'link', href: 'https://example.com' },
          { label: 'Company', value: 'Acme Corporation' },
        ]}
        actions={[
          { label: 'Edit', onClick: handleEdit, icon: Edit },
          { label: 'Delete', onClick: handleDelete, icon: Trash2, variant: 'destructive' },
        ]}
        footer={<span>Customer since: Jan 2024</span>}
      />
    </div>
  );
}
```

## Global CSS Classes

All styling is defined in `/src/app/globals.css`:

### Component Structure Classes
- `.info-card` - Card wrapper
- `.info-card-default` - Default variant
- `.info-card-bordered` - Bordered variant (2px border)
- `.info-card-elevated` - Elevated variant (shadow effect)

### Header Classes
- `.info-card-header` - Header container
- `.info-card-header-content` - Header content wrapper
- `.info-card-header-text` - Title and subtitle wrapper
- `.info-card-icon` - Header icon (1.5rem, primary color)
- `.info-card-title` - Card title (1.125rem, font-weight 600)
- `.info-card-subtitle` - Card subtitle (0.875rem, muted color)

### Content Classes
- `.info-card-content` - Content container
- `.info-card-items` - Items container (vertical flex)
- `.info-card-item` - Individual item (grid layout)
- `.info-card-label` - Item label (0.875rem, muted color)
- `.info-card-value` - Item value (0.875rem, foreground color)
- `.info-card-value-with-icon` - Value with icon wrapper
- `.info-card-value-icon` - Value icon (1rem)
- `.info-card-link` - Link styling (primary color, hover underline)

### Footer Classes
- `.info-card-footer` - Footer container (border-top)
- `.info-card-actions` - Actions button container
- `.info-card-footer-content` - Footer content wrapper

### Dark Mode
- `.dark .info-card-elevated` - Enhanced shadow for dark mode

## Responsive Behavior

- **Desktop (≥640px)**: Two-column grid layout for items
- **Mobile (<640px)**: Single-column layout for items
- **Footer**: Horizontal layout on desktop, vertical on mobile

## Validation Results

### ESLint
```bash
npm run lint
✔ No ESLint warnings or errors
```

### TypeScript
```bash
npx tsc --noEmit
✔ Zero type errors
```

### Build
```bash
npm run dev
✓ Compiled /test-infocard in 3.2s
✔ Zero compilation errors
```

### Browser
- ✔ Component renders correctly
- ✔ All semantic CSS classes applied
- ✔ No React warnings
- ✔ No console errors (component-specific)

## Dependencies

- `@/components/ui/card` - shadcn/ui Card components
- `@/components/ui/button` - shadcn/ui Button component
- `@/components/ui/badge` - shadcn/ui Badge component
- `@/lib/utils` - cn() utility for className merging
- `lucide-react` - Icon library (for examples)

## Best Practices

1. **Always use semantic CSS classes** - Never add inline Tailwind utilities
2. **Provide meaningful labels** - Use clear, descriptive labels for better UX
3. **Use appropriate item types** - Select the correct type for each data field
4. **Handle actions properly** - Implement proper onClick handlers with error handling
5. **Leverage variants** - Use bordered/elevated variants for visual hierarchy
6. **Add icons judiciously** - Icons improve scannability but don't overuse
7. **Keep items concise** - Limit to 5-8 items per card for optimal readability

## Accessibility

- ✔ Semantic HTML structure (dt/dd for definition lists)
- ✔ Proper heading hierarchy (CardTitle component)
- ✔ Focus-visible styles for links and buttons
- ✔ ARIA support inherited from shadcn/ui components
- ✔ Keyboard navigation support
- ✔ Screen reader friendly structure

## Maintenance

- **CSS Location**: `/src/app/globals.css` (lines 6564-6730)
- **Component Location**: `/src/components/common/InfoCard.tsx`
- **Type Definitions**: Exported from component file
- **Version**: 1.0.0 (Production-ready)
- **Last Updated**: October 2025

## Support

For questions or issues:
1. Check this README first
2. Review the component source code
3. Check `/src/app/globals.css` for CSS class definitions
4. Refer to shadcn/ui documentation for underlying components
