# FormDialog - Quick Start Guide

**⚡ Get started with FormDialog in 2 minutes**

## 1. Basic Import

```tsx
import { FormDialog, type FormField } from '@/components/common';
```

## 2. Define Your Fields

```tsx
const fields: FormField[] = [
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    placeholder: 'user@example.com',
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
  },
];
```

## 3. Add State

```tsx
const [isOpen, setIsOpen] = useState(false);
const [isLoading, setIsLoading] = useState(false);
```

## 4. Create Submit Handler

```tsx
const handleSubmit = async (data: Record<string, unknown>) => {
  setIsLoading(true);
  try {
    await yourApiCall(data);
  } finally {
    setIsLoading(false);
  }
};
```

## 5. Render Component

```tsx
<FormDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Add Record"
  fields={fields}
  onSubmit={handleSubmit}
  isLoading={isLoading}
/>
```

## 6. Trigger Dialog

```tsx
<Button onClick={() => setIsOpen(true)}>Open Form</Button>
```

---

## Complete Example

```tsx
'use client';

import { useState } from 'react';
import { FormDialog, type FormField } from '@/components/common';
import { Button } from '@/components/ui/button';

export function MyForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ];

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      console.log('Submitted:', data);
      // Replace with your API call
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Add Record</Button>
      <FormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Add New Record"
        fields={fields}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
}
```

---

## Field Type Cheat Sheet

| Type | Description | Example |
|------|-------------|---------|
| `text` | Text input | `{ name: 'username', label: 'Username', type: 'text' }` |
| `email` | Email (auto-validates) | `{ name: 'email', label: 'Email', type: 'email', required: true }` |
| `number` | Number input | `{ name: 'age', label: 'Age', type: 'number', validation: { min: 18, max: 100 } }` |
| `select` | Dropdown | `{ name: 'status', label: 'Status', type: 'select', options: [...] }` |
| `textarea` | Multi-line text | `{ name: 'notes', label: 'Notes', type: 'textarea' }` |
| `date` | Date picker | `{ name: 'dueDate', label: 'Due Date', type: 'date' }` |
| `checkbox` | Checkbox | `{ name: 'agree', label: 'I agree', type: 'checkbox' }` |
| `password` | Password (hidden) | `{ name: 'password', label: 'Password', type: 'password' }` |

---

## Validation Examples

### Required Field
```tsx
{ name: 'email', label: 'Email', type: 'email', required: true }
```

### Min/Max Numbers
```tsx
{
  name: 'age',
  label: 'Age',
  type: 'number',
  validation: { min: 18, max: 100 }
}
```

### Regex Pattern
```tsx
{
  name: 'zipCode',
  label: 'ZIP Code',
  type: 'text',
  validation: {
    pattern: /^\d{5}$/,
    message: 'ZIP code must be 5 digits'
  }
}
```

---

## tRPC Integration

```tsx
const createRecord = api.records.create.useMutation();

<FormDialog
  fields={fields}
  onSubmit={async (data) => {
    await createRecord.mutateAsync(data);
  }}
  isLoading={createRecord.isPending}
/>
```

---

## 📚 More Resources

- **Full Documentation:** `/src/components/common/FormDialog.README.md`
- **Examples:** `/src/components/common/FormDialog.example.tsx`
- **Test Demo:** `/src/components/common/FormDialog.test-demo.tsx`
- **Component Code:** `/src/components/common/FormDialog.tsx`

---

**That's it! You're ready to use FormDialog. 🚀**
