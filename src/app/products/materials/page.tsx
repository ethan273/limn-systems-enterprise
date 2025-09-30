"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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
  parent_material_id?: string | null;
  hierarchy_level?: number | null;
  hierarchy_path?: string | null;
  category?: {
    id: string;
    name: string;
  };
  parent_material?: {
    id: string;
    name: string;
    hierarchy_path?: string | null;
    type?: string | null;
  } | null;
  child_materials?: Array<{
    id: string;
    name: string;
    type?: string | null;
  }>;
  collections?: Array<{
    id: string;
    name: string;
    prefix?: string | null;
  }>;
}

interface FurnitureCollection {
  id: string;
  name: string;
  prefix?: string | null;
  description?: string | null;
}

interface _MaterialCategory {
  id: string;
  name: string;
  icon?: string;
  sort_order?: number;
  active?: boolean;
}

interface MaterialFormData {
  name: string;
  code: string;
  type: string;
  description: string;
  category_id: string;
  active: boolean;
  cost_per_unit: number;
  unit_of_measure: string;
  parent_material_id: string;
  hierarchy_level: number;
  collection_ids: string[];
  material_category: string;
  hierarchy_action: string;
}

const MATERIAL_CATEGORIES = [
  {
    id: 'fabric',
    name: 'Fabric',
    icon: '🧵',
    subcategories: [
      { id: 'brands', name: 'Brands' },
      { id: 'collections', name: 'Collections' },
      { id: 'colors', name: 'Colors' }
    ]
  },
  {
    id: 'wood',
    name: 'Wood',
    icon: '🪵',
    subcategories: [
      { id: 'types', name: 'Types' },
      { id: 'finishes', name: 'Finishes' }
    ]
  },
  {
    id: 'metal',
    name: 'Metal',
    icon: '⚙️',
    subcategories: [
      { id: 'types', name: 'Types' },
      { id: 'finishes', name: 'Finishes' },
      { id: 'colors', name: 'Colors' }
    ]
  },
  {
    id: 'stone',
    name: 'Stone',
    icon: '🪨',
    subcategories: [
      { id: 'types', name: 'Types' },
      { id: 'finishes', name: 'Finishes' }
    ]
  },
  {
    id: 'weaving',
    name: 'Weaving',
    icon: '🧺',
    subcategories: [
      { id: 'materials', name: 'Materials' },
      { id: 'patterns', name: 'Patterns' },
      { id: 'colors', name: 'Colors' }
    ]
  },
  {
    id: 'carving',
    name: 'Carving',
    icon: '🗿',
    subcategories: [
      { id: 'styles', name: 'Styles' },
      { id: 'patterns', name: 'Patterns' }
    ]
  }
];

