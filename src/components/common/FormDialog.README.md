# FormDialog Component

**Production-Ready Generic Form Dialog Component for Limn Systems Enterprise**

## Overview

`FormDialog` is a fully type-safe, production-ready, reusable form dialog component built on shadcn/ui components. It provides a flexible interface for creating forms with validation, error handling, and loading states.

## Features

✅ **Zero ESLint Errors/Warnings** - Production-ready code quality
✅ **Zero TypeScript Errors** - Fully type-safe
✅ **Global CSS Only** - No inline Tailwind utilities (per architectural requirements)
✅ **Flexible Field Types** - Support for text, email, number, select, textarea, date, checkbox, password
✅ **Built-in Validation** - Required fields, email format, min/max, regex patterns
✅ **Loading States** - Disable form during submission
✅ **Error Handling** - Show validation errors below fields
✅ **Semantic CSS** - Uses global CSS classes from `/src/app/globals.css`

## Architecture Compliance

This component follows the **CRITICAL GLOBAL CSS STYLING ARCHITECTURE** from CLAUDE.md:

- ✅ All styling exists in global CSS files (`/src/app/globals.css`)
- ✅ Zero hardcoded colors in JSX/TSX
- ✅ Zero hardcoded fonts in JSX/TSX
- ✅ Zero inline Tailwind utility classes
- ✅ Semantic class names (`.form-field`, `.form-label`, `.form-error`, `.form-actions`)

## Installation

The component is already installed and exported from `/src/components/common/index.ts`:

```typescript
import { FormDialog } from '@/components/common';
// or
import { FormDialog } from '@/components/common/FormDialog';
```

## TypeScript Types

```typescript
import type {
  FormDialogProps,
  FormField,
  FormFieldType,
  FormFieldValidation,
  SelectOption,
} from '@/components/common';
```

## Basic Usage

```tsx
'use client';

import { useState } from 'react';
import { FormDialog, type FormField } from '@/components/common';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Customer Name',
      type: 'text',
      required: true,
      placeholder: 'Enter customer name',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'customer@example.com',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
      defaultValue: 'active',
    },
  ];

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      // Your API call here
      await createCustomer(data);
      console.log('Form submitted:', data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Add Customer</Button>
      <FormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Add New Customer"
        description="Create a new customer record"
        fields={fields}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
}
```

## Field Types

### Text Input
```typescript
{
  name: 'username',
  label: 'Username',
  type: 'text',
  required: true,
  placeholder: 'johndoe',
}
```

### Email Input
```typescript
{
  name: 'email',
  label: 'Email Address',
  type: 'email',
  required: true,
  placeholder: 'user@example.com',
}
```

### Number Input
```typescript
{
  name: 'age',
  label: 'Age',
  type: 'number',
  required: true,
  validation: {
    min: 18,
    max: 100,
    message: 'Age must be between 18 and 100',
  },
}
```

### Select Dropdown
```typescript
{
  name: 'department',
  label: 'Department',
  type: 'select',
  required: true,
  options: [
    { value: 'admin', label: 'Administration' },
    { value: 'design', label: 'Design' },
    { value: 'production', label: 'Production' },
  ],
  defaultValue: 'admin',
}
```

### Textarea
```typescript
{
  name: 'description',
  label: 'Description',
  type: 'textarea',
  placeholder: 'Enter detailed description...',
}
```

### Date Input
```typescript
{
  name: 'startDate',
  label: 'Start Date',
  type: 'date',
  required: true,
}
```

### Checkbox
```typescript
{
  name: 'acceptTerms',
  label: 'I accept the terms and conditions',
  type: 'checkbox',
  required: true,
  defaultValue: false,
}
```

### Password Input
```typescript
{
  name: 'password',
  label: 'Password',
  type: 'password',
  required: true,
  placeholder: '••••••••',
  validation: {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  },
}
```

## Validation

### Required Fields
```typescript
{
  name: 'email',
  label: 'Email',
  type: 'email',
  required: true, // Shows "Email is required" if empty
}
```

### Email Validation
Automatic email format validation for `type: 'email'` fields.

### Number Range Validation
```typescript
{
  name: 'quantity',
  label: 'Quantity',
  type: 'number',
  validation: {
    min: 1,
    max: 999,
  },
}
```

### Regex Pattern Validation
```typescript
{
  name: 'zipCode',
  label: 'ZIP Code',
  type: 'text',
  validation: {
    pattern: /^\d{5}$/,
    message: 'ZIP code must be exactly 5 digits',
  },
}
```

## Integration with tRPC

