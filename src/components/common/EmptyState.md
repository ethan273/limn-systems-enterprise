# EmptyState Component Documentation

## Overview

The `EmptyState` component provides a consistent, reusable way to display empty states across the Limn Systems Enterprise application. It supports multiple variants for different scenarios and follows the application's global CSS architecture.

## Features

- ✅ **Zero inline styles** - Uses only global CSS classes
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Accessible** - ARIA attributes for screen readers
- ✅ **Flexible** - Multiple variants and optional elements
- ✅ **Consistent** - Unified design system across all empty states

## Import

```typescript
import { EmptyState } from '@/components/common';
// or
import { EmptyState } from '@/components/common/EmptyState';
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `LucideIcon` | Icon component from lucide-react to display |
| `title` | `string` | Primary heading text |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `description` | `string` | - | Secondary descriptive text |
| `variant` | `'default' \| 'no-results' \| 'error' \| 'coming-soon'` | `'default'` | Visual variant for different states |
| `action` | `ActionConfig` | - | Optional action button configuration |

### ActionConfig Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Button text |
| `onClick` | `() => void` | - | Click handler function |
| `icon` | `LucideIcon` | - | Optional icon for the button |
| `variant` | `'default' \| 'secondary' \| 'outline'` | `'default'` | Button style variant |

## Variants

### default
Standard empty state with gray icon. Use for general "no data" scenarios.

```typescript
<EmptyState
  icon={FileX}
  title="No customers found"
  variant="default"
/>
```

### no-results
Muted appearance for search/filter results. Use when filters return no matches.

```typescript
<EmptyState
  icon={Search}
  title="No results found"
  variant="no-results"
/>
```

### error
Red/destructive styling for error states. Use when data loading fails.

```typescript
<EmptyState
  icon={AlertTriangle}
  title="Failed to load data"
  variant="error"
/>
```

### coming-soon
Primary color styling for upcoming features. Use for features in development.

```typescript
<EmptyState
  icon={Clock}
  title="Coming Soon"
  variant="coming-soon"
/>
```

## Usage Examples

### Basic Usage (No Action)

```typescript
import { EmptyState } from '@/components/common';
import { FileX } from 'lucide-react';

export function CustomersPage() {
  return (
    <EmptyState
      icon={FileX}
      title="No customers found"
      description="Customers will appear here once added"
    />
  );
}
```

### With Action Button

```typescript
import { EmptyState } from '@/components/common';
import { FileX, Plus } from 'lucide-react';
import { useState } from 'react';

export function CustomersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <EmptyState
      icon={FileX}
      title="No customers found"
      description="Get started by adding your first customer"
      action={{
        label: 'Add Customer',
        onClick: () => setIsDialogOpen(true),
        icon: Plus,
      }}
    />
  );
}
```

### Search Results (No Matches)

```typescript
import { EmptyState } from '@/components/common';
import { Search } from 'lucide-react';

export function SearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`No results found for "${query}". Try adjusting your search.`}
      variant="no-results"
    />
  );
}
```

### Error State with Retry

```typescript
import { EmptyState } from '@/components/common';
import { AlertTriangle } from 'lucide-react';

export function OrdersList() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <EmptyState
      icon={AlertTriangle}
      title="Failed to load orders"
      description="An error occurred while loading the data. Please try again."
      action={{
        label: 'Retry',
        onClick: handleRetry,
        variant: 'outline',
      }}
      variant="error"
    />
  );
}
```

### Coming Soon Feature

```typescript
import { EmptyState } from '@/components/common';
import { Clock } from 'lucide-react';

export function ReportsPage() {
  return (
    <EmptyState
      icon={Clock}
      title="Reports Coming Soon"
      description="Advanced reporting features are currently under development."
      variant="coming-soon"
    />
  );
}
```

## CSS Classes Used

The component uses the following global CSS classes from `/src/app/globals.css`:

- `.empty-state` - Main container
- `.empty-state-icon` - Icon styling
- `.empty-state-text` - Title styling
- `.empty-state-subtext` - Description styling
- `.empty-state-action` - Action button container
- `.empty-state-default` - Default variant
- `.empty-state-no-results` - No results variant
- `.empty-state-error` - Error variant
- `.empty-state-coming-soon` - Coming soon variant

## Accessibility

- Icons use `aria-hidden="true"` to prevent screen reader announcement
- Semantic HTML structure (h3 for title, p for description)
- Clear, descriptive text for all states
- Keyboard accessible action buttons

## Best Practices

### Do ✅

- Use descriptive, helpful title and description text
- Choose appropriate icons that match the state
- Provide clear action buttons when users can take action
- Use the correct variant for the situation

### Don't ❌

- Don't use vague messages like "No data"
- Don't omit descriptions when they would be helpful
- Don't add action buttons if users can't actually take action
- Don't mix variants (e.g., error icon with default variant)

## Common Icon Choices

| Scenario | Recommended Icon |
|----------|-----------------|
| No data (general) | `FileX`, `Inbox`, `Database` |
| No search results | `Search`, `Filter` |
| Error states | `AlertTriangle`, `AlertCircle`, `XCircle` |
| Coming soon | `Clock`, `Rocket`, `Sparkles` |
| Empty list | `List`, `ListX` |
| No users/contacts | `Users`, `UserX` |
| No documents | `FileText`, `FileX` |

## Integration with DataTable

The EmptyState component works seamlessly with the DataTable component:

```typescript
import { DataTable, EmptyState } from '@/components/common';
import { FileX, Plus } from 'lucide-react';

export function CustomersTable({ data }: { data: Customer[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={FileX}
        title="No customers found"
        description="Get started by adding your first customer"
        action={{
          label: 'Add Customer',
          onClick: () => setIsDialogOpen(true),
          icon: Plus,
        }}
      />
    );
  }

  return <DataTable columns={columns} data={data} />;
}
```

## Validation Status

✅ **ESLint**: 0 errors, 0 warnings
✅ **TypeScript**: 0 type errors
✅ **Security**: 0 vulnerabilities
✅ **Accessibility**: ARIA compliant
✅ **Code Quality**: Production-ready

## Related Components

- `DataTable` - Often used together for list pages
- `PageHeader` - Typically appears above EmptyState
- `Button` - Used for action buttons

## Support

For questions or issues, refer to the component source code at:
`/src/components/common/EmptyState.tsx`
