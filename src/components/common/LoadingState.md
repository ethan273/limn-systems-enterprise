# LoadingState Component

## Overview

Production-ready loading indicator component with multiple animation variants, sizes, and configuration options. Fully accessible and styled using semantic CSS classes from the global stylesheet.

## Features

✅ **Three Animation Variants**: Spinner (default), Dots, Bars
✅ **Four Size Options**: Small (sm), Medium (md), Large (lg), Full-Page
✅ **Optional Overlay**: Full-page backdrop with blur effect
✅ **Customizable Messages**: Optional loading text
✅ **Fully Accessible**: ARIA attributes for screen readers
✅ **Semantic CSS Classes**: All styling via globals.css (zero inline styles)
✅ **TypeScript Support**: Complete type safety
✅ **Zero Dependencies**: Uses only React and CSS animations

## Installation

The component is already included in the common components directory:

```typescript
import { LoadingState } from '@/components/common/LoadingState';
// or
import { LoadingState } from '@/components/common';
```

## Basic Usage

### Default Loading (Spinner, Medium)

```tsx
<LoadingState message="Loading data..." />
```

### With Custom Size

```tsx
<LoadingState message="Loading..." size="lg" />
```

### Different Variants

```tsx
// Spinner (default)
<LoadingState variant="spinner" message="Loading..." />

// Bouncing dots
<LoadingState variant="dots" message="Processing..." />

// Loading bars
<LoadingState variant="bars" message="Please wait..." />
```

## Size Options

### Small (sm)
Compact loading indicator for inline use or small containers.

```tsx
<LoadingState size="sm" message="Loading..." />
```

### Medium (md) - Default
Standard loading indicator for most use cases.

```tsx
<LoadingState size="md" message="Loading data..." />
```

### Large (lg)
Large loading indicator for prominent loading states.

```tsx
<LoadingState size="lg" message="Loading content..." />
```

### Full-Page
Full viewport height loading indicator.

```tsx
<LoadingState size="full-page" message="Initializing application..." />
```

## Overlay Mode

Display a full-page loading overlay with backdrop blur:

```tsx
<LoadingState
  size="full-page"
  variant="spinner"
  message="Loading application..."
  overlay={true}
/>
```

## Shorthand Helper Components

For convenience, the package includes shorthand components:

### LoadingSpinner

```tsx
import { LoadingSpinner } from '@/components/common/LoadingState';

<LoadingSpinner size="md" message="Loading..." />
```

### LoadingDots

```tsx
import { LoadingDots } from '@/components/common/LoadingState';

<LoadingDots size="md" message="Processing..." />
```

### LoadingBars

```tsx
import { LoadingBars } from '@/components/common/LoadingState';

<LoadingBars size="md" message="Please wait..." />
```

### FullPageLoading

```tsx
import { FullPageLoading } from '@/components/common/LoadingState';

<FullPageLoading message="Loading application..." variant="spinner" />
```

## Component Props

### LoadingStateProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string \| undefined` | `undefined` | Optional loading message text |
| `size` | `'sm' \| 'md' \| 'lg' \| 'full-page'` | `'md'` | Size of the loading indicator |
| `variant` | `'spinner' \| 'dots' \| 'bars'` | `'spinner'` | Animation variant to display |
| `overlay` | `boolean` | `false` | Show full-page overlay with backdrop |

## Common Use Cases

### Loading Data in a Page

```tsx
function MyPage() {
  const { data, isLoading } = useQuery();

  if (isLoading) {
    return <LoadingState message="Loading page data..." size="lg" />;
  }

  return <div>{/* Your content */}</div>;
}
```

### Loading in a Modal/Dialog

```tsx
function MyDialog() {
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return <LoadingState message="Saving changes..." size="md" />;
  }

  return <form>{/* Your form */}</form>;
}
```

### Global App Loading

```tsx
function App() {
  const { isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <FullPageLoading
        message="Initializing application..."
        variant="spinner"
      />
    );
  }

  return <MainApp />;
}
```

### Inline Loading (Small)

