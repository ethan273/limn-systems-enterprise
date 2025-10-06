"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Package, Plus, MoreVertical, Edit, Trash } from "lucide-react";
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

interface Material {
  id: string;
  name: string;
  code: string;
  type?: string;
  description?: string;
  category_id?: string;
  active?: boolean;
  cost_per_unit?: number;
  unit_of_measure?: string;
  created_at: string;
  updated_at?: string;
  category?: {
    id: string;
    name: string;
  };
  collections?: Array<{
    id: string;
    name: string;
    prefix?: string | null;
  }>;
}

interface MaterialCategory {
  id: string;
  name: string;
  icon?: string;
  sort_order?: number;
  active?: boolean;
}

export default function MaterialsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editMaterialId, setEditMaterialId] = useState<string>("");
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  // API queries
  const { data: materials = [], isLoading: materialsLoading, refetch } = api.products.getAllMaterials.useQuery();
  const { data: materialCategories = [] } = api.products.getMaterialCategories.useQuery();
  const { data: _furnitureCollections = [] } = api.products.getAllCollections.useQuery();

  // Mutations
  const createMaterialMutation = api.products.createMaterial.useMutation({
    onSuccess: () => {
      toast.success("Material created successfully");
      setIsCreateDialogOpen(false);
      setSelectedCollectionIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to create material: " + error.message);
    },
  });

  const updateMaterialMutation = api.products.updateMaterial.useMutation({
    onSuccess: () => {
      toast.success("Material updated successfully");
      setIsEditDialogOpen(false);
      setSelectedCollectionIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update material: " + error.message);
    },
  });

  const deleteMaterialMutation = api.products.deleteMaterial.useMutation({
    onSuccess: () => {
      toast.success("Material deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete material: " + error.message);
    },
  });

  const handleDeleteMaterial = (materialId: string, materialName: string) => {
    if (confirm(`Are you sure you want to delete "${materialName}"? This action cannot be undone.`)) {
      deleteMaterialMutation.mutate({ id: materialId });
    }
  };

  const handleEditMaterial = (material: Material) => {
    setEditMaterialId(material.id);
    setSelectedCollectionIds(material.collections?.map(c => c.id) || []);
    setIsEditDialogOpen(true);
  };

  // Generate unique material code
  const generateMaterialCode = (name: string): string => {
    const namePart = name.replace(/\s+/g, '-').substring(0, 10).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `MAT-${namePart}-${timestamp}`;
  };

  // Form fields for create dialog
  const createFormFields: FormField[] = [
    { name: 'name', label: 'Material Name', type: 'text', required: true, placeholder: 'Enter material name' },
    { name: 'code', label: 'Material Code', type: 'text', placeholder: 'Auto-generated if left empty' },
    { name: 'type', label: 'Material Type', type: 'text', placeholder: 'e.g., Fabric, Wood, Metal' },
    {
      name: 'category_id',
      label: 'Category',
      type: 'select',
      required: true,
      options: (materialCategories as MaterialCategory[]).map(cat => ({ value: cat.id, label: cat.name })),
    },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe this material...' },
    { name: 'cost_per_unit', label: 'Cost per Unit', type: 'number', placeholder: '0.00' },
    { name: 'unit_of_measure', label: 'Unit of Measure', type: 'text', placeholder: 'e.g., yard, meter, piece' },
    {
      name: 'active',
      label: 'Active Material',
      type: 'checkbox',
      defaultValue: 'true',
    },
  ];

  // Form fields for edit dialog
  const selectedMaterial = materials.find((m: Material) => m.id === editMaterialId);
  const editFormFields: FormField[] = [
    { name: 'name', label: 'Material Name', type: 'text', required: true, defaultValue: selectedMaterial?.name },
    { name: 'code', label: 'Material Code', type: 'text', defaultValue: selectedMaterial?.code },
    { name: 'type', label: 'Material Type', type: 'text', defaultValue: selectedMaterial?.type },
    {
      name: 'category_id',
      label: 'Category',
      type: 'select',
      required: true,
      options: (materialCategories as MaterialCategory[]).map(cat => ({ value: cat.id, label: cat.name })),
      defaultValue: selectedMaterial?.category_id,
    },
    { name: 'description', label: 'Description', type: 'textarea', defaultValue: selectedMaterial?.description },
    { name: 'cost_per_unit', label: 'Cost per Unit', type: 'number', defaultValue: selectedMaterial?.cost_per_unit?.toString() },
    { name: 'unit_of_measure', label: 'Unit of Measure', type: 'text', defaultValue: selectedMaterial?.unit_of_measure },
    {
      name: 'active',
      label: 'Active Material',
      type: 'checkbox',
      defaultValue: selectedMaterial?.active !== false ? 'true' : 'false',
    },
  ];

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Total Materials',
      value: materials.length,
      description: 'All materials in inventory',
      icon: Package,
      iconColor: 'info',
    },
    {
      title: 'Active',
      value: materials.filter((m: Material) => m.active !== false).length,
      description: 'Active materials',
      icon: Package,
      iconColor: 'success',
    },
    {
      title: 'Categories',
      value: materialCategories.length,
      description: 'Material categories',
      icon: Package,
      iconColor: 'info',
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<Material>[] = [
    {
      key: 'name',
      label: 'Material',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          {row.description && (
            <div className="text-sm text-secondary line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Code',
      render: (value) => value ? (
        <span className="font-mono text-sm">{value as string}</span>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => value ? (
        <span className="text-sm">{value as string}</span>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (value: any) => value?.name ? (
        <span className="text-sm">{value.name}</span>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'cost_per_unit',
      label: 'Cost per Unit',
      sortable: true,
      render: (value, row) => value ? (
        <div className="text-sm">
          ${(value as number).toFixed(2)}
          {row.unit_of_measure && <span className="text-muted ml-1">/ {row.unit_of_measure}</span>}
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'collections',
      label: 'Available In',
      render: (value: any) => {
        if (value && value.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((collection: any) => (
                <StatusBadge key={collection.id} status={collection.prefix || collection.name} />
              ))}
            </div>
          );
        }
        return <StatusBadge status="All Collections" />;
      },
    },
    {
      key: 'active',
      label: 'Status',
      render: (value) => (
        <StatusBadge status={value !== false ? 'active' : 'inactive'} />
      ),
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
                handleEditMaterial(row);
              }}
            >
              <Edit className="icon-sm" aria-hidden="true" />
              Edit Material
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item-danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteMaterial(row.id, row.name);
              }}
            >
              <Trash className="icon-sm" aria-hidden="true" />
              Delete Material
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
      label: 'Search materials',
      type: 'search',
      placeholder: 'Search by name, code, or type...',
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'all', label: 'All Categories' },
        ...(materialCategories as MaterialCategory[]).map(cat => ({ value: cat.id, label: cat.name })),
      ],
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Materials"
        subtitle="Manage your material inventory and specifications"
        actions={[
          {
            label: 'New Material',
            icon: Plus,
            onClick: () => {
              setSelectedCollectionIds([]);
              setIsCreateDialogOpen(true);
            },
          },
        ]}
      />

      {/* Create Material Dialog */}
      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Create New Material"
        description="Add a new material to your inventory."
        fields={createFormFields}
        onSubmit={async (data) => {
          const materialCode = data.code as string || generateMaterialCode(data.name as string);
          await createMaterialMutation.mutateAsync({
            name: data.name as string,
            code: materialCode,
            type: data.type as string || undefined,
            description: data.description as string || undefined,
            category_id: data.category_id as string,
            hierarchy_level: 1,
            active: data.active === 'true',
            cost_per_unit: data.cost_per_unit ? parseFloat(data.cost_per_unit as string) : undefined,
            unit_of_measure: data.unit_of_measure as string || undefined,
            collection_ids: selectedCollectionIds.length > 0 ? selectedCollectionIds : undefined,
          });
        }}
        submitLabel="Create Material"
        isLoading={createMaterialMutation.isPending}
      />

      {/* Edit Material Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Material"
        description="Update material information and details."
        fields={editFormFields}
        onSubmit={async (data) => {
          await updateMaterialMutation.mutateAsync({
            id: editMaterialId,
            name: data.name as string,
            code: (data.code as string) || selectedMaterial?.code || '',
            type: data.type ? (data.type as string) : undefined,
            description: data.description ? (data.description as string) : undefined,
            category_id: data.category_id as string,
            active: data.active === 'true',
            cost_per_unit: data.cost_per_unit ? parseFloat(data.cost_per_unit as string) : undefined,
            unit_of_measure: data.unit_of_measure ? (data.unit_of_measure as string) : undefined,
            collection_ids: selectedCollectionIds.length > 0 ? selectedCollectionIds : undefined,
          });
        }}
        submitLabel="Update Material"
        isLoading={updateMaterialMutation.isPending}
      />

      {/* Stats */}
      <StatsGrid stats={stats} columns={3} />

      {/* Materials DataTable */}
      {materialsLoading ? (
        <LoadingState message="Loading materials..." size="lg" />
      ) : !materials || materials.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No materials found"
          description="Start by adding your first material to your inventory."
          action={{
            label: 'Add First Material',
            onClick: () => {
              setSelectedCollectionIds([]);
              setIsCreateDialogOpen(true);
            },
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={materials as any[]}
          columns={columns as any}
          filters={filters}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Package,
            title: 'No materials match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
