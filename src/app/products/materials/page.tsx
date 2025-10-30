"use client";

import { useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, Palette, TreePine, Hammer, Mountain, Package, Zap, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  FormDialog,
  EmptyState,
  LoadingState,
  DataTable,
  StatusBadge,
  TableFilters,
  Breadcrumb,
  type FormField,
  type DataTableColumn,
  type DataTableRowAction,
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

// Material hierarchy configuration - matching old implementation exactly
const materialCategories = [
  {
    key: "fabric",
    label: "Fabrics",
    icon: Palette,
    description: "Brand → Collection → Color",
    hierarchy: [
      { key: 1, label: "Brands", type: "brand", hasSKU: false, hasSwatch: false },
      { key: 2, label: "Collections", type: "collection", hasSKU: false, hasSwatch: false },
      { key: 3, label: "Colors", type: "color", hasSKU: true, skuLabel: "Fabric SKU", hasSwatch: true },
    ],
  },
  {
    key: "wood",
    label: "Wood",
    icon: TreePine,
    description: "Type → Finish",
    hierarchy: [
      { key: 1, label: "Types", type: "type", hasSKU: false, hasSwatch: false },
      { key: 2, label: "Finishes", type: "finish", hasSKU: true, skuLabel: "Wood SKU", hasSwatch: true },
    ],
  },
  {
    key: "metal",
    label: "Metal",
    icon: Hammer,
    description: "Type → Finish → Color",
    hierarchy: [
      { key: 1, label: "Types", type: "type", hasSKU: false, hasSwatch: false },
      { key: 2, label: "Finishes", type: "finish", hasSKU: false, hasSwatch: false },
      { key: 3, label: "Colors", type: "color", hasSKU: true, skuLabel: "Metal SKU", hasSwatch: true },
    ],
  },
  {
    key: "stone",
    label: "Stone",
    icon: Mountain,
    description: "Type → Finish",
    hierarchy: [
      { key: 1, label: "Types", type: "type", hasSKU: false, hasSwatch: false },
      { key: 2, label: "Finishes", type: "finish", hasSKU: true, skuLabel: "Stone SKU", hasSwatch: true },
    ],
  },
  {
    key: "weaving",
    label: "Weaving",
    icon: Package,
    description: "Styles Only",
    hierarchy: [
      { key: 1, label: "Styles", type: "style", hasSKU: true, skuLabel: "Weave SKU", hasSwatch: true },
    ],
  },
  {
    key: "carving",
    label: "Carving",
    icon: Zap,
    description: "Styles Only",
    hierarchy: [
      { key: 1, label: "Styles", type: "style", hasSKU: true, skuLabel: "Carving SKU", hasSwatch: true },
    ],
  },
];

type MaterialItem = Record<string, any>;

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState("fabric");
  const [activeHierarchyLevel, setActiveHierarchyLevel] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MaterialItem | null>(null);

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

  const activeCategory = materialCategories.find((cat) => cat.key === activeTab);
  const activeHierarchy = activeCategory?.hierarchy.find((h) => h.key === activeHierarchyLevel);

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Queries
  const { data: categories } = api.products.getMaterialCategories.useQuery();
  const { data: allCollections } = api.products.getAllCollections.useQuery();
  const { data: allMaterials, isLoading } = api.products.getAllMaterials.useQuery();

  // Map tab keys to exact category names
  const categoryNameMap: Record<string, string> = useMemo(() => ({
    fabric: 'Fabric',
    wood: 'Wood',
    metal: 'Metal',
    stone: 'Stone',
    weaving: 'Weave',
    carving: 'Carving',
  }), []);

  // Get category ID for current tab
  const currentCategoryId = useMemo(() => {
    // eslint-disable-next-line security/detect-object-injection
    const expectedName = categoryNameMap[activeTab];
    const found = categories?.find((c: any) => c.name === expectedName);
    return found?.id;
  }, [categories, activeTab, categoryNameMap]);

  // Filter materials by category and hierarchy level
  const currentData = useMemo(() => {
    if (!allMaterials || !currentCategoryId) {
      return [];
    }

    return allMaterials.filter((m: any) => {
      const matchesCategory = m.category_id === currentCategoryId;
      const matchesLevel = m.hierarchy_level === activeHierarchyLevel;
      return matchesCategory && matchesLevel;
    });
  }, [allMaterials, currentCategoryId, activeHierarchyLevel]);

  // Get parent options for child items
  const parentOptions = useMemo(() => {
    if (!allMaterials || !currentCategoryId || activeHierarchyLevel === 1) return [];

    return allMaterials.filter((m: any) =>
      m.category_id === currentCategoryId &&
      m.hierarchy_level === (activeHierarchyLevel - 1) &&
      m.active !== false
    );
  }, [allMaterials, currentCategoryId, activeHierarchyLevel]);

  // Get parent name for display
  const getParentName = useCallback((item: MaterialItem) => {
    if (!item.materials) return "";

    const parent = item.materials;
    if (parent.hierarchy_level === 1) {
      return parent.name;
    } else if (parent.materials) {
      return `${parent.materials.name} > ${parent.name}`;
    }
    return parent.name;
  }, []);

  // Mutations
  const invalidateCurrentData = () => {
    utils.products.getAllMaterials.invalidate();
  };

  const createMutation = api.products.createMaterial.useMutation({
    onSuccess: () => {
      toast.success(`${activeHierarchy?.label.slice(0, -1)} created successfully`);
      setIsCreateDialogOpen(false);
      invalidateCurrentData();
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const updateMutation = api.products.updateMaterial.useMutation({
    onSuccess: () => {
      toast.success(`${activeHierarchy?.label.slice(0, -1)} updated successfully`);
      setIsCreateDialogOpen(false);
      setEditingItem(null);
      invalidateCurrentData();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const deleteMutation = api.products.deleteMaterial.useMutation({
    onSuccess: () => {
      toast.success(`${activeHierarchy?.label.slice(0, -1)} deleted successfully`);
      invalidateCurrentData();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: itemToDelete.id });
    }
  };

  const handleEdit = useCallback((item: MaterialItem) => {
    setEditingItem(item);
    setIsCreateDialogOpen(true);
  }, []);

  // Form fields
  const formFields: FormField[] = useMemo(() => {
    const fields: FormField[] = [];

    // Parent selector for child items
    if (activeHierarchyLevel > 1) {
      fields.push({
        name: "parent_material_id",
        label: `Parent ${activeHierarchy?.label.slice(0, -1)}`,
        type: "select",
        required: true,
        options: parentOptions.map((option: any) => ({
          value: option.id,
          label: option.name,
        })),
        defaultValue: editingItem?.parent_material_id,
      });
    }

    // Common fields
    fields.push(
      {
        name: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "Enter name",
        defaultValue: editingItem?.name,
      },
      {
        name: "cost_per_unit",
        label: "Price Modifier ($)",
        type: "number",
        placeholder: "0.00",
        defaultValue: editingItem?.cost_per_unit?.toString(),
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Enter description (optional)",
        defaultValue: editingItem?.description,
      }
    );

    // SKU field (only for certain hierarchy levels)
    if (activeHierarchy?.hasSKU && activeHierarchy.skuLabel) {
      fields.push({
        name: "code",
        label: activeHierarchy.skuLabel,
        type: "text",
        placeholder: `Enter ${activeHierarchy.skuLabel.toLowerCase()}`,
        defaultValue: editingItem?.code,
      });
    }

    // Swatch image upload (only for certain hierarchy levels)
    if (activeHierarchy?.hasSwatch) {
      fields.push({
        name: "swatch_url",
        label: "Color Swatch Image",
        type: "file",
        accept: "image/*",
        placeholder: "Upload swatch image",
        defaultValue: editingItem?.swatch_url,
        helperText: editingItem?.swatch_url ? "Current swatch image will be replaced if you upload a new one" : undefined,
      });
    }

    // Collection associations - multi-select
    if (allCollections && allCollections.length > 0) {
      fields.push({
        name: "collection_ids",
        label: "Available in Collections",
        type: "select" as any, // Using multiselect functionality
        options: allCollections.map((c: any) => ({
          value: c.id,
          label: c.name,
        })),
        defaultValue: editingItem?.collections?.map((c: any) => c.id) || [],
        helperText: "Select which furniture collections this material is available for. Leave empty for all collections.",
      });
    }

    return fields;
  }, [activeHierarchy, activeHierarchyLevel, editingItem, parentOptions, allCollections]);

  // DataTable columns
  const columns: DataTableColumn<MaterialItem>[] = useMemo(() => {
    const cols: DataTableColumn<MaterialItem>[] = [];

    // Parent column for child items
    if (activeHierarchyLevel > 1) {
      cols.push({
        key: "parent",
        label: "Parent",
        render: (_, row) => (
          <span className="text-sm text-secondary">{getParentName(row)}</span>
        ),
      });
    }

    // Name column
    cols.push({
      key: "name",
      label: "Name",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value as string}</div>
          {row.description && (
            <div className="text-sm text-secondary line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
    });

    // Price Modifier column (only on the last/deepest hierarchy level)
    const isLastHierarchyLevel = activeCategory && activeHierarchyLevel === activeCategory.hierarchy.length;
    if (isLastHierarchyLevel) {
      cols.push({
        key: "cost_per_unit",
        label: "Price Modifier",
        sortable: true,
        render: (value) => {
          const cost = typeof value === 'number' ? value : parseFloat(value as string);
          return (
            <span className="text-sm">
              ${!isNaN(cost) ? cost.toFixed(2) : "0.00"}
            </span>
          );
        },
      });
    }

    // SKU column (only for certain hierarchy levels)
    if (activeHierarchy?.hasSKU && activeHierarchy.skuLabel) {
      cols.push({
        key: "code",
        label: activeHierarchy.skuLabel,
        render: (value) =>
          value ? (
            <span className="text-sm font-mono">{value as string}</span>
          ) : (
            <span className="text-muted">No SKU</span>
          ),
      });
    }

    // Swatch column (only for certain hierarchy levels)
    if (activeHierarchy?.hasSwatch) {
      cols.push({
        key: "swatch_url",
        label: "Swatch",
        render: (value, row) =>
          value ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value as string}
                alt={`Swatch for ${row.name}`}
                className="w-12 h-12 object-cover rounded border border-border"
              />
            </div>
          ) : (
            <span className="text-muted text-sm">No swatch</span>
          ),
      });
    }

    // Collections column - show badges
    cols.push({
      key: "collections",
      label: "Collections",
      render: (value) => {
        const collections = value as any[] || [];
        if (collections.length === 0) {
          return <span className="text-sm text-muted">All collections</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {collections.slice(0, 2).map((c: any) => (
              <Badge key={c.id} variant="outline" className="text-xs">
                {c.name}
              </Badge>
            ))}
            {collections.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{collections.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    });

    // Status column
    cols.push({
      key: "active",
      label: "Status",
      render: (value) => (
        <StatusBadge status={value !== false ? "active" : "inactive"} />
      ),
    });

    return cols;
  }, [activeHierarchyLevel, activeHierarchy, activeCategory, getParentName]);


  // Row actions configuration
  const rowActions: DataTableRowAction<MaterialItem>[] = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (row) => handleEdit(row),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setItemToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  // Update active hierarchy level when active tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setActiveHierarchyLevel(1); // Reset to first level
  };

  return (
    <div className="page-container">
      <Breadcrumb />
      <PageHeader
        title="Materials Management"
        subtitle="Manage all material options in unified system with collection associations"
        actions={[
          {
            label: "Refresh Data",
            icon: RefreshCw,
            onClick: () => invalidateCurrentData(),
          },
        ]}
      />

      <div className="card">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Main material type tabs */}
          <TabsList className="materials-tabs">
            {materialCategories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.key} value={category.key} className="material-tab">
                  <Icon className="icon-sm" />
                  <span>{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {materialCategories.map((category) => (
            <TabsContent key={category.key} value={category.key} className="space-y-4">
              {/* Sub-tabs for hierarchy levels */}
              {category.hierarchy.length > 1 && (
                <div className="material-subtabs">
                  {category.hierarchy.map((level, index) => (
                    <Button
                      key={level.key}
                      variant={activeHierarchyLevel === level.key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveHierarchyLevel(level.key)}
                      className="material-subtab-btn"
                    >
                      {index > 0 && <span className="text-muted mx-1">→</span>}
                      {level.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Hierarchy breadcrumb */}
              <div className="hierarchy-breadcrumb">
                <category.icon className="icon-sm text-primary" />
                <span className="text-sm text-secondary">{category.description}</span>
              </div>

              {/* Add button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreateDialogOpen(true);
                  }}
                >
                  <Plus className="icon-sm" />
                  Add {activeHierarchy?.label.slice(0, -1)}
                </Button>
              </div>

              {/* Filters - New Unified System */}
              <TableFilters.Bar
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              >
                {/* Search Filter */}
                <TableFilters.Search
                  value={rawFilters.search}
                  onChange={(value) => setFilter('search', value)}
                  placeholder="Search by name or description..."
                />
              </TableFilters.Bar>

              {/* DataTable */}
              {isLoading ? (
                <LoadingState message={`Loading ${activeHierarchy?.label.toLowerCase()}...`} size="lg" />
              ) : !currentData || currentData.length === 0 ? (
                <EmptyState
                  icon={category.icon}
                  title={`No ${activeHierarchy?.label.toLowerCase()} found`}
                  description={hasActiveFilters
                    ? "Try adjusting your filters to see more results."
                    : `Start by adding your first ${activeHierarchy?.label.toLowerCase().slice(0, -1)}.`}
                  action={{
                    label: `Add First ${activeHierarchy?.label.slice(0, -1)}`,
                    onClick: () => {
                      setEditingItem(null);
                      setIsCreateDialogOpen(true);
                    },
                    icon: Plus,
                  }}
                />
              ) : (
                <DataTable
                  data={currentData as any[]}
                  columns={columns as any}
                  rowActions={rowActions as any}
                  pagination={{ pageSize: 20, showSizeSelector: true }}
                  emptyState={{
                    icon: category.icon,
                    title: `No ${activeHierarchy?.label.toLowerCase()} match your filters`,
                    description: "Try adjusting your search criteria",
                  }}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {activeHierarchy?.label.slice(0, -1)}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be undone.
              {itemToDelete && itemToDelete.other_materials?.length > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This material has {itemToDelete.other_materials.length} child materials that must be deleted first.
                </span>
              )}
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

      {/* Create/Edit Dialog */}
      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingItem(null);
        }}
        title={`${editingItem ? "Edit" : "Add New"} ${activeHierarchy?.label.slice(0, -1) || "Item"}`}
        description={`${editingItem ? "Update" : "Create a new"} ${activeHierarchy?.label.toLowerCase().slice(0, -1) || "item"}.`}
        fields={formFields}
        onSubmit={async (data) => {
          const payload: any = {
            name: data.name as string,
            code: data.code as string || `${activeTab.toUpperCase()}-${Date.now()}`, // Auto-generate if not provided
            type: activeHierarchy?.type || "",
            description: data.description as string || undefined,
            category_id: currentCategoryId!,
            active: true,
            cost_per_unit: data.cost_per_unit ? parseFloat(data.cost_per_unit as string) : undefined,
            hierarchy_level: activeHierarchyLevel,
            parent_material_id: data.parent_material_id as string || undefined,
            collection_ids: (data.collection_ids as string[]) || [],
          };

          // Handle swatch image upload
          if (activeHierarchy?.hasSwatch && data.swatch_url) {
            if (data.swatch_url instanceof File) {
              // Upload new file to materials bucket
              const formData = new FormData();
              formData.append('file', data.swatch_url);
              formData.append('bucket', 'materials');
              formData.append('category', 'material-swatches');
              formData.append('projectId', activeHierarchy.key.toString());

              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });

              if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
              }

              const uploadResult = await uploadResponse.json();

              if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed');
              }

              payload.swatch_url = uploadResult.publicUrl;
            } else if (data.swatch_url === null) {
              // Remove existing image
              payload.swatch_url = null;
            } else {
              // Keep existing image URL
              payload.swatch_url = editingItem?.swatch_url;
            }
          }

          if (editingItem) {
            await updateMutation.mutateAsync({ id: editingItem.id, ...payload });
          } else {
            await createMutation.mutateAsync(payload);
          }
        }}
        submitLabel={editingItem ? "Update" : "Create"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
