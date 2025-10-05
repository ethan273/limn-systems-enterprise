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

interface FurnitureCollection {
  id: string;
  name: string;
  prefix?: string | null;
  description?: string | null;
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
  collection_ids: string[];
}

export default function MaterialsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formData, setFormData] = useState<MaterialFormData>({
    name: "",
    code: "",
    type: "",
    description: "",
    category_id: "",
    active: true,
    cost_per_unit: 0,
    unit_of_measure: "",
    collection_ids: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // API queries
  const { data: materials = [], isLoading: materialsLoading, refetch: refetchMaterials } = api.products.getAllMaterials.useQuery();
  const { data: materialCategories = [], isLoading: categoriesLoading } = api.products.getMaterialCategories.useQuery();
  const { data: furnitureCollections = [] } = api.products.getAllCollections.useQuery();

  // Mutations
  const createMaterialMutation = api.products.createMaterial.useMutation();
  const updateMaterialMutation = api.products.updateMaterial.useMutation();
  const deleteMaterialMutation = api.products.deleteMaterial.useMutation();

  // Generate unique material code
  const generateMaterialCode = (name: string): string => {
    const namePart = name.replace(/\s+/g, '-').substring(0, 10).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `MAT-${namePart}-${timestamp}`;
  };

  // Filter materials
  const filteredMaterials = materials.filter((material: Material) => {
    const matchesSearch = searchQuery === "" ||
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.type && material.type.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || material.category_id === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Validate form
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const isEditing = !!editingMaterial;
    setActionLoading(isEditing ? "update" : "create");

    try {
      const materialCode = formData.code || generateMaterialCode(formData.name);

      if (isEditing) {
        await updateMaterialMutation.mutateAsync({
          id: editingMaterial.id,
          name: formData.name,
          code: materialCode,
          type: formData.type || undefined,
          description: formData.description || undefined,
          category_id: formData.category_id,
          active: formData.active,
          cost_per_unit: formData.cost_per_unit || undefined,
          unit_of_measure: formData.unit_of_measure || undefined,
          collection_ids: formData.collection_ids.length > 0 ? formData.collection_ids : undefined,
        });
      } else {
        await createMaterialMutation.mutateAsync({
          name: formData.name,
          code: materialCode,
          type: formData.type || undefined,
          description: formData.description || undefined,
          category_id: formData.category_id,
          hierarchy_level: 1,
          active: formData.active,
          cost_per_unit: formData.cost_per_unit || undefined,
          unit_of_measure: formData.unit_of_measure || undefined,
          collection_ids: formData.collection_ids.length > 0 ? formData.collection_ids : undefined,
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

  // Handle edit
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
      collection_ids: material.collections?.map(c => c.id) || [],
    });
    setFormErrors({});
    setShowCreateForm(true);
  };

  // Handle delete
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

  // Reset form
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
      collection_ids: [],
    });
    setFormErrors({});
  };

  // Format helpers
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Materials</h1>
          <p className="page-subtitle">Manage your material inventory and specifications</p>
          <div className="flex items-center space-x-4 mt-2">
            <div className="text-sm text-tertiary">
              <span className="font-medium">{materials.length}</span> total materials
            </div>
            <div className="text-sm text-tertiary">
              <span className="font-medium">{filteredMaterials.length}</span> filtered
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => refetchMaterials()}
            disabled={materialsLoading}
            variant="outline"
            className="btn-secondary"
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
            className="btn-primary"
          >
            + New Material
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search materials by name, code, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="w-64">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="select-trigger">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(materialCategories as MaterialCategory[]).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form Dialog */}
      {showCreateForm && (
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? "Edit Material" : "Create New Material"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Basic Information</h4>

                  <div>
                    <Label htmlFor="name">Material Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={formErrors.name ? 'border-destructive' : ''}
                      placeholder="Enter material name"
                    />
                    {formErrors.name && <p className="text-destructive text-sm mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="code">Material Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Auto-generated if left empty"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Material Type</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="e.g., Fabric, Wood, Metal"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger className={formErrors.category_id ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(materialCategories as MaterialCategory[]).map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category_id && <p className="text-destructive text-sm mt-1">{formErrors.category_id}</p>}
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

                {/* Pricing & Availability */}
                <div className="space-y-4">
                  <h4 className="font-medium">Pricing & Availability</h4>

                  <div>
                    <Label htmlFor="cost_per_unit">Cost per Unit</Label>
                    <Input
                      id="cost_per_unit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_per_unit}
                      onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
                      className={formErrors.cost_per_unit ? 'border-destructive' : ''}
                    />
                    {formErrors.cost_per_unit && <p className="text-destructive text-sm mt-1">{formErrors.cost_per_unit}</p>}
                  </div>

                  <div>
                    <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                    <Input
                      id="unit_of_measure"
                      value={formData.unit_of_measure}
                      onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                      placeholder="e.g., yard, meter, piece"
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

                  <div>
                    <Label>Available In Collections</Label>
                    <p className="text-sm text-secondary mb-3">
                      Select which furniture collections can use this material
                    </p>
                    <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
                      {(furnitureCollections as FurnitureCollection[]).map((collection) => (
                        <div key={collection.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`collection-${collection.id}`}
                            checked={formData.collection_ids.includes(collection.id)}
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
                          <Label htmlFor={`collection-${collection.id}`} className="text-sm">
                            {collection.name}
                            {collection.prefix && (
                              <span className="text-tertiary ml-1">({collection.prefix})</span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
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
                <Button
                  type="submit"
                  disabled={!!actionLoading}
                  className="min-w-[120px] btn-primary"
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
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Materials Table */}
      <Card className="card">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-semibold text-primary">
            Materials Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {materialsLoading || categoriesLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-6"></div>
              <div className="text-secondary text-lg">Loading materials...</div>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 card rounded-full flex items-center justify-center">
                <div className="text-tertiary text-3xl">📦</div>
              </div>
              <div className="text-secondary mb-4 text-lg">
                {searchQuery || categoryFilter !== "all" ? "No materials found matching your filters" : "No materials found"}
              </div>
              <div className="text-tertiary text-sm mb-6">
                {searchQuery || categoryFilter !== "all" ? "Try adjusting your search or filters" : "Start by adding your first material"}
              </div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                + Add First Material
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost per Unit</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Available In</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material: Material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="font-medium text-primary">{material.name}</div>
                      {material.description && (
                        <div className="text-sm text-secondary mt-1">{material.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-secondary font-mono">{material.code || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-secondary">{material.type || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-secondary">
                        {material.category?.name || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-primary">
                        {material.cost_per_unit ? formatCurrency(material.cost_per_unit) : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-secondary">{material.unit_of_measure || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {material.collections && material.collections.length > 0 ? (
                          material.collections.map((collection) => (
                            <Badge key={collection.id} variant="secondary" className="badge-secondary">
                              {collection.prefix || collection.name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="badge-outline">
                            All Collections
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={material.active !== false ? "default" : "secondary"}
                        className={material.active !== false ? "badge-success" : "badge-inactive"}
                      >
                        {material.active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-tertiary">
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
                          className="btn-secondary-sm"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(material)}
                          disabled={!!actionLoading}
                          className="btn-danger-sm"
                        >
                          {actionLoading === `delete-${material.id}` ? (
                            <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-destructive"></div>
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
