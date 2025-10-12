# In-Place Editing Pattern Implementation Guide

## Overview

This pattern allows users to edit records directly on the detail page, avoiding the need for separate edit modals or edit pages. The detail page fields toggle between read-only and editable modes.

## Benefits

1. **Better Context**: Users can see all related data while editing
2. **Less Navigation**: No need to open modals or navigate to separate edit pages
3. **Mobile-Friendly**: Full screen editing instead of cramped modals
4. **Consistent Experience**: Same page for viewing and editing
5. **Reduced Code**: Eliminates separate edit modal components

## When to Use

**✅ Use In-Place Editing For:**
- Detail pages (`/crm/contacts/[id]/page.tsx`)
- Complex forms with 5+ fields
- Records with tabs and sections
- Pages where context is important

**❌ Keep Modals For:**
- Quick edits from list views (2-3 fields)
- Confirmation dialogs
- Multi-step wizards

## Implementation Pattern

### 1. Add Edit State to Detail Page

```tsx
const [isEditing, setIsEditing] = useState(false);
const [formData, setFormData] = useState({
  name: contact.name || '',
  email: contact.email || '',
  phone: contact.phone || '',
  // ... more fields
});

// Update mutation
const updateMutation = api.crm.contacts.update.useMutation({
  onSuccess: () => {
    toast.success("Contact updated successfully");
    setIsEditing(false);
    refetch();
  },
  onError: (error) => {
    toast.error("Failed to update contact: " + error.message);
  },
});

const handleSave = async () => {
  await updateMutation.mutateAsync({
    id,
    data: formData,
  });
};

const handleCancel = () => {
  // Reset form data to original values
  setFormData({
    name: contact.name || '',
    email: contact.email || '',
    // ...
  });
  setIsEditing(false);
};
```

### 2. Update Header Actions

```tsx
<EntityDetailHeader
  icon={User}
  title={contact.name || "Unnamed Contact"}
  subtitle={contact.position || undefined}
  // ... metadata
  actions={
    isEditing
      ? [
          {
            label: 'Cancel',
            icon: X,
            variant: 'outline' as const,
            onClick: handleCancel,
          },
          {
            label: 'Save Changes',
            icon: Check,
            onClick: handleSave,
            disabled: updateMutation.isPending,
          },
        ]
      : [
          {
            label: 'Edit',
            icon: Edit,
            onClick: () => setIsEditing(true),
          },
        ]
  }
/>
```

### 3. Use EditableField Components

```tsx
import { EditableField, EditableFieldGroup } from '@/components/common';

<EditableFieldGroup
  title="Contact Information"
  isEditing={isEditing}
  columns={2}
>
  <EditableField
    label="Name"
    value={formData.name}
    isEditing={isEditing}
    onChange={(value) => setFormData({ ...formData, name: value })}
    required
  />

  <EditableField
    label="Email"
    value={formData.email}
    type="email"
    isEditing={isEditing}
    onChange={(value) => setFormData({ ...formData, email: value })}
  />

  <EditableField
    label="Phone"
    value={formData.phone}
    type="phone"
    isEditing={isEditing}
    onChange={(value) => setFormData({ ...formData, phone: value })}
  />

  <EditableField
    label="Status"
    value={formData.status}
    type="select"
    isEditing={isEditing}
    onChange={(value) => setFormData({ ...formData, status: value })}
    options={[
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ]}
  />

  <EditableField
    label="Notes"
    value={formData.notes}
    type="textarea"
    isEditing={isEditing}
    onChange={(value) => setFormData({ ...formData, notes: value })}
    className="col-span-2"
  />
</EditableFieldGroup>
```

## Full Example: Contact Detail Page with In-Place Editing