export default function MaterialsPage() {
  const [activeCategory, setActiveCategory] = useState('fabric');
  const [activeSubcategory, setActiveSubcategory] = useState('brands');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState<MaterialFormData>({
    name: "",
    code: "",
    type: "",
    description: "",
    category_id: "",
    active: true,
    cost_per_unit: 0,
    unit_of_measure: "",
    parent_material_id: "",
    hierarchy_level: 1,
    collection_ids: [],
    material_category: "",
    hierarchy_action: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [_selectedBrandForColor, _setSelectedBrandForColor] = useState<string>("");
  const [_selectedTypeForFinish, _setSelectedTypeForFinish] = useState<string>("");

  // API queries
  const { data: materials = [], isLoading: materialsLoading, refetch: refetchMaterials } = api.products.getAllMaterials.useQuery();
  const { data: materialCategories = [], isLoading: _categoriesLoading } = api.products.getMaterialCategories.useQuery();
  const { data: furnitureCollections = [] } = api.products.getAllCollections.useQuery();

  // Mutations
  const createMaterialMutation = api.products.createMaterial.useMutation();
  const updateMaterialMutation = api.products.updateMaterial.useMutation();
  const deleteMaterialMutation = api.products.deleteMaterial.useMutation();

  // Helper functions
  const generateMaterialCode = (materialType: string, name: string): string => {
    const prefix = materialType.substring(0, 4).toUpperCase();
    const namePart = name.replace(/\s+/g, '-').substring(0, 10).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${namePart}-${timestamp}`;
  };

  const getHierarchyActionsForCategory = (category: string) => {
    const actionMap: Record<string, Array<{id: string, label: string, level: number}>> = {
      'fabric': [
        { id: 'add_brand', label: 'Add New Fabric Brand (top-level)', level: 1 },
        { id: 'add_fabric_collection', label: 'Add Fabric Collection to Brand', level: 2 },
        { id: 'add_fabric_color', label: 'Add Fabric Color to Collection', level: 3 }
      ],
      'wood': [
        { id: 'add_wood_type', label: 'Add New Wood Type', level: 1 },
        { id: 'add_wood_finish', label: 'Add Finish to Wood Type', level: 2 }
      ],
      'metal': [
        { id: 'add_metal_type', label: 'Add New Metal Type', level: 1 },
        { id: 'add_metal_finish', label: 'Add Finish to Metal Type', level: 2 },
        { id: 'add_metal_color', label: 'Add Color to Metal Finish', level: 3 }
      ],
      'stone': [
        { id: 'add_stone_type', label: 'Add New Stone Type', level: 1 },
        { id: 'add_stone_finish', label: 'Add Finish to Stone Type', level: 2 }
      ],
      'weaving': [
        { id: 'add_weaving_material', label: 'Add Weaving Material', level: 1 },
        { id: 'add_weaving_pattern', label: 'Add Weaving Pattern', level: 1 },
        { id: 'add_weaving_color', label: 'Add Weaving Color', level: 1 }
      ],
      'carving': [
        { id: 'add_carving_style', label: 'Add Carving Style', level: 1 },
        { id: 'add_carving_pattern', label: 'Add Carving Pattern', level: 1 }
      ]
    };
    // eslint-disable-next-line security/detect-object-injection
    return actionMap[category] || [];
  };

  const needsParentSelection = (action: string): boolean => {
    return action.includes('collection') || action.includes('color') || action.includes('finish');
  };

  const getMaterialTypeFromAction = (action: string): string => {
    const typeMap: Record<string, string> = {
      'add_brand': 'brand',
      'add_fabric_collection': 'collection',
      'add_fabric_color': 'color',
      'add_wood_type': 'wood_type',
      'add_wood_finish': 'wood_finish',
      'add_metal_type': 'metal_type',
      'add_metal_finish': 'metal_finish',
      'add_metal_color': 'metal_color',
      'add_stone_type': 'stone_type',
      'add_stone_finish': 'stone_finish',
      'add_weaving_material': 'weaving_material',
      'add_weaving_pattern': 'weaving_pattern',
      'add_weaving_color': 'weaving_color',
      'add_carving_style': 'carving_style',
      'add_carving_pattern': 'carving_pattern'
    };
    // eslint-disable-next-line security/detect-object-injection
    return typeMap[action] || '';
  };

  const getHierarchyLevelFromAction = (action: string): number => {
    const actions = getHierarchyActionsForCategory(formData.material_category);
    const actionData = actions.find(a => a.id === action);
    return actionData?.level || 1;
  };

  const getAvailableFurnitureCollections = (): FurnitureCollection[] => {
    if (!formData.parent_material_id) {
      return furnitureCollections as unknown as FurnitureCollection[];
    }

    const parent = (materials as unknown as Material[]).find(m => m.id === formData.parent_material_id);
    if (!parent || !parent.collections || parent.collections.length === 0) {
      return furnitureCollections as unknown as FurnitureCollection[];
    }

    const parentCollectionIds = parent.collections.map(fc => fc.id);
    return (furnitureCollections as unknown as FurnitureCollection[]).filter(fc => parentCollectionIds.includes(fc.id));
  };

  const canSelectFurnitureCollection = (collectionId: string): boolean => {
    if (!formData.parent_material_id) {
      return true;
    }

    const parent = (materials as unknown as Material[]).find(m => m.id === formData.parent_material_id);
    if (!parent || !parent.collections || parent.collections.length === 0) {
      return true;
    }

    return parent.collections.some(fc => fc.id === collectionId);
  };

  // Filter materials by active category and subcategory
  const filteredMaterials = materials.filter((material: any) => {
    const category = materialCategories.find((cat: any) => cat.id === material.category_id);
    if (!category) return false;

    // Map database category names to our navigation
    const categoryNameMap: Record<string, string> = {
      'fabric': 'fabric',
      'wood': 'wood',
      'metal': 'metal',
      'stone': 'stone',
      'weave': 'weaving',
      'carving': 'carving'
    };

    const mappedCategoryName = categoryNameMap[category.name.toLowerCase()] || category.name.toLowerCase();
    return mappedCategoryName === activeCategory;
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Material name is required";
    }

    if (!formData.category_id) {
      errors.category_id = "Category is required";
    }

    if (formData.cost_per_unit < 0) {
      errors.cost_per_unit = "Cost must be non-negative";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const isEditing = !!editingMaterial;
    setActionLoading(isEditing ? "update" : "create");

    try {
      const materialType = getMaterialTypeFromAction(formData.hierarchy_action);
      const hierarchyLevel = getHierarchyLevelFromAction(formData.hierarchy_action);
      const materialCode = formData.code || generateMaterialCode(materialType, formData.name);

      if (isEditing) {
        await updateMaterialMutation.mutateAsync({
          id: editingMaterial.id,
          name: formData.name,
          code: materialCode,
          type: materialType || formData.type,
          description: formData.description || undefined,
          category_id: formData.category_id,
          active: formData.active,
          cost_per_unit: formData.cost_per_unit || undefined,
          unit_of_measure: formData.unit_of_measure || undefined,
          collection_ids: formData.collection_ids
        });
      } else {
        await createMaterialMutation.mutateAsync({
          name: formData.name,
          code: materialCode,
          type: materialType || formData.type,
          description: formData.description || undefined,
          category_id: formData.category_id,
          active: formData.active,
          cost_per_unit: formData.cost_per_unit || undefined,
          unit_of_measure: formData.unit_of_measure || undefined,
          parent_material_id: formData.parent_material_id || undefined,
          hierarchy_level: hierarchyLevel,
          collection_ids: formData.collection_ids.length > 0 ? formData.collection_ids : undefined
        });
      }

      toast({
        title: "Success",
        description: `Material ${isEditing ? "updated" : "created"} successfully!`,
      });

      setShowCreateForm(false);
      setEditingMaterial(null);
      resetForm();
      await refetchMaterials();
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} material`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      code: material.code,
      type: material.type || "",
      description: material.description || "",
      category_id: material.category_id || "",
      active: material.active !== false,
      cost_per_unit: material.cost_per_unit || 0,
      unit_of_measure: material.unit_of_measure || "",
      parent_material_id: material.parent_material_id || "",
      hierarchy_level: material.hierarchy_level || 1,
      collection_ids: material.collections?.map(c => c.id) || [],
      material_category: "",
      hierarchy_action: ""
    });
    setFormErrors({});
    setShowCreateForm(true);
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(`Are you sure you want to delete "${material.name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(`delete-${material.id}`);

    try {
      await deleteMaterialMutation.mutateAsync({ id: material.id });

      toast({
        title: "Success",
        description: "Material deleted successfully!",
      });

      await refetchMaterials();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: "",
      description: "",
      category_id: "",
      active: true,
      cost_per_unit: 0,
      unit_of_measure: "",
      parent_material_id: "",
      hierarchy_level: 1,
      collection_ids: [],
      material_category: "",
      hierarchy_action: ""
    });
    setFormErrors({});
    _setSelectedBrandForColor("");
    _setSelectedTypeForFinish("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Filter materials by subcategory for consistent rendering
  const getSubcategoryFilteredMaterials = (): any[] => {
    let subcategoryFilteredMaterials: any[] = filteredMaterials;
    const materialsTyped = materials as unknown as Material[];

    if (activeCategory === 'fabric') {
      if (activeSubcategory === 'brands') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'brand');
      } else if (activeSubcategory === 'collections') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'collection');
      } else if (activeSubcategory === 'colors') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'color');
      }
    } else if (activeCategory === 'wood') {
      if (activeSubcategory === 'types') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'wood_type');
      } else if (activeSubcategory === 'finishes') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'wood_finish');
      }
    } else if (activeCategory === 'metal') {
      if (activeSubcategory === 'types') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'metal_type');
      } else if (activeSubcategory === 'finishes') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'metal_finish');
      } else if (activeSubcategory === 'colors') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'metal_color');
      }
    } else if (activeCategory === 'stone') {
      if (activeSubcategory === 'types') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'stone_type');
      } else if (activeSubcategory === 'finishes') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'stone_finish');
      }
    } else if (activeCategory === 'weaving') {
      if (activeSubcategory === 'materials') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'weaving_material');
      } else if (activeSubcategory === 'patterns') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'weaving_pattern');
      } else if (activeSubcategory === 'colors') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'weaving_color');
      }
    } else if (activeCategory === 'carving') {
      if (activeSubcategory === 'styles') {
        subcategoryFilteredMaterials = materialsTyped.filter(m => m.type === 'carving_style' || m.type === 'carving_pattern');
      }
    }

    return subcategoryFilteredMaterials;
  };

  const activeCategoryData = MATERIAL_CATEGORIES.find(cat => cat.id === activeCategory);

  // Render consistent table view for all materials
  const renderMaterialsHierarchy = () => {
    const subcategoryFilteredMaterials = getSubcategoryFilteredMaterials();
    return renderDefaultTable(subcategoryFilteredMaterials);
  };


  // Default table view for all material types
  const renderDefaultTable = (materialsList: any[] = filteredMaterials) => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Hierarchy Path</TableHead>
            <TableHead>Cost per Unit</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Available In</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materialsList.map((material: any, index: number) => {
            const hasChildren = material.child_materials && material.child_materials.length > 0;
            return (
              <TableRow key={`materials-table-${index}-${material.id}`}>
                <TableCell>
                  <div className="font-medium text-gray-100">{material.name}</div>
                  {material.description && (
                    <div className="text-sm text-gray-400 mt-1">{material.description}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-300 font-mono">{material.code || "—"}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-300">{material.type || "—"}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-300">
                    {material.hierarchy_path ? (
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded">{material.hierarchy_path}</span>
                    ) : material.parent_material ? (
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                        {material.parent_material.name} &gt; {material.name}
                      </span>
                    ) : (
                      <span className="text-gray-500">Top Level</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-100">
                    {material.cost_per_unit ? formatCurrency(material.cost_per_unit) : "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-300">{material.unit_of_measure || "—"}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {material.collections && material.collections.length > 0 ? (
                      material.collections.map((collection: any) => (
                        <Badge key={collection.id} variant="secondary" className="text-xs">
                          {collection.prefix || collection.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                        All Collections
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={material.active !== false ? "default" : "secondary"}
                    className={material.active !== false ? "bg-green-600 text-green-100" : "bg-gray-600 text-gray-300"}
                  >
                    {material.active !== false ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-400">
                    {formatDate(material.created_at)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(material)}
                      disabled={!!actionLoading}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(material)}
                      disabled={!!actionLoading || hasChildren}
                      className={hasChildren ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-700 hover:bg-red-50"}
                      title={hasChildren ? "Cannot delete material with children" : "Delete material"}
                    >
                      {actionLoading === `delete-${material.id}` ? (
                        <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Materials
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Manage your material inventory and specifications</p>
          <div className="flex items-center space-x-4 mt-4">
            <div className="text-sm text-gray-500">
              <span className="font-medium">{materials.length}</span> total materials
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-medium">{getSubcategoryFilteredMaterials().length}</span> in current subcategory
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => refetchMaterials()}
            disabled={materialsLoading}
            variant="outline"
            className="border-gray-600 hover:border-gray-500"
          >
            {materialsLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setEditingMaterial(null);
              setShowCreateForm(true);
            }}
            disabled={showCreateForm}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            + New Material
          </Button>
        </div>
      </div>

      {/* Main Category Navigation */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700 shadow-lg">
        <CardContent className="p-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {MATERIAL_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                onClick={() => {
                  setActiveCategory(category.id);
                  setActiveSubcategory(category.subcategories[0].id);
                }}
                className={`whitespace-nowrap px-6 py-3 text-sm font-medium transition-all duration-200 ${
                  activeCategory === category.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md border-transparent"
                    : "border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800"
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subcategory Navigation */}
      {activeCategoryData && (
        <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex space-x-2 overflow-x-auto pb-1">
              {activeCategoryData.subcategories.map((subcategory) => (
                <Button
                  key={subcategory.id}
                  variant={activeSubcategory === subcategory.id ? "default" : "outline"}
                  onClick={() => setActiveSubcategory(subcategory.id)}
                  className={`whitespace-nowrap px-4 py-2 text-sm transition-all duration-200 ${
                    activeSubcategory === subcategory.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                  }`}
                  size="sm"
                >
                  {subcategory.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form Dialog */}
      {showCreateForm && (
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? "Edit Material" : "Add New Material"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!editingMaterial && (
                <>
                  {/* Step 1: Material Category Selection */}
                  {!formData.material_category && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Step 1: Select Material Category</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {MATERIAL_CATEGORIES.map((cat) => (
                          <Button
                            key={cat.id}
                            type="button"
                            variant="outline"
                            onClick={() => setFormData({ ...formData, material_category: cat.id })}
                            className="h-24 flex flex-col items-center justify-center space-y-2 hover:border-blue-500"
                          >
                            <span className="text-3xl">{cat.icon}</span>
                            <span>{cat.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Hierarchy Level Selection */}
                  {formData.material_category && !formData.hierarchy_action && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg">Step 2: Select Hierarchy Level</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, material_category: "" })}
                        >
                          Back
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {getHierarchyActionsForCategory(formData.material_category).map((action) => (
                          <Button
                            key={action.id}
                            type="button"
                            variant="outline"
                            onClick={() => setFormData({ ...formData, hierarchy_action: action.id })}
                            className="w-full text-left justify-start h-auto py-4 px-6 hover:border-blue-500"
                          >
                            <div>
                              <div className="font-medium">{action.label}</div>
                              <div className="text-sm text-gray-500">Hierarchy Level: {action.level}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Parent Selection (if needed) */}
                  {formData.hierarchy_action && needsParentSelection(formData.hierarchy_action) && !formData.parent_material_id && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg">Step 3: Select Parent Material</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, hierarchy_action: "" })}
                        >
                          Back
                        </Button>
                      </div>
                      <div>
                        <Label>Parent Material *</Label>
                        <Select
                          value={formData.parent_material_id}
                          onValueChange={(value) => setFormData({ ...formData, parent_material_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent material" />
                          </SelectTrigger>
                          <SelectContent>
                            {(materials as unknown as Material[])
                              .filter((m: Material) => {
                                if (formData.hierarchy_action.includes('fabric_collection')) {
                                  return m.type === 'brand';
                                } else if (formData.hierarchy_action.includes('fabric_color')) {
                                  return m.type === 'collection';
                                } else if (formData.hierarchy_action.includes('wood_finish')) {
                                  return m.type === 'wood_type';
                                } else if (formData.hierarchy_action.includes('metal_finish')) {
                                  return m.type === 'metal_type';
                                } else if (formData.hierarchy_action.includes('metal_color')) {
                                  return m.type === 'metal_finish';
                                } else if (formData.hierarchy_action.includes('stone_finish')) {
                                  return m.type === 'stone_type';
                                }
                                return false;
                              })
                              .map((material: Material) => (
                                <SelectItem key={material.id} value={material.id}>
                                  {material.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Step 4: Material Details (shown when ready or editing) */}
              {(editingMaterial || (formData.hierarchy_action && (needsParentSelection(formData.hierarchy_action) ? formData.parent_material_id : true))) && (
                <div className="space-y-6">
                  {!editingMaterial && (
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">
                        {needsParentSelection(formData.hierarchy_action) ? 'Step 4' : 'Step 3'}: Material Details
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (needsParentSelection(formData.hierarchy_action)) {
                            setFormData({ ...formData, parent_material_id: "" });
                          } else {
                            setFormData({ ...formData, hierarchy_action: "" });
                          }
                        }}
                      >
                        Back
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900">Basic Information</h4>

                      <div>
                        <Label htmlFor="name">Material Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={formErrors.name ? 'border-red-300' : ''}
                          placeholder="Enter material name"
                        />
                        {formErrors.name && <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>}
                      </div>

                      <div>
                        <Label htmlFor="code">Material Code (auto-generated if empty)</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          placeholder="Auto-generated"
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                        >
                          <SelectTrigger className={formErrors.category_id ? 'border-red-300' : ''}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {materialCategories.map((category: any) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.category_id && <p className="text-red-600 text-sm mt-1">{formErrors.category_id}</p>}
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe this material..."
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Pricing & Settings */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900">Pricing & Settings</h4>

                      <div>
                        <Label htmlFor="cost_per_unit">Cost per Unit</Label>
                        <Input
                          id="cost_per_unit"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.cost_per_unit}
                          onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
                          className={formErrors.cost_per_unit ? 'border-red-300' : ''}
                          placeholder="0.00"
                        />
                        {formErrors.cost_per_unit && <p className="text-red-600 text-sm mt-1">{formErrors.cost_per_unit}</p>}
                      </div>

                      <div>
                        <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                        <Input
                          id="unit_of_measure"
                          value={formData.unit_of_measure}
                          onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                          placeholder="e.g., yards, pieces, sq ft"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="active"
                          checked={formData.active}
                          onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
                        />
                        <Label htmlFor="active">Active Material</Label>
                      </div>
                    </div>
                  </div>

                  {/* Step 5: Available In Collections */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">
                      {!editingMaterial && (needsParentSelection(formData.hierarchy_action) ? 'Step 5' : 'Step 4')}: Available In Furniture Collections
                    </h4>
                    <p className="text-sm text-slate-600">
                      Select which furniture collections this material can be used with
                      {formData.parent_material_id && " (inherited from parent material)"}
                    </p>
                    <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto border rounded-md p-4">
                      {getAvailableFurnitureCollections().map((collection) => {
                        const canSelect = canSelectFurnitureCollection(collection.id);
                        return (
                          <div key={collection.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`collection-${collection.id}`}
                              checked={formData.collection_ids.includes(collection.id)}
                              disabled={!canSelect}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    collection_ids: [...formData.collection_ids, collection.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    collection_ids: formData.collection_ids.filter(id => id !== collection.id)
                                  });
                                }
                              }}
                            />
                            <Label
                              htmlFor={`collection-${collection.id}`}
                              className={`text-sm ${!canSelect ? 'text-gray-400' : ''}`}
                            >
                              {collection.name}
                              {collection.prefix && (
                                <span className="text-slate-500 ml-1">({collection.prefix})</span>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-stone-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  disabled={!!actionLoading}
                >
                  Cancel
                </Button>
                {(editingMaterial || (formData.hierarchy_action && (needsParentSelection(formData.hierarchy_action) ? formData.parent_material_id : true))) && (
                  <Button
                    type="submit"
                    disabled={!!actionLoading}
                    className="min-w-[120px]"
                  >
                    {actionLoading === "create" || actionLoading === "update" ? (
                      <div className="flex items-center space-x-2">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{editingMaterial ? "Updating..." : "Creating..."}</span>
                      </div>
                    ) : (
                      editingMaterial ? "Update Material" : "Create Material"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Materials Table */}
      <Card className="bg-gradient-to-b from-gray-900 to-gray-900/95 border-gray-700 shadow-xl">
        <CardHeader className="border-b border-gray-700/50">
          <CardTitle className="text-xl font-semibold text-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
              <span>
                {activeCategoryData?.name} - {activeCategoryData?.subcategories.find(sub => sub.id === activeSubcategory)?.name}
              </span>
              <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                {getSubcategoryFilteredMaterials().length} {getSubcategoryFilteredMaterials().length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {materialsLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-6"></div>
              <div className="text-gray-400 text-lg">Loading materials...</div>
              <div className="text-gray-500 text-sm mt-2">Fetching material inventory</div>
            </div>
          ) : getSubcategoryFilteredMaterials().length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="text-gray-500 text-3xl">📦</div>
              </div>
              <div className="text-gray-400 mb-4 text-lg">No materials found for this category</div>
              <div className="text-gray-500 text-sm mb-6">Start by adding your first material to this category</div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                + Add First {activeCategoryData?.name === 'Fabrics' ? 'Fabric Brand' :
                          activeCategoryData?.name === 'Wood' ? 'Wood Type' :
                          activeCategoryData?.name === 'Metal' ? 'Metal Type' :
                          activeCategoryData?.name === 'Stone' ? 'Stone Type' :
                          activeCategoryData?.name === 'Weaving' ? 'Weaving Material' :
                          activeCategoryData?.name === 'Carving' ? 'Carving Style' : 'Material'}
              </Button>
            </div>
          ) : (
            renderMaterialsHierarchy()
          )}
        </CardContent>
      </Card>
    </div>
  );
}