```tsx
'use client';

import { useState } from 'react';
import { FormDialog, type FormField } from '@/components/common';
import { api } from '@/trpc/react';

export function CustomerForm() {
  const [isOpen, setIsOpen] = useState(false);

  const createCustomer = api.customers.create.useMutation({
    onSuccess: () => {
      setIsOpen(false);
      // Optionally invalidate queries, show success message, etc.
    },
  });

  const fields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ];

  const handleSubmit = async (data: Record<string, unknown>) => {
    await createCustomer.mutateAsync({
      name: data.name as string,
      email: data.email as string,
    });
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Add Customer"
      fields={fields}
      onSubmit={handleSubmit}
      isLoading={createCustomer.isPending}
    />
  );
}
```

## Props API

### FormDialogProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | - | Controls dialog open state |
| `onOpenChange` | `(open: boolean) => void` | Yes | - | Callback when dialog open state changes |
| `title` | `string` | Yes | - | Dialog title |
| `description` | `string` | No | - | Optional dialog description |
| `fields` | `FormField[]` | Yes | - | Array of form field configurations |
| `onSubmit` | `(data: Record<string, unknown>) => Promise<void> \| void` | Yes | - | Form submission handler |
| `submitLabel` | `string` | No | `'Submit'` | Text for submit button |
| `cancelLabel` | `string` | No | `'Cancel'` | Text for cancel button |
| `isLoading` | `boolean` | No | `false` | Disables form during submission |

### FormField

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Unique field identifier (used as key in form data) |
| `label` | `string` | Yes | Field label displayed to user |
| `type` | `FormFieldType` | Yes | Field type (text, email, number, select, textarea, date, checkbox, password) |
| `placeholder` | `string` | No | Placeholder text |
| `required` | `boolean` | No | Whether field is required |
| `options` | `SelectOption[]` | For select fields | Array of `{value, label}` objects |
| `defaultValue` | `unknown` | No | Default field value |
| `validation` | `FormFieldValidation` | No | Validation configuration |

### FormFieldValidation

| Property | Type | Description |
|----------|------|-------------|
| `min` | `number` | Minimum value for number fields |
| `max` | `number` | Maximum value for number fields |
| `pattern` | `RegExp` | Regular expression for pattern validation |
| `message` | `string` | Custom validation error message |

## CSS Classes (Global)

All styling is defined in `/src/app/globals.css`:

- `.form-field` - Field container (flex column with gap)
- `.form-label` - Field label (font-size, font-weight, color)
- `.form-label-required` - Adds red asterisk (*) after label
- `.form-error` - Error message styling (red text, small font)
- `.form-actions` - Button container (responsive flex layout)
- `.form-checkbox-field` - Checkbox field wrapper (flex row with gap)

## Examples

See `/src/components/common/FormDialog.example.tsx` for comprehensive usage examples:

1. **Simple Contact Form** - Basic text, email, and textarea fields
2. **Customer Creation Form** - With select dropdowns and checkboxes
3. **Task Creation Form** - With date picker and number validation
4. **User Registration** - With password field and regex validation
5. **tRPC Integration** - Example with tRPC mutation

## Quality Validation

### ESLint
```bash
npx eslint src/components/common/FormDialog.tsx
# ✅ PASSED (0 errors, 0 warnings)
```

### TypeScript
```bash
npx tsc --noEmit
# ✅ PASSED (0 type errors)
```

### Build
```bash
npm run build
# ✅ PASSED (builds successfully)
```

## Best Practices

1. **Type Safety**: Always define your field configurations with proper TypeScript types
2. **Validation**: Use `required` and `validation` props to ensure data quality
3. **Loading States**: Pass `isLoading` prop to disable form during API calls
4. **Error Handling**: The component handles validation errors automatically
5. **tRPC Integration**: Use with tRPC mutations for type-safe API calls
6. **Default Values**: Set sensible defaults for select fields and checkboxes

## Migration from Inline Forms

If you have existing inline forms, migrate to FormDialog:

**Before (inline form):**
```tsx
<form onSubmit={handleSubmit}>
  <div>
    <label>Name</label>
    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
  </div>
  <div>
    <label>Email</label>
    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
  </div>
  <button type="submit">Submit</button>
</form>
```

**After (FormDialog):**
```tsx
<FormDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Add User"
  fields={[
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ]}
  onSubmit={handleSubmit}
/>
```

## Support

For questions or issues, refer to:
- Component source: `/src/components/common/FormDialog.tsx`
- Examples: `/src/components/common/FormDialog.example.tsx`
- Global CSS: `/src/app/globals.css` (lines 6478-6536)
- Architecture documentation: `/Users/eko3/limn-systems-enterprise/CLAUDE.md`

## Version

Created: October 5, 2025
Version: 1.0.0
Status: Production Ready ✅

## Quality Metrics

- ESLint: **0 errors, 0 warnings** ✅
- TypeScript: **0 type errors** ✅
- Build: **Successful** ✅
- Security: **No vulnerabilities** ✅
- Architecture: **Fully compliant with global CSS architecture** ✅