```tsx
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import {
  EditableField,
  EditableFieldGroup,
  EntityDetailHeader,
  LoadingState,
  EmptyState,
} from "@/components/common";
import { User, Mail, Phone, Building2, X, Check, Edit, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, refetch } = api.crm.contacts.getById.useQuery({ id });

  const [formData, setFormData] = useState({
    name: data?.contact.name || '',
    email: data?.contact.email || '',
    phone: data?.contact.phone || '',
    company: data?.contact.company || '',
    position: data?.contact.position || '',
    notes: data?.contact.notes || '',
  });

  // Sync formData with fetched data
  useEffect(() => {
    if (data?.contact) {
      setFormData({
        name: data.contact.name || '',
        email: data.contact.email || '',
        phone: data.contact.phone || '',
        company: data.contact.company || '',
        position: data.contact.position || '',
        notes: data.contact.notes || '',
      });
    }
  }, [data]);

  const updateMutation = api.crm.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Contact updated successfully");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  const handleSave = async () => {
    await updateMutation.mutateAsync({ id, data: formData });
  };

  const handleCancel = () => {
    setFormData({
      name: data?.contact.name || '',
      email: data?.contact.email || '',
      phone: data?.contact.phone || '',
      company: data?.contact.company || '',
      position: data?.contact.position || '',
      notes: data?.contact.notes || '',
    });
    setIsEditing(false);
  };

  if (isLoading) return <LoadingState />;
  if (!data) return <EmptyState title="Not Found" />;

  return (
    <div className="page-container">
      <Button onClick={() => router.push("/crm/contacts")} variant="ghost">
        <ArrowLeft className="icon-sm" />
        Back
      </Button>

      <EntityDetailHeader
        icon={User}
        title={formData.name || "Unnamed Contact"}
        subtitle={formData.position}
        metadata={[
          { icon: Mail, value: formData.email, type: 'email' },
          { icon: Phone, value: formData.phone, type: 'phone' },
          { icon: Building2, value: formData.company, type: 'text' },
        ]}
        actions={
          isEditing
            ? [
                {
                  label: 'Cancel',
                  icon: X,
                  variant: 'outline',
                  onClick: handleCancel,
                },
                {
                  label: updateMutation.isPending ? 'Saving...' : 'Save Changes',
                  icon: Check,
                  onClick: handleSave,
                  disabled: updateMutation.isPending,
                },
              ]
            : [
                {
                  label: 'Edit',
                  icon: Edit,
                  onClick: () => setIsEditing(true),
                },
              ]
        }
      />

      <EditableFieldGroup title="Contact Information" isEditing={isEditing} columns={2}>
        <EditableField
          label="Name"
          value={formData.name}
          isEditing={isEditing}
          onChange={(value) => setFormData({ ...formData, name: value })}
          required
        />
        <EditableField
          label="Position"
          value={formData.position}
          isEditing={isEditing}
          onChange={(value) => setFormData({ ...formData, position: value })}
        />
        <EditableField
          label="Email"
          value={formData.email}
          type="email"
          isEditing={isEditing}
          onChange={(value) => setFormData({ ...formData, email: value })}
        />
        <EditableField
          label="Phone"
          value={formData.phone}
          type="phone"
          isEditing={isEditing}
          onChange={(value) => setFormData({ ...formData, phone: value })}
        />
        <EditableField
          label="Company"
          value={formData.company}
          isEditing={isEditing}
          onChange={(value) => setFormData({ ...formData, company: value })}
          className="col-span-2"
        />
        <EditableField
          label="Notes"
          value={formData.notes}
          type="textarea"
          isEditing={isEditing}
          onChange={(value) => setFormData({ ...formData, notes: value })}
          className="col-span-2"
        />
      </EditableFieldGroup>
    </div>
  );
}
```

## Migration Steps

### Step 1: Identify Pages to Migrate

Run this command to find all detail pages:
```bash
find src/app -type f -name "page.tsx" -path "*/\[id\]/*" | grep -v edit
```

Priority pages to migrate:
1. `/crm/contacts/[id]/page.tsx`
2. `/crm/customers/[id]/page.tsx`
3. `/crm/leads/[id]/page.tsx`
4. `/crm/prospects/[id]/page.tsx`
5. `/products/collections/[id]/page.tsx`
6. `/products/catalog/[id]/page.tsx`

### Step 2: Remove Separate Edit Pages

After implementing in-place editing, you can remove:
- `/crm/customers/[id]/edit/page.tsx`
- `/crm/leads/[id]/edit/page.tsx`
- Any other `/edit` pages

### Step 3: Update List View Edit Actions

On list pages (`/crm/contacts/page.tsx`), update the rowActions:

**Option A: Navigate to Detail Page**
```tsx
{
  label: 'Edit',
  icon: Pencil,
  onClick: (row) => {
    router.push(`/crm/contacts/${row.id}`);
    // Note: Detail page will need to auto-enter edit mode if coming from list
  },
}
```

**Option B: Keep Modal for Quick Edits, Add "View Details" Action**
```tsx
{
  label: 'View Details',
  icon: Eye,
  onClick: (row) => router.push(`/crm/contacts/${row.id}`),
},
{
  label: 'Quick Edit',
  icon: Pencil,
  onClick: (row) => openEditModal(row),
},
```

## Testing Checklist

- [ ] Edit mode toggles correctly
- [ ] Form data syncs with fetched data
- [ ] Cancel button resets form to original values
- [ ] Save button triggers mutation
- [ ] Success toast appears after save
- [ ] Data refetches after successful save
- [ ] Edit mode exits after successful save
- [ ] Validation works (required fields, etc.)
- [ ] All field types work (text, email, phone, textarea, select)
- [ ] Loading states handled properly
- [ ] Error states handled properly

## Advanced Patterns

### Auto-Enter Edit Mode from List

```tsx
// In detail page, check URL param
const searchParams = useSearchParams();
const autoEdit = searchParams.get('edit') === 'true';

useEffect(() => {
  if (autoEdit && !isEditing) {
    setIsEditing(true);
  }
}, [autoEdit]);

// In list page, navigate with edit param
onClick: (row) => router.push(`/crm/contacts/${row.id}?edit=true`)
```

### Unsaved Changes Warning

```tsx
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isEditing) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isEditing]);
```

### Section-Based Editing

For pages with multiple sections, allow editing one section at a time:

```tsx
const [editingSection, setEditingSection] = useState<string | null>(null);

<EditableFieldGroup
  title="Contact Info"
  isEditing={editingSection === 'contact'}
  // ...
/>
<EditableFieldGroup
  title="Address"
  isEditing={editingSection === 'address'}
  // ...
/>
```

## Conclusion

In-place editing provides a superior user experience compared to modals for detail pages. It keeps users in context, provides more space for complex forms, and reduces cognitive load by eliminating navigation between view/edit modes.
