"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  PageHeader,
  FormDialog,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  StatusBadge,
  TableFilters,
  Breadcrumb,
  type FormField,
  type DataTableColumn,
  type DataTableRowAction,
  type StatItem,
} from "@/components/common";
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

interface Collection {
  id: string;
  name: string;
  prefix?: string;
  description?: string;
  designer?: string;
  display_order?: number;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export default function CollectionsPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCollectionId, setEditCollectionId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

  // Unified filter management with new hook
  const {
    rawFilters,
    setFilter,
    clearFilters,
    hasActiveFilters,
  } = useTableState({
    initialFilters: {
      search: '',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Query collections
  const { data: collections = [], isLoading } = api.products.getAllCollections.useQuery();

  // Mutations
  const createMutation = api.products.createCollection.useMutation({
    onSuccess: () => {
      toast.success("Collection created successfully");
      setIsCreateDialogOpen(false);
      // Invalidate queries for instant updates
      utils.products.getAllCollections.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to create collection: " + error.message);
    },
  });

  const updateMutation = api.products.updateCollection.useMutation({
    onSuccess: () => {
      toast.success("Collection updated successfully");
      setIsEditDialogOpen(false);
      // Invalidate queries for instant updates
      utils.products.getAllCollections.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update collection: " + error.message);
    },
  });

  const deleteMutation = api.products.deleteCollection.useMutation({
    onSuccess: () => {
      toast.success("Collection deleted successfully");
      // Invalidate queries for instant updates
      utils.products.getAllCollections.invalidate();
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete collection: " + error.message);
    },
  });

  const handleEditCollection = (collection: Collection) => {
    setEditCollectionId(collection.id);
    setIsEditDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (collectionToDelete) {
      deleteMutation.mutate({ id: collectionToDelete.id });
    }
  };

  // Form fields for create dialog
  const createFormFields: FormField[] = [
    { name: 'name', label: 'Collection Name', type: 'text', required: true, placeholder: 'e.g., Pacifica Collection' },
    { name: 'prefix', label: 'Prefix', type: 'text', placeholder: 'e.g., PAC' },
    { name: 'designer', label: 'Designer', type: 'text', placeholder: 'Designer name' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe this collection...' },
    { name: 'is_active', label: 'Active', type: 'checkbox', defaultValue: 'true' },
  ];

  // Form fields for edit dialog
  const selectedCollection = collections.find((c: Collection) => c.id === editCollectionId);
  const editFormFields: FormField[] = [
    { name: 'name', label: 'Collection Name', type: 'text', required: true, defaultValue: selectedCollection?.name },
    { name: 'prefix', label: 'Prefix', type: 'text', defaultValue: selectedCollection?.prefix },
    { name: 'designer', label: 'Designer', type: 'text', defaultValue: selectedCollection?.designer },
    { name: 'description', label: 'Description', type: 'textarea', defaultValue: selectedCollection?.description },
    { name: 'is_active', label: 'Active', type: 'checkbox', defaultValue: selectedCollection?.is_active !== false ? 'true' : 'false' },
  ];

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Total Collections',
      value: collections.length,
      description: 'All collections',
      icon: Package,
      iconColor: 'info',
    },
    {
      title: 'Active',
      value: collections.filter((c: Collection) => c.is_active !== false).length,
      description: 'Active collections',
      icon: Package,
      iconColor: 'success',
    },
    {
      title: 'Inactive',
      value: collections.filter((c: Collection) => c.is_active === false).length,
      description: 'Inactive collections',
      icon: Package,
      iconColor: 'info',
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<Collection>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="data-table-avatar">
            <Package className="icon-sm" aria-hidden="true" />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'prefix',
      label: 'Prefix',
      render: (value) => value ? (
        <span className="font-mono text-sm">{value as string}</span>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => value ? (
        <span className="line-clamp-1">{value as string}</span>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'designer',
      label: 'Designer',
      render: (value) => value ? (
        <span>{value as string}</span>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) => (
        <StatusBadge status={value !== false ? 'active' : 'inactive'} />
      ),
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


  // Row actions configuration
  const rowActions: DataTableRowAction<Collection>[] = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (row) => handleEditCollection(row),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setCollectionToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  return (
    <div className="page-container">
      <Breadcrumb />
      {/* Page Header */}
      <PageHeader
        title="Collections"
        subtitle="Manage product collections and their properties"
        actions={[
          {
            label: 'New Collection',
            icon: Plus,
            onClick: () => setIsCreateDialogOpen(true),
          },
        ]}
      />

      {/* Create Collection Dialog */}
      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Create New Collection"
        description="Add a new collection to organize your products."
        fields={createFormFields}
        onSubmit={async (data) => {
          await createMutation.mutateAsync({
            name: data.name as string,
            prefix: data.prefix as string || undefined,
            designer: data.designer as string || undefined,
            description: data.description as string || undefined,
            is_active: data.is_active === 'true',
          });
        }}
        submitLabel="Create Collection"
        isLoading={createMutation.isPending}
      />

      {/* Edit Collection Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Collection"
        description="Update collection information and details."
        fields={editFormFields}
        onSubmit={async (data) => {
          await updateMutation.mutateAsync({
            id: editCollectionId,
            name: data.name as string,
            prefix: data.prefix as string || undefined,
            designer: data.designer as string || undefined,
            description: data.description as string || undefined,
            is_active: data.is_active === 'true',
          });
        }}
        submitLabel="Update Collection"
        isLoading={updateMutation.isPending}
      />

      {/* Stats */}
      <StatsGrid stats={stats} columns={3} />

      {/* Filters - New Unified System */}
      <TableFilters.Bar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Search Filter */}
        <TableFilters.Search
          value={rawFilters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by name, prefix, or description..."
        />
      </TableFilters.Bar>

      {/* Collections DataTable */}
      {isLoading ? (
        <LoadingState message="Loading collections..." size="lg" />
      ) : !collections || collections.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No collections found"
          description={hasActiveFilters
            ? "Try adjusting your filters to see more results."
            : "Get started by creating your first collection."}
          action={{
            label: 'Create First Collection',
            onClick: () => setIsCreateDialogOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={collections as any[]}
          columns={columns as any}
          rowActions={rowActions as any}
          onRowClick={(row) => router.push(`/products/collections/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Package,
            title: 'No collections match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{collectionToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
