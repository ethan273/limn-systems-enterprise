# Editing Patterns Guide for Developers

## Overview

This guide documents the two editing patterns used in the Limn Systems Enterprise application and when to use each one.

## The Two Patterns

### Pattern 1: In-Place Editing (Detail Pages)

**Use for**: Detail pages where users are viewing a single record

**Benefits**:
- Better context - users see all related data while editing
- More space for complex forms
- Less navigation - no need to open modals or go to separate pages
- Mobile-friendly - full screen editing

**Implementation**: `/src/app/crm/contacts/[id]/page.tsx`

**How it works**:
1. User clicks on a row in a list to view details
2. Detail page opens in read-only mode
3. User clicks "Edit Contact" button
4. Same page toggles to edit mode - fields become editable
5. User clicks "Save Changes" or "Cancel"
6. Page returns to read-only mode

**Code pattern**:
```tsx
const [isEditing, setIsEditing] = useState(false);
const [formData, setFormData] = useState({...});

// Sync with fetched data
useEffect(() => {
  if (data?.contact) {
    setFormData({...data.contact});
  }
}, [data]);

// Update mutation
const updateMutation = api.crm.contacts.update.useMutation({
  onSuccess: () => {
    toast.success("Updated successfully");
    setIsEditing(false);
    refetch();
  },
});

// Header actions toggle based on editing state
<EntityDetailHeader
  actions={
    isEditing
      ? [
          { label: 'Cancel', icon: X, onClick: handleCancel },
          { label: 'Save Changes', icon: Check, onClick: handleSave },
        ]
      : [
          { label: 'Edit Contact', icon: Edit, onClick: () => setIsEditing(true) },
        ]
  }
/>

// Fields use EditableField component
<EditableFieldGroup isEditing={isEditing}>
  <EditableField
    label="Name"
    value={formData.name}
    isEditing={isEditing}
    onChange={(value) => setFormData({...formData, name: value})}
  />
</EditableFieldGroup>
```

### Pattern 2: Quick Edit Modal (List Pages)

**Use for**: Quick edits from list views without leaving the list

**Benefits**:
- Fast edits without navigation
- User stays in context of the list
- Good for simple forms (2-5 fields)
- Can edit multiple records in succession

**Implementation**: `/src/app/crm/contacts/page.tsx`

**How it works**:
1. User is on a list page viewing multiple records
2. User clicks "Quick Edit" in row actions dropdown (⋮)
3. Modal opens with form pre-filled
4. User makes changes and saves
5. Modal closes, list refreshes, user stays on list page

**Code pattern**:
```tsx
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
const [editContactId, setEditContactId] = useState<string>("");

const selectedContact = contactsData?.items?.find(c => c.id === editContactId);
const editFormFields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    defaultValue: selectedContact?.name
  },
  // ... more fields
];

// Row actions include Quick Edit
const rowActions: DataTableRowAction<any>[] = [
  {
    label: 'View Details',
    icon: Eye,
    onClick: (row) => router.push(`/crm/contacts/${row.id}`),
  },
  {
    label: 'Quick Edit',
    icon: Pencil,
    onClick: (row) => {
      setEditContactId(row.id);
      setIsEditDialogOpen(true);
    },
  },
];

// FormDialog component handles the modal
<FormDialog
  open={isEditDialogOpen}
  onOpenChange={setIsEditDialogOpen}
  title="Edit Contact"
  fields={editFormFields}
  onSubmit={async (data) => {
    await updateMutation.mutateAsync({ id: editContactId, data });
  }}
/>
```

## When to Use Each Pattern

### Use In-Place Editing When:
- ✅ User is already on a detail page viewing a record
- ✅ Form is complex (5+ fields)
- ✅ User needs to see related data while editing
- ✅ Record has multiple sections or tabs
- ✅ Context is important (e.g., editing while viewing activity history)

### Use Quick Edit Modal When:
- ✅ User is on a list page and wants to make quick changes
- ✅ Form is simple (2-5 fields)
- ✅ User wants to edit multiple records in succession
- ✅ Navigation would interrupt the user's workflow

## List Page Actions Configuration

On list pages, provide both options in rowActions:

```tsx
const rowActions: DataTableRowAction<any>[] = [
  {
    label: 'View Details',
    icon: Eye,
    onClick: (row) => router.push(`/crm/contacts/${row.id}`),
  },
  {
    label: 'Quick Edit',
    icon: Pencil,
    onClick: (row) => openQuickEditModal(row),
  },
  {
    label: 'Delete',
    icon: Trash2,
    variant: 'destructive',
    separator: true,
    onClick: (row) => openDeleteDialog(row),
  },
];
```

**Also enable row click navigation**:
```tsx
<DataTable
  data={items}
  columns={columns}
  rowActions={rowActions}
  onRowClick={(row) => router.push(`/crm/contacts/${row.id}`)}
  // ...
/>
```

This gives users three ways to interact:
1. **Click row** → View details (can edit in-place there)
2. **Quick Edit** → Fast modal edit without leaving list
3. **View Details** → Explicit navigation to detail page

## Components Used

### In-Place Editing Components
- `EditableField` - Individual editable field
- `EditableFieldGroup` - Group of editable fields with title
- `EntityDetailHeader` - Header with actions that toggle based on edit mode

### Quick Edit Components
- `FormDialog` - Modal dialog with form
- `DataTable` with `rowActions` - List with action dropdown

## Migration Checklist

When migrating a page to in-place editing:

- [ ] Add `isEditing` state to detail page
- [ ] Add `formData` state with all editable fields
- [ ] Add `useEffect` to sync formData with fetched data
- [ ] Add update mutation with proper success/error handling
- [ ] Add `handleSave` and `handleCancel` functions
- [ ] Update `EntityDetailHeader` actions to toggle based on `isEditing`
- [ ] Replace `InfoCard` or manual fields with `EditableFieldGroup` and `EditableField`
- [ ] Test edit mode, save, cancel, and validation
- [ ] Keep the quick edit modal on the list page (don't remove it)
- [ ] Add "Quick Edit" label to distinguish from "View Details"

## Example: CRM Contacts

**List Page** (`/crm/contacts/page.tsx`):
- Row click → Navigate to `/crm/contacts/[id]`
- Quick Edit action → Opens FormDialog modal
- View Details action → Navigate to `/crm/contacts/[id]`
- Delete action → Opens confirmation dialog

**Detail Page** (`/crm/contacts/[id]/page.tsx`):
- Shows contact details in read-only mode
- "Edit Contact" button → Toggles to edit mode
- Edit mode → All fields become editable in-place
- "Save Changes" → Saves and returns to read-only mode
- "Cancel" → Discards changes and returns to read-only mode

## Best Practices

1. **Always preserve both patterns** - Don't remove quick edit modals when implementing in-place editing
2. **Clear labeling** - Use "Quick Edit" vs "View Details" to make the difference clear
3. **Context preservation** - In-place editing should show all context the user needs
4. **Validation** - Both patterns should have the same validation rules
5. **Loading states** - Show loading states during save operations
6. **Error handling** - Display clear error messages for both patterns
7. **Unsaved changes** - Consider warning users before navigation when in edit mode

## Related Documentation

- [In-Place Editing Pattern Implementation Guide](./INPLACE-EDITING-PATTERN.md)
- [rowActions Pattern](./ROWACTIONS-COMPLETE-SUMMARY.md)
- [DataTable Component Documentation](./src/components/common/DataTable.tsx)
- [FormDialog Component Documentation](./src/components/common/FormDialog.tsx)
- [EditableField Component Documentation](./src/components/common/EditableField.tsx)
