"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Package, Plus, MoreVertical, Eye, Edit, Trash } from "lucide-react";
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
  type FormField,
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";

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

  // Query collections
  const { data: collections = [], isLoading, refetch } = api.products.getAllCollections.useQuery();

  // Mutations
  const createMutation = api.products.createCollection.useMutation({
    onSuccess: () => {
      toast.success("Collection created successfully");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to create collection: " + error.message);
    },
  });

  const updateMutation = api.products.updateCollection.useMutation({
    onSuccess: () => {
      toast.success("Collection updated successfully");
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update collection: " + error.message);
    },
  });

  const deleteMutation = api.products.deleteCollection.useMutation({
    onSuccess: () => {
      toast.success("Collection deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete collection: " + error.message);
    },
  });

  const handleEditCollection = (collection: Collection) => {
    setEditCollectionId(collection.id);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCollection = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the collection "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  // Form fields for create dialog
  const createFormFields: FormField[] = [
    { name: 'name', label: 'Collection Name', type: 'text', required: true, placeholder: 'e.g., Pacifica Collection' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe this collection...' },
  ];

  // Form fields for edit dialog
  const selectedCollection = collections.find((c: Collection) => c.id === editCollectionId);
  const editFormFields: FormField[] = [
    { name: 'name', label: 'Collection Name', type: 'text', required: true, defaultValue: selectedCollection?.name },
    { name: 'description', label: 'Description', type: 'textarea', defaultValue: selectedCollection?.description },
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
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="btn-icon">
              <MoreVertical className="icon-sm" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="card">
            <DropdownMenuItem
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/products/collections/${row.id}`);
              }}
            >
              <Eye className="icon-sm" aria-hidden="true" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                handleEditCollection(row);
              }}
            >
              <Edit className="icon-sm" aria-hidden="true" />
              Edit Collection
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item-danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCollection(row.id, row.name);
              }}
            >
              <Trash className="icon-sm" aria-hidden="true" />
              Delete Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search collections',
      type: 'search',
      placeholder: 'Search by name, prefix, or description...',
    },
  ];

  return (
    <div className="page-container">
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
            description: data.description as string || undefined,
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
            description: data.description as string || undefined,
          });
        }}
        submitLabel="Update Collection"
        isLoading={updateMutation.isPending}
      />

      {/* Stats */}
      <StatsGrid stats={stats} columns={3} />

      {/* Collections DataTable */}
      {isLoading ? (
        <LoadingState message="Loading collections..." size="lg" />
      ) : !collections || collections.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No collections found"
          description="Get started by creating your first collection."
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
          filters={filters}
          onRowClick={(row) => router.push(`/products/collections/${row.id as string}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Package,
            title: 'No collections match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
