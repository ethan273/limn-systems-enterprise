"use client";
import { log } from '@/lib/logger';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import {
  Plus,
  Building,
  Mail,
  Phone,
  User,
  Tag,
  Users,
  Pencil,
  Trash2,
  Eye,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  PageHeader,
  FormDialog,
  EmptyState,
  LoadingState,
  DataTable,
  TableFilters,
  Breadcrumbs,
  type FormField,
  type DataTableColumn,
  type DataTableRowAction,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ContactsPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editContactId, setEditContactId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any>(null);

  // Unified filter management with new hook
  const {
    rawFilters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    queryParams,
  } = useTableState({
    initialFilters: {
      search: '',
      company: '',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  // Backend query with unified params
  const { data: contactsData, isLoading, error } = api.crm.contacts.getAll.useQuery({
    ...queryParams,
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const createContactMutation = api.crm.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contact created successfully");
      setIsCreateDialogOpen(false);
      // Invalidate queries for instant updates
      utils.crm.contacts.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to create contact: " + error.message);
    },
  });

  const updateContactMutation = api.crm.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Contact updated successfully");
      setIsEditDialogOpen(false);
      // Invalidate queries for instant updates
      utils.crm.contacts.getAll.invalidate();
      utils.crm.contacts.getById.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update contact: " + error.message);
    },
  });

  const deleteContactMutation = api.crm.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted successfully");
      setDeleteDialogOpen(false);
      setContactToDelete(null);
      // Invalidate queries for instant updates
      utils.crm.contacts.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to delete contact: " + error.message);
    },
  });

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      log.info('[ContactsPage] DELETE triggered for contactId:', contactToDelete.id);
      deleteContactMutation.mutate({ id: contactToDelete.id });
      log.info('[ContactsPage] deleteContactMutation.mutate called');
    }
  };

  // Form fields for create dialog
  const createFormFields: FormField[] = [
    { name: 'first_name', label: 'First Name', type: 'text', required: true, placeholder: 'John' },
    { name: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Doe' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'text', placeholder: '+1 (555) 123-4567' },
    { name: 'company', label: 'Company', type: 'text', placeholder: 'Company name' },
    { name: 'position', label: 'Position', type: 'text', placeholder: 'Job title' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
  ];

  // Form fields for edit dialog (with default values from selected contact)
  const selectedContact = contactsData?.items?.find(c => c.id === editContactId);
  const editFormFields: FormField[] = [
    { name: 'first_name', label: 'First Name', type: 'text', required: true, placeholder: 'John', defaultValue: selectedContact?.first_name },
    { name: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Doe', defaultValue: selectedContact?.last_name },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com', defaultValue: selectedContact?.email },
    { name: 'phone', label: 'Phone', type: 'text', placeholder: '+1 (555) 123-4567', defaultValue: selectedContact?.phone },
    { name: 'company', label: 'Company', type: 'text', placeholder: 'Company name', defaultValue: selectedContact?.company },
    { name: 'position', label: 'Position', type: 'text', placeholder: 'Job title', defaultValue: selectedContact?.position },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...', defaultValue: selectedContact?.notes },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'first_name',
      label: 'First Name',
      sortable: true,
      render: (value, row) => {
        const displayValue = value || row.name || '—';
        return (
          <div className="flex items-center gap-3">
            <div className="data-table-avatar">
              <User className="icon-sm" aria-hidden="true" />
            </div>
            <span className="font-medium">{displayValue as string}</span>
          </div>
        );
      },
    },
    {
      key: 'last_name',
      label: 'Last Name',
      sortable: true,
      render: (value) => value ? <span className="font-medium">{value as string}</span> : <span className="text-muted">—</span>,
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Building className="icon-xs text-muted" aria-hidden="true" />
          <span>{value as string}</span>
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'position',
      label: 'Position',
      render: (value) => value ? <span>{value as string}</span> : <span className="text-muted">—</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Mail className="icon-xs text-muted" aria-hidden="true" />
          <span className="truncate max-w-[200px]">{value as string}</span>
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Phone className="icon-xs text-muted" aria-hidden="true" />
          <span>{value as string}</span>
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (value) => {
        const tags = value as string[] | null;
        if (!tags || tags.length === 0) return <span className="text-muted">—</span>;
        return (
          <div className="flex gap-1 flex-wrap">
            {tags.slice(0, 2).map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="badge-neutral">
                <Tag className="icon-xs" aria-hidden="true" />
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="badge-neutral">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => value ? (
        <span className="text-sm">
          {formatDistanceToNow(new Date(value as string), { addSuffix: true })}
        </span>
      ) : null,
    },
  ];

  // Company filter options
  const companyOptions = [
    { value: 'all', label: 'All Contacts' },
    { value: 'with_company', label: 'With Company' },
    { value: 'no_company', label: 'No Company' },
  ];

  // Row actions configuration
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
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setContactToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  // Query error handling
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Contacts"
          subtitle="Manage all your business contacts"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Failed to Load Contacts</h3>
              <p className="text-sm text-muted-foreground">
                {error.message || "An error occurred while fetching contacts data"}
              </p>
            </div>
            <button
              onClick={() => utils.crm.contacts.getAll.invalidate()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'CRM', href: '/crm' },
          { label: 'Contacts' }, // Current page
        ]}
      />

      {/* Page Header with new PageHeader component */}
      <PageHeader
        title="Contacts"
        subtitle="Manage all your business contacts"
        actions={[
          {
            label: 'New Contact',
            icon: Plus,
            onClick: () => setIsCreateDialogOpen(true),
          },
        ]}
      />

      {/* Create Contact Dialog with new FormDialog component */}
      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Create New Contact"
        description="Add a new contact to your CRM system."
        fields={createFormFields}
        onSubmit={async (data) => {
          log.info('[ContactsPage] UPDATE onSubmit called with data', { data, contactId: editContactId });
          const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
          const mutationData = {
            first_name: data.first_name as string,
            last_name: data.last_name as string || undefined,
            name: fullName, // Maintain backward compatibility
            email: data.email as string || undefined,
            phone: data.phone as string || undefined,
            company: data.company as string || undefined,
            position: data.position as string || undefined,
            notes: data.notes as string || undefined,
            tags: [],
          };
          log.info('[ContactsPage] Calling createContactMutation.mutateAsync with:', mutationData);
          await createContactMutation.mutateAsync(mutationData);
          log.info('[ContactsPage] createContactMutation completed');
        }}
        submitLabel="Create Contact"
        isLoading={createContactMutation.isPending}
      />

      {/* Edit Contact Dialog with new FormDialog component */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Contact"
        description="Update contact information."
        fields={editFormFields}
        onSubmit={async (data) => {
          log.info('[ContactsPage] UPDATE onSubmit called with data', { data, contactId: editContactId });
          const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
          const mutationData = {
            id: editContactId,
            data: {
              first_name: data.first_name as string,
              last_name: data.last_name as string || undefined,
              name: fullName, // Maintain backward compatibility
              email: data.email as string || undefined,
              phone: data.phone as string || undefined,
              company: data.company as string || undefined,
              position: data.position as string || undefined,
              notes: data.notes as string || undefined,
            },
          };
          log.info('[ContactsPage] Calling updateContactMutation.mutateAsync with:', mutationData);
          await updateContactMutation.mutateAsync(mutationData);
          log.info('[ContactsPage] updateContactMutation completed');
        }}
        submitLabel="Update Contact"
        isLoading={updateContactMutation.isPending}
      />

      {/* Filters - New Unified System */}
      <TableFilters.Bar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Search Filter */}
        <TableFilters.Search
          value={rawFilters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by name, email, or company..."
        />

        {/* Company Filter */}
        <TableFilters.Select
          value={rawFilters.company}
          onChange={(value) => setFilter('company', value)}
          options={companyOptions}
          placeholder="All Contacts"
        />
      </TableFilters.Bar>

      {/* Contacts DataTable - No filters prop (server-side only) */}
      {isLoading ? (
        <LoadingState message="Loading contacts..." size="lg" />
      ) : !contactsData?.items || contactsData.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description="Get started by creating your first contact."
          action={{
            label: 'Add Contact',
            onClick: () => setIsCreateDialogOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={contactsData.items}
          columns={columns}
          rowActions={rowActions}
          onRowClick={(row) => router.push(`/crm/contacts/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: User,
            title: 'No contacts match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {[contactToDelete?.first_name, contactToDelete?.last_name].filter(Boolean).join(' ') || contactToDelete?.name}? This action cannot be undone.
              All associated activities will be preserved but unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
