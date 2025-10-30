"use client";
import { log } from '@/lib/logger';

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { generateProductSku } from "@/lib/utils/product-sku-generator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface OrderCreationFormData {
  project_id: string;
  collection_id: string;
  furniture_collection_id: string;
  variation_type: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  fabric_brand_id: string;
  fabric_collection_id: string;
  fabric_color_id: string;
  wood_type_id: string;
  wood_finish_id: string;
  metal_type_id: string;
  metal_finish_id: string;
  metal_color_id: string;
  stone_type_id: string;
  stone_finish_id: string;
  weaving_material_id: string;
  weaving_pattern_id: string;
  weaving_color_id: string;
  carving_style_id: string;
  carving_pattern_id: string;
  custom_specifications: string;
  estimated_delivery: string;
  notes: string;
}

export interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string;
  project_sku: string;
  base_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  material_selections: any; // Hierarchical structure for full-sku-generator
  custom_specifications?: string;
  collection_id?: string; // Collection for analytics and filtering
}

interface OrderCreationDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  _onSave: (_data: OrderCreationFormData) => void;
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  onFinalizeOrder: (_projectId: string) => Promise<void>;
  isFinalizingOrder?: boolean; // Prevent duplicate order submissions
}

export function OrderCreationDialog({
  projectId,
  isOpen,
  onClose,
  _onSave,
  orderItems,
  setOrderItems,
  onFinalizeOrder,
  isFinalizingOrder = false,
}: OrderCreationDialogProps) {
  const [formData, setFormData] = useState<OrderCreationFormData>({
    project_id: projectId,
    collection_id: "",
    furniture_collection_id: "",
    variation_type: "",
    product_name: "",
    quantity: "1",
    unit_price: "",
    fabric_brand_id: "",
    fabric_collection_id: "",
    fabric_color_id: "",
    wood_type_id: "",
    wood_finish_id: "",
    metal_type_id: "",
    metal_finish_id: "",
    metal_color_id: "",
    stone_type_id: "",
    stone_finish_id: "",
    weaving_material_id: "",
    weaving_pattern_id: "",
    weaving_color_id: "",
    carving_style_id: "",
    carving_pattern_id: "",
    custom_specifications: "",
    estimated_delivery: "",
    notes: "",
  });

  const [selectedItem, setSelectedItem] = useState<string>("");

  const { data: collections } = api.products.getAllCollections.useQuery();

  // Get selected collection to access its variation types
  const selectedCollection = collections?.find((c: any) => c.id === formData.collection_id);
  const availableVariationTypes = (selectedCollection as any)?.variation_types || [];

  // Get items by collection (cascading dropdown)
  const { data: allCollectionItems } = api.items.getByCollection.useQuery(
    { collectionId: formData.collection_id },
    { enabled: !!formData.collection_id }
  );

  // Get variation types for the selected item
  const getSelectedItemVariationTypes = () => {
    if (!selectedItem || !allCollectionItems) return [];
    return availableVariationTypes;
  };

  // Get furniture collections for filtering
  const { data: _furnitureCollections } = api.products.getAllCollections.useQuery();

  // TEMPORARY FIX: getMaterialsByCollection doesn't actually filter by collection
  // Use getAllMaterials for now until collection filtering is properly implemented
  const { data: availableMaterials } = api.products.getAllMaterials.useQuery();

  // Debug: Log materials data to understand structure
  if (availableMaterials && availableMaterials.length > 0) {
    log.info('[OrderCreationDialog] Total materials available:', availableMaterials.length);
    log.info('[OrderCreationDialog] Sample material:', availableMaterials[0]);
  }

  // Filter by material category using parent-child relationships
  // Database uses parent_material_id for hierarchy (Brand → Collection → Color)
  const fabricBrands = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('fabric') || materialType.includes('fabric');
    const isTopLevel = !m.parent_material_id; // Top level = no parent
    return matchesType && isTopLevel;
  }) || [];

  const fabricCollections = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('fabric') || materialType.includes('fabric');
    const matchesParent = !formData.fabric_brand_id || m.parent_material_id === formData.fabric_brand_id;
    return matchesType && matchesParent && m.parent_material_id; // Must have a parent
  }) || [];

  const fabricColors = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('fabric') || materialType.includes('fabric');
    const matchesParent = !formData.fabric_collection_id || m.parent_material_id === formData.fabric_collection_id;
    // Colors are children of collections - need to find materials whose parent is the selected collection
    return matchesType && matchesParent && m.parent_material_id;
  }) || [];

  const woodTypes = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('wood') || materialType.includes('wood');
    const isTopLevel = !m.parent_material_id;
    return matchesType && isTopLevel;
  }) || [];

  const woodFinishes = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('wood') || materialType.includes('wood');
    const matchesParent = !formData.wood_type_id || m.parent_material_id === formData.wood_type_id;
    return matchesType && matchesParent && m.parent_material_id;
  }) || [];

  const metalTypes = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('metal') || materialType.includes('metal');
    const isTopLevel = !m.parent_material_id;
    return matchesType && isTopLevel;
  }) || [];

  const metalFinishes = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('metal') || materialType.includes('metal');
    const matchesParent = !formData.metal_type_id || m.parent_material_id === formData.metal_type_id;
    return matchesType && matchesParent && m.parent_material_id;
  }) || [];

  const metalColors = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('metal') || materialType.includes('metal');
    const matchesParent = !formData.metal_finish_id || m.parent_material_id === formData.metal_finish_id;
    return matchesType && matchesParent && m.parent_material_id;
  }) || [];

  const stoneTypes = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('stone') || materialType.includes('stone');
    const isTopLevel = !m.parent_material_id;
    return matchesType && isTopLevel;
  }) || [];

  const stoneFinishes = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('stone') || materialType.includes('stone');
    const matchesParent = !formData.stone_type_id || m.parent_material_id === formData.stone_type_id;
    return matchesType && matchesParent && m.parent_material_id;
  }) || [];

  const weavingMaterials = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('weaving') || materialType.includes('weaving');
    const isTopLevel = !m.parent_material_id;
    return matchesType && isTopLevel;
  }) || [];

  const weavingPatterns = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('weaving') || materialType.includes('weaving');
    const matchesParent = !formData.weaving_material_id || m.parent_material_id === formData.weaving_material_id;
    return matchesType && matchesParent && m.parent_material_id;
  }) || [];

  const weavingColors = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('weaving') || materialType.includes('weaving');
    const matchesParent = !formData.weaving_pattern_id || m.parent_material_id === formData.weaving_pattern_id;
    return matchesType && matchesParent && m.parent_material_id;
  }) || [];

  const carvingStyles = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('carving') || materialType.includes('carving');
    const isTopLevel = !m.parent_material_id;
    return matchesType && isTopLevel;
  }) || [];

  const carvingPatterns = availableMaterials?.filter((m: any) => {
    const categoryName = m.material_categories?.name?.toLowerCase() || '';
    const materialType = m.type?.toLowerCase() || '';
    const matchesType = categoryName.includes('carving') || materialType.includes('carving');
    const matchesParent = !formData.carving_style_id || m.parent_material_id === formData.carving_style_id;
    return matchesType && matchesParent && m.parent_material_id;
  }) || [];

  // Check if basic order info is complete
  const isBasicOrderComplete = formData.collection_id && selectedItem;

  const handleSave = async () => {
    // Validation with user-friendly error messages
    if (!formData.product_name.trim()) {
      toast({
        title: "Missing Required Field",
        description: "Please enter a product name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.collection_id) {
      toast({
        title: "Missing Required Field",
        description: "Please select a collection from the dropdown.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Unit price must be greater than $0.00.",
        variant: "destructive",
      });
      return;
    }

    // Get collection info for SKU generation
    const collectionPrefix = 'XX'; // Placeholder - should get from collection selection

    // Get material names from IDs for SKU generation
    const getMaterialName = (materialId: string) => {
      if (!materialId) return '';
      const material = availableMaterials?.find((m: any) => m.id === materialId);
      return (material as any)?.name || '';
    };

    // Get material SKU if available
    const getMaterialSku = (materialId: string) => {
      if (!materialId) return undefined;
      const material = availableMaterials?.find((m: any) => m.id === materialId);
      return (material as any)?.sku || undefined;
    };

    // Prepare material selections in HIERARCHICAL structure for full-sku-generator
    // This matches the MaterialSelection interface expected by generateFullSku()
    const materialSelections: any = {};

    // Fabric materials
    const fabricBrand = getMaterialName(formData.fabric_brand_id);
    const fabricCollection = getMaterialName(formData.fabric_collection_id);
    const fabricColor = getMaterialName(formData.fabric_color_id);
    if (fabricBrand || fabricCollection || fabricColor) {
      materialSelections.fabric = {
        brand: fabricBrand,
        collection: fabricCollection,
        color: fabricColor,
        sku: getMaterialSku(formData.fabric_color_id) || getMaterialSku(formData.fabric_collection_id),
      };
    }

    // Wood materials
    const woodType = getMaterialName(formData.wood_type_id);
    const woodFinish = getMaterialName(formData.wood_finish_id);
    if (woodType || woodFinish) {
      materialSelections.wood = {
        type: woodType,
        species: woodType, // Alias for compatibility
        finish: woodFinish,
        sku: getMaterialSku(formData.wood_finish_id) || getMaterialSku(formData.wood_type_id),
      };
    }

    // Metal materials
    const metalType = getMaterialName(formData.metal_type_id);
    const metalFinish = getMaterialName(formData.metal_finish_id);
    const metalColor = getMaterialName(formData.metal_color_id);
    if (metalType || metalFinish || metalColor) {
      materialSelections.metal = {
        type: metalType,
        material: metalType, // Alias for compatibility
        finish: metalFinish,
        color: metalColor,
        sku: getMaterialSku(formData.metal_color_id) || getMaterialSku(formData.metal_finish_id),
      };
    }

    // Stone materials
    const stoneType = getMaterialName(formData.stone_type_id);
    const stoneFinish = getMaterialName(formData.stone_finish_id);
    if (stoneType || stoneFinish) {
      materialSelections.stone = {
        type: stoneType,
        material: stoneType, // Alias for compatibility
        finish: stoneFinish,
        sku: getMaterialSku(formData.stone_finish_id) || getMaterialSku(formData.stone_type_id),
      };
    }

    // Weaving materials
    const weavingMaterial = getMaterialName(formData.weaving_material_id);
    const weavingPattern = getMaterialName(formData.weaving_pattern_id);
    const weavingColor = getMaterialName(formData.weaving_color_id);
    if (weavingMaterial || weavingPattern || weavingColor) {
      materialSelections.weaving = {
        material: weavingMaterial,
        pattern: weavingPattern,
        color: weavingColor,
        sku: getMaterialSku(formData.weaving_color_id) || getMaterialSku(formData.weaving_pattern_id),
      };
    }

    // Carving
    const carvingStyle = getMaterialName(formData.carving_style_id);
    const carvingPattern = getMaterialName(formData.carving_pattern_id);
    if (carvingStyle || carvingPattern) {
      materialSelections.carving = {
        style: carvingStyle,
        pattern: carvingPattern,
        sku: getMaterialSku(formData.carving_pattern_id) || getMaterialSku(formData.carving_style_id),
      };
    }

    // Generate base SKU (using catalog system: PREFIX-ITEM-VERSION)
    const itemCode = formData.product_name.substring(0, 3).toUpperCase();
    const version = String(orderItems.length + 1).padStart(3, '0');
    const baseSKU = `${collectionPrefix}-${itemCode}-${version}`;

    // Generate hierarchical product SKU using utility function
    const productSKU = generateProductSku(baseSKU, materialSelections);

    // Generate project tracking SKU (temporary - will be generated on server when order is saved)
    const projectSKU = `TEMP-${Date.now()}`;

    // Create new order item with dual SKUs
    const newOrderItem: OrderItem = {
      id: `temp_${Date.now()}`, // Temporary ID until saved to database
      product_name: formData.product_name,
      product_sku: productSKU, // Hierarchical SKU for manufacturing
      project_sku: projectSKU, // Client/project tracking SKU
      base_sku: baseSKU, // Original catalog SKU
      quantity: parseInt(formData.quantity),
      unit_price: parseFloat(formData.unit_price),
      total_price: parseInt(formData.quantity) * parseFloat(formData.unit_price),
      material_selections: materialSelections,
      custom_specifications: formData.custom_specifications,
      collection_id: formData.collection_id, // Store collection for order-level analytics
    };

    // Add to order items list
    setOrderItems(prev => [...prev, newOrderItem]);

    toast({
      title: "Success",
      description: `Order item "${formData.product_name}" added successfully! Product SKU: ${productSKU}`,
      variant: "default",
    });

    // Reset form for next item
    setFormData({
      project_id: projectId,
      collection_id: "",
      furniture_collection_id: "",
      variation_type: "",
      product_name: "",
      quantity: "1",
      unit_price: "",
      fabric_brand_id: "",
      fabric_collection_id: "",
      fabric_color_id: "",
      wood_type_id: "",
      wood_finish_id: "",
      metal_type_id: "",
      metal_finish_id: "",
      metal_color_id: "",
      stone_type_id: "",
      stone_finish_id: "",
      weaving_material_id: "",
      weaving_pattern_id: "",
      weaving_color_id: "",
      carving_style_id: "",
      carving_pattern_id: "",
      custom_specifications: "",
      estimated_delivery: "",
      notes: "",
    });
    setSelectedItem("");
  };

  const calculateTotal = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const price = parseFloat(formData.unit_price) || 0;
    return quantity * price;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Order for Project</DialogTitle>
          <DialogDescription>
            Add a new ordered item to this project with collection-specific material filtering.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
          {/* Order Form - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Order Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Order Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collection_id">Collection *</Label>
                  <Select
                    value={formData.collection_id}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        collection_id: value,
                        variation_type: "",
                        product_name: "",
                        fabric_brand_id: "",
                        fabric_collection_id: "",
                        fabric_color_id: "",
                        wood_type_id: "",
                        wood_finish_id: "",
                        metal_type_id: "",
                        metal_finish_id: "",
                        metal_color_id: "",
                        stone_type_id: "",
                        stone_finish_id: "",
                        weaving_material_id: "",
                        weaving_pattern_id: "",
                        weaving_color_id: "",
                        carving_style_id: "",
                        carving_pattern_id: "",
                      });
                      setSelectedItem("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections?.map((collection: any) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_name">Item Name *</Label>
                  <Select
                    value={selectedItem}
                    onValueChange={(value) => {
                      setSelectedItem(value);
                      const item = allCollectionItems?.filter(item => item.type === "Production Ready" || item.type === null || item.type === undefined).find(item => item.id === value);
                      setFormData({
                        ...formData,
                        product_name: item?.name || "",
                        variation_type: "",
                        unit_price: item?.list_price?.toString() || item?.price?.toString() || formData.unit_price
                      });
                    }}
                    disabled={!formData.collection_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.collection_id
                          ? "Select collection first"
                          : "Select item..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {allCollectionItems?.filter(item => item.type === "Production Ready" || item.type === null || item.type === undefined).map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variation_type">Variation Type</Label>
                  <Select
                    value={formData.variation_type}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        variation_type: value,
                      });
                    }}
                    disabled={!selectedItem || !getSelectedItemVariationTypes().length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedItem
                          ? "Select item first"
                          : getSelectedItemVariationTypes().length === 0
                          ? "No variations available"
                          : "Select variation..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {getSelectedItemVariationTypes().map((variationType: string) => (
                        <SelectItem key={variationType} value={variationType}>
                          {variationType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price ($) *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Price</Label>
                  <div className="px-3 py-2 bg-muted rounded-md text-lg font-semibold">
                    ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Collection-Filtered Material Selections */}
            {isBasicOrderComplete && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Material Specifications</h3>

                {/* Fabric Materials */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium">Fabric Materials</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fabric_brand_id">Fabric Brand</Label>
                      <Select
                        value={formData.fabric_brand_id || "none"}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          fabric_brand_id: value === "none" ? "" : value,
                          fabric_collection_id: "",
                          fabric_color_id: ""
                        })}
                        disabled={!isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {fabricBrands.map((brand: any) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                              {brand.collections && brand.collections.length > 0 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({brand.collections.map((c: any) => c.prefix || c.name).join(', ')})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fabric_collection_id">Fabric Collection</Label>
                      <Select
                        value={formData.fabric_collection_id || "none"}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          fabric_collection_id: value === "none" ? "" : value,
                          fabric_color_id: ""
                        })}
                        disabled={!formData.fabric_brand_id || !isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.fabric_brand_id ? "Select collection" : "Select brand first"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {fabricCollections.map((collection: any) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.fabric_brand_id && fabricCollections.length === 0 && (
                        <p className="text-xs text-muted-foreground">No collections available for this brand</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fabric_color_id">Fabric Color</Label>
                      <Select
                        value={formData.fabric_color_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, fabric_color_id: value === "none" ? "" : value })}
                        disabled={!formData.fabric_collection_id || !isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.fabric_collection_id ? "Select color" : "Select collection first"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {fabricColors.map((color: any) => (
                            <SelectItem key={color.id} value={color.id}>
                              {color.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.fabric_collection_id && fabricColors.length === 0 && (
                        <p className="text-xs text-muted-foreground">No colors available for this collection</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wood Materials */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium">Wood Materials</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wood_type_id">Wood Type</Label>
                      <Select
                        value={formData.wood_type_id || "none"}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          wood_type_id: value === "none" ? "" : value,
                          wood_finish_id: ""
                        })}
                        disabled={!isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select wood type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {woodTypes.map((wood: any) => (
                            <SelectItem key={wood.id} value={wood.id}>
                              {wood.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wood_finish_id">Wood Finish</Label>
                      <Select
                        value={formData.wood_finish_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, wood_finish_id: value === "none" ? "" : value })}
                        disabled={!formData.wood_type_id || !isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.wood_type_id ? "Select wood finish" : "Select wood type first"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {woodFinishes.map((finish: any) => (
                            <SelectItem key={finish.id} value={finish.id}>
                              {finish.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.wood_type_id && woodFinishes.length === 0 && (
                        <p className="text-xs text-muted-foreground">No finishes available for this wood type</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metal Materials */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium">Metal Materials</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metal_type_id">Metal Type</Label>
                      <Select
                        value={formData.metal_type_id || "none"}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          metal_type_id: value === "none" ? "" : value,
                          metal_finish_id: "",
                          metal_color_id: ""
                        })}
                        disabled={!isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select metal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {metalTypes.map((metal: any) => (
                            <SelectItem key={metal.id} value={metal.id}>
                              {metal.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metal_finish_id">Metal Finish</Label>
                      <Select
                        value={formData.metal_finish_id || "none"}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          metal_finish_id: value === "none" ? "" : value,
                          metal_color_id: ""
                        })}
                        disabled={!formData.metal_type_id || !isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.metal_type_id ? "Select metal finish" : "Select metal type first"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {metalFinishes.map((finish: any) => (
                            <SelectItem key={finish.id} value={finish.id}>
                              {finish.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.metal_type_id && metalFinishes.length === 0 && (
                        <p className="text-xs text-muted-foreground">No finishes available for this metal type</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metal_color_id">Metal Color</Label>
                      <Select
                        value={formData.metal_color_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, metal_color_id: value === "none" ? "" : value })}
                        disabled={!formData.metal_finish_id || !isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.metal_finish_id ? "Select metal color" : "Select finish first"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {metalColors.map((color: any) => (
                            <SelectItem key={color.id} value={color.id}>
                              {color.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.metal_finish_id && metalColors.length === 0 && (
                        <p className="text-xs text-muted-foreground">No colors available for this finish</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stone Materials */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium">Stone Materials</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stone_type_id">Stone Type</Label>
                      <Select
                        value={formData.stone_type_id || "none"}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          stone_type_id: value === "none" ? "" : value,
                          stone_finish_id: ""
                        })}
                        disabled={!isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stone type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {stoneTypes.map((stone: any) => (
                            <SelectItem key={stone.id} value={stone.id}>
                              {stone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stone_finish_id">Stone Finish</Label>
                      <Select
                        value={formData.stone_finish_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, stone_finish_id: value === "none" ? "" : value })}
                        disabled={!formData.stone_type_id || !isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.stone_type_id ? "Select stone finish" : "Select stone type first"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {stoneFinishes.map((finish: any) => (
                            <SelectItem key={finish.id} value={finish.id}>
                              {finish.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.stone_type_id && stoneFinishes.length === 0 && (
                        <p className="text-xs text-muted-foreground">No finishes available for this stone type</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Weaving Materials */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium">Weaving Materials</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weaving_material_id">Weaving Material</Label>
                      <Select
                        value={formData.weaving_material_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, weaving_material_id: value === "none" ? "" : value })}
                        disabled={!isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {weavingMaterials.map((material: any) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weaving_pattern_id">Weaving Pattern</Label>
                      <Select
                        value={formData.weaving_pattern_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, weaving_pattern_id: value === "none" ? "" : value })}
                        disabled={!isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {weavingPatterns.map((pattern: any) => (
                            <SelectItem key={pattern.id} value={pattern.id}>
                              {pattern.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weaving_color_id">Weaving Color</Label>
                      <Select
                        value={formData.weaving_color_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, weaving_color_id: value === "none" ? "" : value })}
                        disabled={!isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {weavingColors.map((color: any) => (
                            <SelectItem key={color.id} value={color.id}>
                              {color.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Carving */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium">Carving</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="carving_style_id">Carving Style</Label>
                      <Select
                        value={formData.carving_style_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, carving_style_id: value === "none" ? "" : value })}
                        disabled={!isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select carving style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {carvingStyles.map((style: any) => (
                            <SelectItem key={style.id} value={style.id}>
                              {style.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carving_pattern_id">Carving Pattern</Label>
                      <Select
                        value={formData.carving_pattern_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, carving_pattern_id: value === "none" ? "" : value })}
                        disabled={!isBasicOrderComplete}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select carving pattern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No selection</SelectItem>
                          {carvingPatterns.map((pattern: any) => (
                            <SelectItem key={pattern.id} value={pattern.id}>
                              {pattern.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Additional Information</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom_specifications">Custom Specifications</Label>
                      <Textarea
                        id="custom_specifications"
                        value={formData.custom_specifications}
                        onChange={(e) => setFormData({ ...formData, custom_specifications: e.target.value })}
                        placeholder="Any custom specifications or special requirements"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="estimated_delivery">Estimated Delivery</Label>
                        <Input
                          id="estimated_delivery"
                          type="date"
                          value={formData.estimated_delivery}
                          onChange={(e) => setFormData({ ...formData, estimated_delivery: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Additional notes"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Items List - 1/3 width */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Order Items ({orderItems.length})</h3>
              <p className="text-sm text-muted-foreground">
                Items will be added to this order
              </p>
            </div>

            {orderItems.length === 0 ? (
              <div className="border-2 border-dashed border rounded-lg p-6 text-center">
                <Package className="h-8 w-8 mx-auto text-secondary mb-2" />
                <p className="text-sm text-tertiary">No items added yet</p>
                <p className="text-xs page-subtitle">Fill out the form and click &ldquo;Add Item&rdquo;</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orderItems.map((item, index) => (
                  <Card key={item.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product_name}</h4>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Product:</span> <span className="font-mono">{item.product_sku}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Project:</span> <span className="font-mono">{item.project_sku}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setOrderItems(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Qty:</span> {item.quantity}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price:</span> ${item.unit_price.toFixed(2)}
                        </div>
                      </div>

                      <div className="text-xs">
                        <span className="text-muted-foreground">Total:</span>{" "}
                        <span className="font-medium">${item.total_price.toFixed(2)}</span>
                      </div>

                      {/* Show material selections */}
                      {item.material_selections && Object.keys(item.material_selections).length > 0 && (
                        <div className="text-xs space-y-1 border-t pt-2">
                          <p className="text-muted-foreground font-medium">Materials:</p>
                          {Object.entries(item.material_selections).map(([materialType, specs]: [string, any]) => {
                            if (!specs || typeof specs !== 'object') return null;
                            return Object.entries(specs)
                              .filter(([key, value]) => value && key !== 'sku')
                              .map(([key, value]) => (
                                <div key={`${materialType}-${key}`} className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    {materialType.charAt(0).toUpperCase() + materialType.slice(1)} {key}:
                                  </span>
                                  <span className="truncate ml-1">{String(value)}</span>
                                </div>
                              ));
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {/* Order Summary */}
                <Card className="p-3 bg-primary/5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Total Items:</span>
                      <span>{orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total Value:</span>
                      <span>${orderItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.product_name || !formData.collection_id || !formData.quantity || !formData.unit_price}
          >
            Add Item to Order
          </Button>
          {orderItems.length > 0 && (
            <Button
              onClick={() => onFinalizeOrder(projectId)}
              disabled={isFinalizingOrder}
              className="bg-success-muted hover:bg-success text-success-foreground hover:text-white font-semibold"
            >
              {isFinalizingOrder ? (
                <>Processing...</>
              ) : (
                <>Finalize Order (${orderItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)})</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
