"use client";

import { useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Plus, Palette, TreePine, Hammer, Mountain, Package, Zap, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  FormDialog,
  EmptyState,
  LoadingState,
  DataTable,
  StatusBadge,
  type FormField,
  type DataTableColumn,
  type DataTableFilter,
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

// Material hierarchy configuration
const materialCategories = [
  {
    key: "fabric",
    label: "Fabrics",
    icon: Palette,
    description: "Brand → Collection → Color",
    hierarchy: [
      {
        key: "fabric_brands",
        label: "Brands",
        parent: null,
        hasColors: false,
        procedures: {
          get: "getFabricBrands",
          create: "createFabricBrand",
          update: "updateFabricBrand",
          delete: "deleteFabricBrand",
        },
      },
      {
        key: "fabric_collections",
        label: "Collections",
        parent: "brand_id",
        parentLabel: "Brand",
        hasColors: false,
        procedures: {
          get: "getFabricCollections",
          create: "createFabricCollection",
          update: "updateFabricCollection",
          delete: "deleteFabricCollection",
        },
      },
      {
        key: "fabric_colors",
        label: "Colors",
        parent: "collection_id",
        parentLabel: "Collection",
        hasColors: true,
        procedures: {
          get: "getFabricColors",
          create: "createFabricColor",
          update: "updateFabricColor",
          delete: "deleteFabricColor",
        },
      },
    ],
  },
  {
    key: "wood",
    label: "Wood",
    icon: TreePine,
    description: "Type → Finish",
    hierarchy: [
      {
        key: "wood_types",
        label: "Types",
        parent: null,
        hasColors: false,
        procedures: {
          get: "getWoodTypes",
          create: "createWoodType",
          update: "updateWoodType",
          delete: "deleteWoodType",
        },
      },
      {
        key: "wood_finishes",
        label: "Finishes",
        parent: "wood_type_id",
        parentLabel: "Wood Type",
        hasColors: true, // Changed to enable swatch upload
        procedures: {
          get: "getWoodFinishes",
          create: "createWoodFinish",
          update: "updateWoodFinish",
          delete: "deleteWoodFinish",
        },
      },
    ],
  },
  {
    key: "metal",
    label: "Metal",
    icon: Hammer,
    description: "Type → Finish → Color",
    hierarchy: [
      {
        key: "metal_types",
        label: "Types",
        parent: null,
        hasColors: false,
        procedures: {
          get: "getMetalTypes",
          create: "createMetalType",
          update: "updateMetalType",
          delete: "deleteMetalType",
        },
      },
      {
        key: "metal_finishes",
        label: "Finishes",
        parent: "metal_type_id",
        parentLabel: "Metal Type",
        hasColors: false,
        procedures: {
          get: "getMetalFinishes",
          create: "createMetalFinish",
          update: "updateMetalFinish",
          delete: "deleteMetalFinish",
        },
      },
      {
        key: "metal_colors",
        label: "Colors",
        parent: "metal_finish_id",
        parentLabel: "Metal Finish",
        hasColors: true,
        procedures: {
          get: "getMetalColors",
          create: "createMetalColor",
          update: "updateMetalColor",
          delete: "deleteMetalColor",
        },
      },
    ],
  },
  {
    key: "stone",
    label: "Stone",
    icon: Mountain,
    description: "Type → Finish",
    hierarchy: [
      {
        key: "stone_types",
        label: "Types",
        parent: null,
        hasColors: false,
        procedures: {
          get: "getStoneTypes",
          create: "createStoneType",
          update: "updateStoneType",
          delete: "deleteStoneType",
        },
      },
      {
        key: "stone_finishes",
        label: "Finishes",
        parent: "stone_type_id",
        parentLabel: "Stone Type",
        hasColors: true, // Changed to enable swatch upload
        procedures: {
          get: "getStoneFinishes",
          create: "createStoneFinish",
          update: "updateStoneFinish",
          delete: "deleteStoneFinish",
        },
      },
    ],
  },
  {
    key: "weaving",
    label: "Weaving",
    icon: Package,
    description: "Styles Only",
    hierarchy: [
      {
        key: "weaving_styles",
        label: "Styles",
        parent: null,
        hasColors: true, // Changed to enable swatch upload
        procedures: {
          get: "getWeavingStyles",
          create: "createWeavingStyle",
          update: "updateWeavingStyle",
          delete: "deleteWeavingStyle",
        },
      },
    ],
  },
  {
    key: "carving",
    label: "Carving",
    icon: Zap,
    description: "Styles Only",
    hierarchy: [
      {
        key: "carving_styles",
        label: "Styles",
        parent: null,
        hasColors: true, // Changed to enable swatch upload
        procedures: {
          get: "getCarvingStyles",
          create: "createCarvingStyle",
          update: "updateCarvingStyle",
          delete: "deleteCarvingStyle",
        },
      },
    ],
  },
];

type MaterialItem = Record<string, any>;

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState("fabric");
  const [activeSubTab, setActiveSubTab] = useState("fabric_brands");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MaterialItem | null>(null);

  const activeCategory = materialCategories.find((cat) => cat.key === activeTab);
  const activeHierarchy = activeCategory?.hierarchy.find((h) => h.key === activeSubTab);

  // Dynamic API queries based on active hierarchy
  const fabricBrands = api.materialTypes.getFabricBrands.useQuery(undefined, {
    enabled: activeSubTab === "fabric_brands",
  });
  const fabricCollections = api.materialTypes.getFabricCollections.useQuery(undefined, {
    enabled: activeSubTab === "fabric_collections",
  });
  const fabricColors = api.materialTypes.getFabricColors.useQuery(undefined, {
    enabled: activeSubTab === "fabric_colors",
  });
  const woodTypes = api.materialTypes.getWoodTypes.useQuery(undefined, {
    enabled: activeSubTab === "wood_types",
  });
  const woodFinishes = api.materialTypes.getWoodFinishes.useQuery(undefined, {
    enabled: activeSubTab === "wood_finishes",
  });
  const metalTypes = api.materialTypes.getMetalTypes.useQuery(undefined, {
    enabled: activeSubTab === "metal_types",
  });
  const metalFinishes = api.materialTypes.getMetalFinishes.useQuery(undefined, {
    enabled: activeSubTab === "metal_finishes",
  });
  const metalColors = api.materialTypes.getMetalColors.useQuery(undefined, {
    enabled: activeSubTab === "metal_colors",
  });
  const stoneTypes = api.materialTypes.getStoneTypes.useQuery(undefined, {
    enabled: activeSubTab === "stone_types",
  });
  const stoneFinishes = api.materialTypes.getStoneFinishes.useQuery(undefined, {
    enabled: activeSubTab === "stone_finishes",
  });
  const weavingStyles = api.materialTypes.getWeavingStyles.useQuery(undefined, {
    enabled: activeSubTab === "weaving_styles",
  });
  const carvingStyles = api.materialTypes.getCarvingStyles.useQuery(undefined, {
    enabled: activeSubTab === "carving_styles",
  });

  // Get the appropriate data based on active sub-tab
  const getCurrentData = () => {
    switch (activeSubTab) {
      case "fabric_brands": return fabricBrands.data || [];
      case "fabric_collections": return fabricCollections.data || [];
      case "fabric_colors": return fabricColors.data || [];
      case "wood_types": return woodTypes.data || [];
      case "wood_finishes": return woodFinishes.data || [];
      case "metal_types": return metalTypes.data || [];
      case "metal_finishes": return metalFinishes.data || [];
      case "metal_colors": return metalColors.data || [];
      case "stone_types": return stoneTypes.data || [];
      case "stone_finishes": return stoneFinishes.data || [];
      case "weaving_styles": return weavingStyles.data || [];
      case "carving_styles": return carvingStyles.data || [];
      default: return [];
    }
  };

  const currentData = getCurrentData();
  const isLoading =
    fabricBrands.isLoading ||
    fabricCollections.isLoading ||
    fabricColors.isLoading ||
    woodTypes.isLoading ||
    woodFinishes.isLoading ||
    metalTypes.isLoading ||
    metalFinishes.isLoading ||
    metalColors.isLoading ||
    stoneTypes.isLoading ||
    stoneFinishes.isLoading ||
    weavingStyles.isLoading ||
    carvingStyles.isLoading;

  // Get parent options for child items
  const getParentOptions = () => {
    if (!activeHierarchy?.parent) return [];

    if (activeSubTab === "fabric_collections") return fabricBrands.data || [];
    if (activeSubTab === "fabric_colors") return fabricCollections.data || [];
    if (activeSubTab === "wood_finishes") return woodTypes.data || [];
    if (activeSubTab === "metal_finishes") return metalTypes.data || [];
    if (activeSubTab === "metal_colors") return metalFinishes.data || [];
    if (activeSubTab === "stone_finishes") return stoneTypes.data || [];

    return [];
  };

  const parentOptions = getParentOptions();

  // Get parent name for display
  const getParentName = useCallback((item: MaterialItem) => {
    if (!activeHierarchy?.parent) return "";

    if (activeSubTab === "fabric_collections") return item.fabric_brands?.name || "";
    if (activeSubTab === "fabric_colors") {
      const brand = item.fabric_collections?.fabric_brands?.name;
      const collection = item.fabric_collections?.name;
      return brand && collection ? `${brand} > ${collection}` : "";
    }
    if (activeSubTab === "wood_finishes") return item.wood_types?.name || "";
    if (activeSubTab === "metal_finishes") return item.metal_types?.name || "";
    if (activeSubTab === "metal_colors") {
      const type = item.metal_finishes?.metal_types?.name;
      const finish = item.metal_finishes?.name;
      return type && finish ? `${type} > ${finish}` : "";
    }
    if (activeSubTab === "stone_finishes") return item.stone_types?.name || "";

    return "";
  }, [activeSubTab, activeHierarchy]);

  // Mutations
  const refetchCurrentData = async () => {
    switch (activeSubTab) {
      case "fabric_brands": await fabricBrands.refetch(); break;
      case "fabric_collections": await fabricCollections.refetch(); break;
      case "fabric_colors": await fabricColors.refetch(); break;
      case "wood_types": await woodTypes.refetch(); break;
      case "wood_finishes": await woodFinishes.refetch(); break;
      case "metal_types": await metalTypes.refetch(); break;
      case "metal_finishes": await metalFinishes.refetch(); break;
      case "metal_colors": await metalColors.refetch(); break;
      case "stone_types": await stoneTypes.refetch(); break;
      case "stone_finishes": await stoneFinishes.refetch(); break;
      case "weaving_styles": await weavingStyles.refetch(); break;
      case "carving_styles": await carvingStyles.refetch(); break;
    }
  };

  const createMutation = (api.materialTypes as any)[activeHierarchy?.procedures.create as any]?.useMutation?.({
    onSuccess: () => {
      toast.success(`${activeHierarchy?.label.slice(0, -1)} created successfully`);
      setIsCreateDialogOpen(false);
      refetchCurrentData();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const updateMutation = (api.materialTypes as any)[activeHierarchy?.procedures.update as any]?.useMutation?.({
    onSuccess: () => {
      toast.success(`${activeHierarchy?.label.slice(0, -1)} updated successfully`);
      setIsCreateDialogOpen(false);
      setEditingItem(null);
      refetchCurrentData();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const deleteMutation = (api.materialTypes as any)[activeHierarchy?.procedures.delete as any]?.useMutation?.({
    onSuccess: () => {
      toast.success(`${activeHierarchy?.label.slice(0, -1)} deleted successfully`);
      refetchCurrentData();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation?.mutate({ id: itemToDelete.id });
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
    if (activeHierarchy?.parent) {
      fields.push({
        name: activeHierarchy.parent,
        label: `Parent ${activeHierarchy.parentLabel}`,
        type: "select",
        required: true,
        options: parentOptions.map((option: any) => ({
          value: option.id,
          label: option.name,
        })),
        defaultValue: editingItem?.[activeHierarchy.parent],
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
        name: "price_modifier",
        label: "Price Modifier ($)",
        type: "number",
        placeholder: "0.00",
        defaultValue: editingItem?.price_modifier?.toString(),
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Enter description (optional)",
        defaultValue: editingItem?.description,
      }
    );

    // Fabric SKU and Swatch for color items
    if (activeHierarchy?.hasColors) {
      fields.push({
        name: "hex_code",
        label: "Fabric SKU",
        type: "text",
        placeholder: "Enter fabric SKU",
        defaultValue: editingItem?.hex_code,
      });

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

    // Sort order
    fields.push({
      name: "sort_order",
      label: "Sort Order",
      type: "number",
      placeholder: "Optional",
      defaultValue: editingItem?.sort_order?.toString(),
    });

    // Complexity level for carving
    if (activeSubTab === "carving_styles") {
      fields.push({
        name: "complexity_level",
        label: "Complexity Level",
        type: "number",
        placeholder: "1",
        defaultValue: editingItem?.complexity_level?.toString(),
      });
    }

    return fields;
  }, [activeHierarchy, activeSubTab, editingItem, parentOptions]);

  // DataTable columns
  const columns: DataTableColumn<MaterialItem>[] = useMemo(() => {
    const cols: DataTableColumn<MaterialItem>[] = [];

    // Parent column for child items
    if (activeHierarchy?.parent) {
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

    // Price modifier column
    cols.push({
      key: "price_modifier",
      label: "Price Modifier",
      sortable: true,
      render: (value) => (
        <span className="text-sm">${typeof value === "number" ? value.toFixed(2) : "0.00"}</span>
      ),
    });

    // Fabric SKU and Swatch for color items
    if (activeHierarchy?.hasColors) {
      cols.push({
        key: "hex_code",
        label: "Fabric SKU",
        render: (value) =>
          value ? (
            <span className="text-sm font-mono">{value as string}</span>
          ) : (
            <span className="text-muted">No SKU</span>
          ),
      });

      // Swatch column
      cols.push({
        key: "swatch_url",
        label: "Swatch",
        render: (value, row) =>
          value ? (
            <div className="flex items-center gap-2">
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

    // Status column
    cols.push({
      key: "active",
      label: "Status",
      render: (value) => (
        <StatusBadge status={value !== false ? "active" : "inactive"} />
      ),
    });

    return cols;
  }, [activeHierarchy, getParentName, handleEdit]);

  // DataTable filters
  const filters: DataTableFilter[] = [
    {
      key: "search",
      label: `Search ${activeHierarchy?.label.toLowerCase() || "items"}`,
      type: "search",
      placeholder: "Search by name or description...",
    },
  ];

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

  // Update active sub-tab when active tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const category = materialCategories.find((cat) => cat.key === value);
    if (category) {
      setActiveSubTab(category.hierarchy[0].key);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Materials Management"
        subtitle="Manage all material options and their cascading relationships for order configuration"
        actions={[
          {
            label: "Refresh Data",
            icon: RefreshCw,
            onClick: () => refetchCurrentData(),
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
                      variant={activeSubTab === level.key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveSubTab(level.key)}
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

              {/* DataTable */}
              {isLoading ? (
                <LoadingState message={`Loading ${activeHierarchy?.label.toLowerCase()}...`} size="lg" />
              ) : !currentData || currentData.length === 0 ? (
                <EmptyState
                  icon={category.icon}
                  title={`No ${activeHierarchy?.label.toLowerCase()} found`}
                  description={`Start by adding your first ${activeHierarchy?.label.toLowerCase().slice(0, -1)}.`}
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
                  filters={filters}
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
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation?.isPending}
            >
              {deleteMutation?.isPending ? 'Deleting...' : 'Delete'}
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
            description: data.description as string || undefined,
            price_modifier: data.price_modifier ? parseFloat(data.price_modifier as string) : 0,
            sort_order: data.sort_order ? parseInt(data.sort_order as string) : undefined,
          };

          // Add parent ID if applicable
          if (activeHierarchy?.parent && data[activeHierarchy.parent]) {
            payload[activeHierarchy.parent] = data[activeHierarchy.parent];
          }

          // Add hex_code for color items
          if (activeHierarchy?.hasColors && data.hex_code) {
            payload.hex_code = data.hex_code as string;
          }

          // Handle swatch image upload
          if (activeHierarchy?.hasColors && data.swatch_url) {
            if (data.swatch_url instanceof File) {
              // Upload new file to materials bucket
              const formData = new FormData();
              formData.append('file', data.swatch_url);
              formData.append('bucket', 'materials');
              formData.append('category', 'fabric-swatches');
              formData.append('projectId', activeHierarchy.key);

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

          // Add complexity_level for carving
          if (activeSubTab === "carving_styles" && data.complexity_level) {
            payload.complexity_level = parseInt(data.complexity_level as string);
          }

          if (editingItem) {
            payload.id = editingItem.id;
            await updateMutation?.mutateAsync(payload);
          } else {
            await createMutation?.mutateAsync(payload);
          }
        }}
        submitLabel={editingItem ? "Update" : "Create"}
        isLoading={createMutation?.isPending || updateMutation?.isPending}
      />
    </div>
  );
}