```tsx
function MyComponent() {
  return (
    <div>
      <h2>User Profile</h2>
      {isLoading ? (
        <LoadingState size="sm" variant="dots" />
      ) : (
        <UserDetails />
      )}
    </div>
  );
}
```

### Async Operation with Overlay

```tsx
function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await saveData();
    setIsSubmitting(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>

      {isSubmitting && (
        <FullPageLoading
          message="Saving your changes..."
          variant="spinner"
        />
      )}
    </>
  );
}
```

## CSS Classes Used

All styling is controlled via semantic CSS classes in `/src/app/globals.css`:

### Container Classes
- `.loading-state-container` - Base container
- `.loading-state-sm` - Small size modifier
- `.loading-state-md` - Medium size modifier
- `.loading-state-lg` - Large size modifier
- `.loading-state-full-page` - Full-page size modifier
- `.loading-overlay` - Full-page overlay with backdrop

### Spinner Classes
- `.loading-spinner-wrapper` - Spinner container
- `.loading-spinner-element` - Spinner element
- `.loading-spinner-sm` - Small spinner
- `.loading-spinner-md` - Medium spinner
- `.loading-spinner-lg` - Large spinner

### Dots Classes
- `.loading-dots-wrapper` - Dots container
- `.loading-dot` - Individual dot
- `.loading-dots-sm` - Small dots
- `.loading-dots-md` - Medium dots
- `.loading-dots-lg` - Large dots

### Bars Classes
- `.loading-bars-wrapper` - Bars container
- `.loading-bar` - Individual bar
- `.loading-bars-sm` - Small bars
- `.loading-bars-md` - Medium bars
- `.loading-bars-lg` - Large bars

### Message Classes
- `.loading-message` - Base message text
- `.loading-message-sm` - Small message
- `.loading-message-lg` - Large message

## Animations

The component uses CSS keyframe animations defined in globals.css:

- `@keyframes spin` - Spinner rotation (0.8s linear infinite)
- `@keyframes bounce` - Dots bouncing (1.4s ease-in-out infinite)
- `@keyframes loading-bars` - Bars scaling (1.2s ease-in-out infinite)

## Accessibility

The component includes proper ARIA attributes:

- `role="status"` - Indicates a live region with advisory information
- `role="dialog"` - For overlay mode
- `aria-modal="true"` - For overlay mode
- `aria-label="Loading"` - Screen reader label
- `aria-live="polite"` - For loading messages

## Theme Support

The component automatically supports dark mode via CSS variables:

- Uses `hsl(var(--primary))` for accent colors
- Uses `hsl(var(--muted))` for neutral colors
- Uses `hsl(var(--muted-foreground))` for text
- Uses `hsl(var(--background))` for overlay backdrop

## Demo

A comprehensive demo component is available:

```tsx
import { LoadingStateDemo } from '@/components/common/LoadingStateDemo';

<LoadingStateDemo />
```

The demo showcases:
- All size variants
- All animation variants
- With/without messages
- Shorthand helpers
- Full-page overlay
- Usage examples

## Best Practices

1. **Choose appropriate size**: Use `sm` for inline, `md` for cards, `lg` for pages
2. **Add meaningful messages**: Help users understand what's loading
3. **Use overlay sparingly**: Only for critical blocking operations
4. **Pick the right variant**: Spinner for data, dots for processing, bars for progress
5. **Consider accessibility**: Always include messages for screen readers

## TypeScript

The component is fully typed with TypeScript:

```typescript
interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'full-page';
  variant?: 'spinner' | 'dots' | 'bars';
  overlay?: boolean;
}
```

## Browser Support

The component uses modern CSS features:

- CSS animations (all browsers)
- CSS variables (all modern browsers)
- Backdrop filter (Chrome 76+, Safari 9+, Firefox 70+)

## Performance

- Zero JavaScript animations (all CSS)
- No external dependencies
- Minimal bundle impact (~2KB gzipped)
- Optimized CSS animations

## Credits

Built for the Limn Systems Enterprise application following the Prime Directive:
- Zero hardcoded styling
- Semantic CSS classes only
- Production-ready code
- Full accessibility support
