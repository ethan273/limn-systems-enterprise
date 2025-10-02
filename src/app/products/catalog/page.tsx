"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Package,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Filter,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FurnitureDimensionsForm } from "@/components/furniture/FurnitureDimensionsForm";
import { ImageManager } from "@/components/furniture/ImageManager";
import { DimensionDisplay } from "@/components/furniture/DimensionDisplay";
import type { FurnitureType } from "@/lib/utils/dimension-validation";
import type { ImageType, ItemImage } from "@/components/furniture/ImageManager";
import { uploadProductImage } from "@/lib/storage";

// Image Manager Wrapper Component for Catalog
function CatalogImageManager({ itemId }: { itemId: string }) {
  const { data: itemImages, refetch: refetchImages } = api.items.getItemImages.useQuery({ itemId });
  const addImageMutation = api.items.addItemImage.useMutation();
  const updateImageMutation = api.items.updateItemImage.useMutation();
  const deleteImageMutation = api.items.deleteItemImage.useMutation();

  // Group images by type
  const groupedImages: Record<ImageType, ItemImage[]> = {
    line_drawing: [],
    isometric: [],
    '3d_model': [],
    rendering: [],
    photograph: [],
  };

  if (itemImages) {
    itemImages.forEach((img: any) => {
      const imageType = img.image_type as ImageType;
      // eslint-disable-next-line security/detect-object-injection
      if (groupedImages[imageType]) {
        // eslint-disable-next-line security/detect-object-injection
        groupedImages[imageType].push(img as ItemImage);
      }
    });
  }

  const handleUpload = async (imageType: ImageType, file: File, metadata: Partial<ItemImage>) => {
    try {
      const result = await uploadProductImage(itemId, file);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Upload failed');
      }

      await addImageMutation.mutateAsync({
        item_id: itemId,
        image_type: imageType,
        file_url: result.data.publicUrl,
        file_name: metadata.file_name || file.name,
        file_size: metadata.file_size || file.size,
        mime_type: metadata.mime_type || file.type,
        alt_text: metadata.alt_text,
        description: metadata.description,
        sort_order: metadata.sort_order || 0,
        is_primary: metadata.is_primary || false,
      });

      await refetchImages();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleUpdate = async (imageId: string, metadata: Partial<ItemImage>) => {
    try {
      await updateImageMutation.mutateAsync({ id: imageId, data: metadata });
      await refetchImages();
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      await deleteImageMutation.mutateAsync({ id: imageId });
      await refetchImages();
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  };

  return (
    <ImageManager
      images={groupedImages}
      onUpload={handleUpload}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      disabled={false}
    />
  );
}

interface Collection {
  id: string;
  name: string;
  description?: string;
}

interface Item {
  id: string;
  name: string;
  base_sku: string;  // Base product SKU from catalog
  sku?: string;      // Full SKU with materials (optional)
  client_sku?: string; // Client-specific tracking ID
  project_sku?: string; // Project-level grouping
  collection_id: string;
  collections?: Collection;
  description?: string;
  dimensions?: string;
  list_price: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  type?: 'Concept' | 'Prototype' | 'Production Ready';
  furniture_type?: 'chair' | 'bench' | 'table' | 'sofa/loveseat' | 'sectional' | 'lounge' | 'chaise_lounge' | 'ottoman';

  // Inventory Management
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  last_restocked?: string;
  supplier: string;
  supplier_sku?: string;
  unit_cost: number;

  // Dimensions
  width?: number;
  depth?: number;
  height?: number;
  dimension_units: 'inches' | 'cm';

  // Seating dimensions
  seat_height?: number;
  seat_depth?: number;
  seat_width?: number;
  arm_height?: number;
  back_height?: number;

  // Detail dimensions
  clearance_height?: number;
  cushion_thickness?: number;
  table_top_thickness?: number;
  shelf_heights?: number[];

  // Shipping dimensions
  boxed_width?: number;
  boxed_depth?: number;
  boxed_height?: number;
  weight_lbs?: number;
  num_boxes: number;
  assembly_required: boolean;

  // Storage dimensions
  interior_width?: number;
  interior_depth?: number;
  interior_height?: number;
  drawer_dimensions?: unknown; // JSON object

  // Materials and options (matching Order Form structure)
  fabric_brand?: string;
  fabric_collection?: string;
  fabric_color?: string;
  wood_type?: string;
  wood_finish?: string;
  metal_type?: string;
  metal_finish?: string;
  metal_color?: string;
  stone_type?: string;
  stone_finish?: string;
  weaving_material?: string;
  weaving_pattern?: string;
  weaving_color?: string;
  carving_style?: string;
  carving_pattern?: string;

  // Images
  primary_image_url?: string;
  gallery_images?: string[];
  technical_drawings?: string[];

  // Variations
  size_variants?: string[];
  configuration_options?: string[];
}

interface ItemFormData {
  // Basic Information
  name: string;
  base_sku: string;
  variation_type: string; // e.g., "Deep", "Short", "Wide"
  collection_id: string;
  description: string;
  type: 'Concept' | 'Prototype' | 'Production Ready';
  furniture_type: 'chair' | 'bench' | 'table' | 'sofa/loveseat' | 'sectional' | 'lounge' | 'chaise_lounge' | 'ottoman' | '';
  is_active: boolean;

  // Pricing
  list_price: number;
  unit_cost: number;

  // Inventory Management
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  supplier: string;
  supplier_sku: string;

  // Dimensions
  width: number;
  depth: number;
  height: number;
  dimension_units: 'inches' | 'cm';

  // Seating dimensions
  seat_height: number;
  seat_depth: number;
  seat_width: number;
  arm_height: number;
  back_height: number;

  // Table-specific dimensions
  length: number;
  apron_height: number;
  leg_clearance: number;
  overhang: number;
  leaf_width: number;
  leaf_length: number;

  // Chair-specific dimensions
  width_across_arms: number;

  // Bench-specific dimensions
  weight_capacity: number;
  leg_height: number;

  // Sectional-specific dimensions
  chaise_length: number;
  corner_depth: number;
  corner_width: number;

  // Chaise lounge-specific dimensions
  backrest_angle: number;
  leg_section_length: number;
  chaise_orientation: 'left' | 'right' | '';
  adjustable_positions: number;

  // Lounge chair-specific dimensions
  reclined_depth: number;
  footrest_length: number;
  swivel_range: number;
  zero_wall_clearance: number;

  // Ottoman-specific dimensions
  ottoman_height: number;
  ottoman_length: number;
  ottoman_width: number;

  // Universal/Additional Measurements
  clearance_required: number;
  doorway_clearance: number;
  weight_lbs: number;
  weight_kg: number;
  diagonal_depth: number;
  stacking_height: number;
  folded_width: number;
  folded_depth: number;
  folded_height: number;
  material_thickness: number;
  cushion_thickness_compressed: number;
  cushion_thickness_uncompressed: number;

  // Detail dimensions
  clearance_height: number;
  cushion_thickness: number;
  table_top_thickness: number;
  shelf_heights: string; // JSON string

  // Shipping dimensions
  boxed_width: number;
  boxed_depth: number;
  boxed_height: number;
  num_boxes: number;
  assembly_required: boolean;

  // Storage dimensions
  interior_width: number;
  interior_depth: number;
  interior_height: number;
  drawer_dimensions: string; // JSON string

  // Materials and options (matching Order Form structure)
  fabric_brand: string;
  fabric_collection: string;
  fabric_color: string;
  wood_type_id?: string; // Parent material ID for hierarchical filtering
  wood_type: string;
  wood_finish: string;
  metal_type_id?: string; // Parent material ID for hierarchical filtering
  metal_type: string;
  metal_finish: string;
  metal_color: string;
  stone_type_id?: string; // Parent material ID for hierarchical filtering
  stone_type: string;
  stone_finish: string;
  weaving_material: string;
  weaving_pattern: string;
  weaving_color: string;
  carving_style: string;
  carving_pattern: string;

  // Images
  primary_image_url: string;
  gallery_images: string; // Comma-separated string
  technical_drawings: string; // Comma-separated string

  // Variations
  size_variants: string; // Comma-separated string
  configuration_options: string; // Comma-separated string
}

function ItemDialog({
  item,
  isOpen,
  onClose,
  onSave,
}: {
  item?: Item;
  isOpen: boolean;
  onClose: () => void;
  onSave: (_data: ItemFormData) => void;
}) {
  const { data: collections } = api.products.getAllCollections.useQuery();
  const { data: allMaterials } = api.products.getAllMaterials.useQuery();
  const [_showAdvancedDimensions, _setShowAdvancedDimensions] = useState(false);

  const [formData, setFormData] = useState<ItemFormData>({
    // Basic Information
    name: item?.name || "",
    base_sku: item?.base_sku || "",
    variation_type: (item as any)?.variation_type || "",
    collection_id: item?.collection_id || "",
    description: item?.description || "",
    type: item?.type || 'Concept',
    furniture_type: item?.furniture_type || '',
    is_active: item?.is_active ?? true,

    // Pricing
    list_price: item?.list_price || 0,
    unit_cost: item?.unit_cost || 0,

    // Inventory Management
    stock_quantity: item?.stock_quantity || 0,
    min_stock_level: item?.min_stock_level || 0,
    max_stock_level: item?.max_stock_level || 100,
    reorder_point: item?.reorder_point || 10,
    supplier: item?.supplier || "",
    supplier_sku: item?.supplier_sku || "",

    // Dimensions
    width: item?.width || 0,
    depth: item?.depth || 0,
    height: item?.height || 0,
    dimension_units: item?.dimension_units || 'inches',

    // Seating dimensions
    seat_height: item?.seat_height || 0,
    seat_depth: item?.seat_depth || 0,
    seat_width: item?.seat_width || 0,
    arm_height: item?.arm_height || 0,
    back_height: item?.back_height || 0,

    // Table-specific dimensions
    length: 0,
    apron_height: 0,
    leg_clearance: 0,
    overhang: 0,
    leaf_width: 0,
    leaf_length: 0,

    // Chair-specific dimensions
    width_across_arms: 0,

    // Bench-specific dimensions
    weight_capacity: 0,
    leg_height: 0,

    // Sectional-specific dimensions
    chaise_length: 0,
    corner_depth: 0,
    corner_width: 0,

    // Chaise lounge-specific dimensions
    backrest_angle: 0,
    leg_section_length: 0,
    chaise_orientation: '',
    adjustable_positions: 0,

    // Lounge chair-specific dimensions
    reclined_depth: 0,
    footrest_length: 0,
    swivel_range: 0,
    zero_wall_clearance: 0,

    // Ottoman-specific dimensions
    ottoman_height: 0,
    ottoman_length: 0,
    ottoman_width: 0,

    // Universal/Additional Measurements
    clearance_required: 0,
    doorway_clearance: 0,
    weight_lbs: item?.weight_lbs || 0,
    weight_kg: 0,
    diagonal_depth: 0,
    stacking_height: 0,
    folded_width: 0,
    folded_depth: 0,
    folded_height: 0,
    material_thickness: 0,
    cushion_thickness_compressed: 0,
    cushion_thickness_uncompressed: 0,

    // Detail dimensions
    clearance_height: item?.clearance_height || 0,
    cushion_thickness: item?.cushion_thickness || 0,
    table_top_thickness: item?.table_top_thickness || 0,
    shelf_heights: JSON.stringify(item?.shelf_heights || []),

    // Shipping dimensions
    boxed_width: item?.boxed_width || 0,
    boxed_depth: item?.boxed_depth || 0,
    boxed_height: item?.boxed_height || 0,
    num_boxes: item?.num_boxes || 1,
    assembly_required: item?.assembly_required ?? false,

    // Storage dimensions
    interior_width: item?.interior_width || 0,
    interior_depth: item?.interior_depth || 0,
    interior_height: item?.interior_height || 0,
    drawer_dimensions: JSON.stringify(item?.drawer_dimensions || ""),

    // Materials and options (matching Order Form structure)
    fabric_brand: item?.fabric_brand || "",
    fabric_collection: item?.fabric_collection || "",
    fabric_color: item?.fabric_color || "",
    wood_type_id: "",
    wood_type: item?.wood_type || "",
    wood_finish: item?.wood_finish || "",
    metal_type_id: "",
    metal_type: item?.metal_type || "",
    metal_finish: item?.metal_finish || "",
    metal_color: item?.metal_color || "",
    stone_type_id: "",
    stone_type: item?.stone_type || "",
    stone_finish: item?.stone_finish || "",
    weaving_material: item?.weaving_material || "",
    weaving_pattern: item?.weaving_pattern || "",
    weaving_color: item?.weaving_color || "",
    carving_style: item?.carving_style || "",
    carving_pattern: item?.carving_pattern || "",

    // Images
    primary_image_url: item?.primary_image_url || "",
    gallery_images: Array.isArray(item?.gallery_images) ? item.gallery_images.join(', ') : '',
    technical_drawings: Array.isArray(item?.technical_drawings) ? item.technical_drawings.join(', ') : '',

    // Variations
    size_variants: Array.isArray(item?.size_variants) ? item.size_variants.join(', ') : '',
    configuration_options: Array.isArray(item?.configuration_options) ? item.configuration_options.join(', ') : '',
  });

  // Filter materials by category and hierarchy level (hierarchical system)
  const fabricMaterials = allMaterials?.filter((material: any) =>
    material.material_categories?.name?.toLowerCase().includes('fabric')
  ) || [];

  const woodMaterials = allMaterials?.filter((material: any) =>
    material.material_categories?.name?.toLowerCase().includes('wood')
  ) || [];

  const metalMaterials = allMaterials?.filter((material: any) =>
    material.material_categories?.name?.toLowerCase().includes('metal')
  ) || [];

  const stoneMaterials = allMaterials?.filter((material: any) =>
    material.material_categories?.name?.toLowerCase().includes('stone')
  ) || [];

  const weavingMaterials = allMaterials?.filter((material: any) =>
    material.material_categories?.name?.toLowerCase().includes('weaving')
  ) || [];

  const carvingMaterials = allMaterials?.filter((material: any) =>
    material.material_categories?.name?.toLowerCase().includes('carving')
  ) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const _handleFurnitureDimensionsSave = async (data: {
    furniture_type: FurnitureType;
    dimensions: Record<string, number | null>;
  }) => {
    console.log('Saving furniture dimensions:', data);
    toast({
      title: "Dimensions saved",
      description: "Furniture dimensions have been saved successfully.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? `Edit ${item.name}` : "Add New Catalog Item"}
          </DialogTitle>
          <DialogDescription>
            {item ? "Update catalog item details" : "Create a new catalog item"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="images" disabled={!item?.id}>
                Images {!item?.id && <span className="text-xs ml-1">(Save first)</span>}
              </TabsTrigger>
              <TabsTrigger value="variations">Variations</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">
                    Item Name *
                    {formData.type === 'Production Ready' && (
                      <span className="ml-2 text-xs text-orange-600 font-semibold">🔒 Locked</span>
                    )}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Item name"
                    required
                    disabled={formData.type === 'Production Ready'}
                    className={formData.type === 'Production Ready' ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                  {formData.type === 'Production Ready' && (
                    <p className="text-xs text-tertiary mt-1">Change to Prototype to edit</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="base_sku">
                    Base SKU *
                    {formData.type === 'Production Ready' && (
                      <span className="ml-2 text-xs text-orange-600 font-semibold">🔒 Locked</span>
                    )}
                  </Label>
                  <Input
                    id="base_sku"
                    value={formData.base_sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_sku: e.target.value }))}
                    placeholder="AUTO-GENERATED"
                    required
                    disabled={formData.type === 'Production Ready'}
                    className={formData.type === 'Production Ready' ? 'bg-gray-100 cursor-not-allowed' : 'bg-blue-50'}
                  />
                  <p className="text-xs text-tertiary mt-1">
                    {formData.type === 'Production Ready'
                      ? 'Change to Prototype to edit'
                      : '✨ Auto-generated from name + collection + variation'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="variation_type">Variation Type (Optional)</Label>
                  <Input
                    id="variation_type"
                    value={formData.variation_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, variation_type: e.target.value }))}
                    placeholder="e.g., Deep, Short, Wide"
                    disabled={formData.type === 'Production Ready'}
                    className={formData.type === 'Production Ready' ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                  <p className="text-xs text-tertiary mt-1">Included in Base SKU (e.g., IN-SOFA-DEEP-001)</p>
                </div>

                <div>
                  <Label htmlFor="collection_id">Collection *</Label>
                  <Select
                    value={formData.collection_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, collection_id: value }))}
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

                <div>
                  <Label htmlFor="type">Item Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'Concept' | 'Prototype' | 'Production Ready') =>
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Concept">Concept</SelectItem>
                      <SelectItem value="Prototype">Prototype</SelectItem>
                      <SelectItem value="Production Ready">Production Ready</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="furniture_type">Furniture Type</Label>
                  <Select
                    value={formData.furniture_type}
                    onValueChange={(value: 'chair' | 'bench' | 'table' | 'sofa/loveseat' | 'sectional' | 'lounge' | 'chaise_lounge' | 'ottoman' | '') =>
                      setFormData(prev => ({ ...prev, furniture_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select furniture type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chair">Chair</SelectItem>
                      <SelectItem value="bench">Bench</SelectItem>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="sofa/loveseat">Sofa/Loveseat</SelectItem>
                      <SelectItem value="sectional">Sectional</SelectItem>
                      <SelectItem value="lounge">Lounge Chair</SelectItem>
                      <SelectItem value="chaise_lounge">Chaise Lounge</SelectItem>
                      <SelectItem value="ottoman">Ottoman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="list_price">Base Price *</Label>
                  <Input
                    id="list_price"
                    type="number"
                    step="0.01"
                    value={formData.list_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, list_price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="unit_cost">Unit Cost</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked === true }))}
                  />
                  <Label htmlFor="is_active">Active Item</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this item..."
                  rows={3}
                />
              </div>
            </TabsContent>


            <TabsContent value="dimensions" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Dimensions</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={_showAdvancedDimensions ? "default" : "outline"}
                      size="sm"
                      onClick={() => _setShowAdvancedDimensions(!_showAdvancedDimensions)}
                    >
                      {_showAdvancedDimensions ? "Basic Form" : "Advanced Form"}
                    </Button>
                  </div>
                </div>

                {_showAdvancedDimensions && formData.furniture_type ? (
                  <FurnitureDimensionsForm
                    initialFurnitureType={formData.furniture_type as FurnitureType}
                    onSave={_handleFurnitureDimensionsSave}
                    className="mt-4"
                  />
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-base font-semibold mb-4">Overall Dimensions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="width">Width</Label>
                          <Input
                            id="width"
                            type="number"
                            step="0.1"
                            value={formData.width}
                            onChange={(e) => setFormData(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="depth">Depth</Label>
                          <Input
                            id="depth"
                            type="number"
                            step="0.1"
                            value={formData.depth}
                            onChange={(e) => setFormData(prev => ({ ...prev, depth: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="height">Height</Label>
                          <Input
                            id="height"
                            type="number"
                            step="0.1"
                            value={formData.height}
                            onChange={(e) => setFormData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dimension_units">Units</Label>
                          <Select
                            value={formData.dimension_units}
                            onValueChange={(value: 'inches' | 'cm') =>
                              setFormData(prev => ({ ...prev, dimension_units: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inches">Inches</SelectItem>
                              <SelectItem value="cm">Centimeters</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Table Specific Dimensions */}
                    {formData.furniture_type === 'table' && (
                      <div>
                        <h4 className="text-base font-semibold mb-4">Table Dimensions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="length">Length</Label>
                            <Input
                              id="length"
                              type="number"
                              step="0.1"
                              value={formData.length}
                              onChange={(e) => setFormData(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="apron_height">Apron Height</Label>
                            <Input
                              id="apron_height"
                              type="number"
                              step="0.1"
                              value={formData.apron_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, apron_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="leg_clearance">Leg Clearance</Label>
                            <Input
                              id="leg_clearance"
                              type="number"
                              step="0.1"
                              value={formData.leg_clearance}
                              onChange={(e) => setFormData(prev => ({ ...prev, leg_clearance: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="overhang">Overhang</Label>
                            <Input
                              id="overhang"
                              type="number"
                              step="0.1"
                              value={formData.overhang}
                              onChange={(e) => setFormData(prev => ({ ...prev, overhang: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="leaf_width">Leaf Width (if expandable)</Label>
                            <Input
                              id="leaf_width"
                              type="number"
                              step="0.1"
                              value={formData.leaf_width}
                              onChange={(e) => setFormData(prev => ({ ...prev, leaf_width: parseFloat(e.target.value) || 0 }))}
                              placeholder="Leave empty if not expandable"
                            />
                          </div>
                          <div>
                            <Label htmlFor="leaf_length">Leaf Length (if expandable)</Label>
                            <Input
                              id="leaf_length"
                              type="number"
                              step="0.1"
                              value={formData.leaf_length}
                              onChange={(e) => setFormData(prev => ({ ...prev, leaf_length: parseFloat(e.target.value) || 0 }))}
                              placeholder="Leave empty if not expandable"
                            />
                          </div>
                        </div>

                        {/* Universal Measurements for Tables */}
                        <div className="mt-6">
                          <h5 className="text-sm font-medium mb-3">Universal Measurements</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor="table_clearance_required">Clearance Required</Label>
                              <Input
                                id="table_clearance_required"
                                type="number"
                                step="0.1"
                                value={formData.clearance_required}
                                onChange={(e) => setFormData(prev => ({ ...prev, clearance_required: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="table_doorway_clearance">Doorway Clearance</Label>
                              <Input
                                id="table_doorway_clearance"
                                type="number"
                                step="0.1"
                                value={formData.doorway_clearance}
                                onChange={(e) => setFormData(prev => ({ ...prev, doorway_clearance: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="table_weight_lbs">Weight (lbs)</Label>
                              <Input
                                id="table_weight_lbs"
                                type="number"
                                step="0.1"
                                value={formData.weight_lbs}
                                onChange={(e) => {
                                  const lbs = parseFloat(e.target.value) || 0;
                                  const kg = lbs * 0.453592;
                                  setFormData(prev => ({ ...prev, weight_lbs: lbs, weight_kg: kg }));
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor="table_weight_kg">Weight (kg)</Label>
                              <Input
                                id="table_weight_kg"
                                type="number"
                                step="0.1"
                                value={formData.weight_kg}
                                onChange={(e) => {
                                  const kg = parseFloat(e.target.value) || 0;
                                  const lbs = kg * 2.20462;
                                  setFormData(prev => ({ ...prev, weight_kg: kg, weight_lbs: lbs }));
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor="table_diagonal_depth">Diagonal Depth</Label>
                              <Input
                                id="table_diagonal_depth"
                                type="number"
                                step="0.1"
                                value={formData.diagonal_depth}
                                onChange={(e) => setFormData(prev => ({ ...prev, diagonal_depth: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="table_material_thickness">Material Thickness</Label>
                              <Input
                                id="table_material_thickness"
                                type="number"
                                step="0.1"
                                value={formData.material_thickness}
                                onChange={(e) => setFormData(prev => ({ ...prev, material_thickness: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="table_stacking_height">Stacking Height (if stackable)</Label>
                              <Input
                                id="table_stacking_height"
                                type="number"
                                step="0.1"
                                value={formData.stacking_height}
                                onChange={(e) => setFormData(prev => ({ ...prev, stacking_height: parseFloat(e.target.value) || 0 }))}
                                placeholder="Leave empty if not stackable"
                              />
                            </div>
                            <div>
                              <Label htmlFor="table_folded_width">Folded Width (if collapsible)</Label>
                              <Input
                                id="table_folded_width"
                                type="number"
                                step="0.1"
                                value={formData.folded_width}
                                onChange={(e) => setFormData(prev => ({ ...prev, folded_width: parseFloat(e.target.value) || 0 }))}
                                placeholder="Leave empty if not collapsible"
                              />
                            </div>
                            <div>
                              <Label htmlFor="table_folded_depth">Folded Depth (if collapsible)</Label>
                              <Input
                                id="table_folded_depth"
                                type="number"
                                step="0.1"
                                value={formData.folded_depth}
                                onChange={(e) => setFormData(prev => ({ ...prev, folded_depth: parseFloat(e.target.value) || 0 }))}
                                placeholder="Leave empty if not collapsible"
                              />
                            </div>
                            <div>
                              <Label htmlFor="table_folded_height">Folded Height (if collapsible)</Label>
                              <Input
                                id="table_folded_height"
                                type="number"
                                step="0.1"
                                value={formData.folded_height}
                                onChange={(e) => setFormData(prev => ({ ...prev, folded_height: parseFloat(e.target.value) || 0 }))}
                                placeholder="Leave empty if not collapsible"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chair Specific Dimensions */}
                    {formData.furniture_type === 'chair' && (
                      <div>
                        <h4 className="text-base font-semibold mb-4">Chair Dimensions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="seat_height">Seat Height</Label>
                            <Input
                              id="seat_height"
                              type="number"
                              step="0.1"
                              value={formData.seat_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, seat_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="seat_width">Seat Width</Label>
                            <Input
                              id="seat_width"
                              type="number"
                              step="0.1"
                              value={formData.seat_width}
                              onChange={(e) => setFormData(prev => ({ ...prev, seat_width: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="seat_depth">Seat Depth</Label>
                            <Input
                              id="seat_depth"
                              type="number"
                              step="0.1"
                              value={formData.seat_depth}
                              onChange={(e) => setFormData(prev => ({ ...prev, seat_depth: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="arm_height">Arm Height</Label>
                            <Input
                              id="arm_height"
                              type="number"
                              step="0.1"
                              value={formData.arm_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, arm_height: parseFloat(e.target.value) || 0 }))}
                              placeholder="Leave empty if armless"
                            />
                          </div>
                          <div>
                            <Label htmlFor="back_height">Backrest Height</Label>
                            <Input
                              id="back_height"
                              type="number"
                              step="0.1"
                              value={formData.back_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, back_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="width_across_arms">Width Across Arms</Label>
                            <Input
                              id="width_across_arms"
                              type="number"
                              step="0.1"
                              value={formData.width_across_arms}
                              onChange={(e) => setFormData(prev => ({ ...prev, width_across_arms: parseFloat(e.target.value) || 0 }))}
                              placeholder="Leave empty if armless"
                            />
                          </div>
                        </div>

                        {/* Universal Measurements for Chairs */}
                        <div className="mt-6">
                          <h5 className="text-sm font-medium mb-3">Universal Measurements</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor="chair_clearance_required">Clearance Required</Label>
                              <Input
                                id="chair_clearance_required"
                                type="number"
                                step="0.1"
                                value={formData.clearance_required}
                                onChange={(e) => setFormData(prev => ({ ...prev, clearance_required: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="chair_doorway_clearance">Doorway Clearance</Label>
                              <Input
                                id="chair_doorway_clearance"
                                type="number"
                                step="0.1"
                                value={formData.doorway_clearance}
                                onChange={(e) => setFormData(prev => ({ ...prev, doorway_clearance: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="chair_weight_lbs">Weight (lbs)</Label>
                              <Input
                                id="chair_weight_lbs"
                                type="number"
                                step="0.1"
                                value={formData.weight_lbs}
                                onChange={(e) => {
                                  const lbs = parseFloat(e.target.value) || 0;
                                  const kg = lbs * 0.453592;
                                  setFormData(prev => ({ ...prev, weight_lbs: lbs, weight_kg: kg }));
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor="chair_weight_kg">Weight (kg)</Label>
                              <Input
                                id="chair_weight_kg"
                                type="number"
                                step="0.1"
                                value={formData.weight_kg}
                                onChange={(e) => {
                                  const kg = parseFloat(e.target.value) || 0;
                                  const lbs = kg * 2.20462;
                                  setFormData(prev => ({ ...prev, weight_kg: kg, weight_lbs: lbs }));
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor="chair_diagonal_depth">Diagonal Depth</Label>
                              <Input
                                id="chair_diagonal_depth"
                                type="number"
                                step="0.1"
                                value={formData.diagonal_depth}
                                onChange={(e) => setFormData(prev => ({ ...prev, diagonal_depth: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="chair_material_thickness">Material Thickness</Label>
                              <Input
                                id="chair_material_thickness"
                                type="number"
                                step="0.1"
                                value={formData.material_thickness}
                                onChange={(e) => setFormData(prev => ({ ...prev, material_thickness: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="chair_cushion_compressed">Cushion Thickness (compressed)</Label>
                              <Input
                                id="chair_cushion_compressed"
                                type="number"
                                step="0.1"
                                value={formData.cushion_thickness_compressed}
                                onChange={(e) => setFormData(prev => ({ ...prev, cushion_thickness_compressed: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="chair_cushion_uncompressed">Cushion Thickness (uncompressed)</Label>
                              <Input
                                id="chair_cushion_uncompressed"
                                type="number"
                                step="0.1"
                                value={formData.cushion_thickness_uncompressed}
                                onChange={(e) => setFormData(prev => ({ ...prev, cushion_thickness_uncompressed: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="chair_stacking_height">Stacking Height (if stackable)</Label>
                              <Input
                                id="chair_stacking_height"
                                type="number"
                                step="0.1"
                                value={formData.stacking_height}
                                onChange={(e) => setFormData(prev => ({ ...prev, stacking_height: parseFloat(e.target.value) || 0 }))}
                                placeholder="Leave empty if not stackable"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bench Specific Dimensions */}
                    {formData.furniture_type === 'bench' && (
                      <div>
                        <h4 className="text-base font-semibold mb-4">Bench Dimensions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="length">Length</Label>
                            <Input
                              id="length"
                              type="number"
                              step="0.1"
                              value={formData.length}
                              onChange={(e) => setFormData(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="seat_depth">Depth</Label>
                            <Input
                              id="seat_depth"
                              type="number"
                              step="0.1"
                              value={formData.seat_depth}
                              onChange={(e) => setFormData(prev => ({ ...prev, seat_depth: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="back_height">Backrest Height</Label>
                            <Input
                              id="back_height"
                              type="number"
                              step="0.1"
                              value={formData.back_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, back_height: parseFloat(e.target.value) || 0 }))}
                              placeholder="Leave empty if no backrest"
                            />
                          </div>
                          <div>
                            <Label htmlFor="weight_capacity">Weight Capacity (lbs)</Label>
                            <Input
                              id="weight_capacity"
                              type="number"
                              value={formData.weight_capacity}
                              onChange={(e) => setFormData(prev => ({ ...prev, weight_capacity: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sofa/Loveseat Specific Dimensions */}
                    {formData.furniture_type === 'sofa/loveseat' && (
                      <div>
                        <h4 className="text-base font-semibold mb-4">Sofa/Loveseat Dimensions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="seat_height">Seat Height</Label>
                            <Input
                              id="seat_height"
                              type="number"
                              step="0.1"
                              value={formData.seat_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, seat_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="seat_depth">Seat Depth</Label>
                            <Input
                              id="seat_depth"
                              type="number"
                              step="0.1"
                              value={formData.seat_depth}
                              onChange={(e) => setFormData(prev => ({ ...prev, seat_depth: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="arm_height">Arm Height</Label>
                            <Input
                              id="arm_height"
                              type="number"
                              step="0.1"
                              value={formData.arm_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, arm_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="back_height">Backrest Height</Label>
                            <Input
                              id="back_height"
                              type="number"
                              step="0.1"
                              value={formData.back_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, back_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="leg_height">Leg/Base Height</Label>
                            <Input
                              id="leg_height"
                              type="number"
                              step="0.1"
                              value={formData.leg_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, leg_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sectional Specific Dimensions */}
                    {formData.furniture_type === 'sectional' && (
                      <div>
                        <h4 className="text-base font-semibold mb-4">Sectional Dimensions</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor="seat_height">Seat Height</Label>
                              <Input
                                id="seat_height"
                                type="number"
                                step="0.1"
                                value={formData.seat_height}
                                onChange={(e) => setFormData(prev => ({ ...prev, seat_height: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="seat_depth">Seat Depth</Label>
                              <Input
                                id="seat_depth"
                                type="number"
                                step="0.1"
                                value={formData.seat_depth}
                                onChange={(e) => setFormData(prev => ({ ...prev, seat_depth: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="arm_height">Arm Height</Label>
                              <Input
                                id="arm_height"
                                type="number"
                                step="0.1"
                                value={formData.arm_height}
                                onChange={(e) => setFormData(prev => ({ ...prev, arm_height: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="back_height">Backrest Height</Label>
                              <Input
                                id="back_height"
                                type="number"
                                step="0.1"
                                value={formData.back_height}
                                onChange={(e) => setFormData(prev => ({ ...prev, back_height: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="chaise_length">Chaise Length</Label>
                              <Input
                                id="chaise_length"
                                type="number"
                                step="0.1"
                                value={formData.chaise_length}
                                onChange={(e) => setFormData(prev => ({ ...prev, chaise_length: parseFloat(e.target.value) || 0 }))}
                                placeholder="If chaise included"
                              />
                            </div>
                            <div>
                              <Label htmlFor="corner_depth">Corner/Wedge Depth</Label>
                              <Input
                                id="corner_depth"
                                type="number"
                                step="0.1"
                                value={formData.corner_depth}
                                onChange={(e) => setFormData(prev => ({ ...prev, corner_depth: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="corner_width">Corner/Wedge Width</Label>
                              <Input
                                id="corner_width"
                                type="number"
                                step="0.1"
                                value={formData.corner_width}
                                onChange={(e) => setFormData(prev => ({ ...prev, corner_width: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chaise Lounge Specific Dimensions */}
                    {formData.furniture_type === 'chaise_lounge' && (
                      <div>
                        <h4 className="text-base font-semibold mb-4">Chaise Lounge Dimensions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="length">Overall Length</Label>
                            <Input
                              id="length"
                              type="number"
                              step="0.1"
                              value={formData.length}
                              onChange={(e) => setFormData(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="seat_height">Seat Height</Label>
                            <Input
                              id="seat_height"
                              type="number"
                              step="0.1"
                              value={formData.seat_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, seat_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="back_height">Backrest Height</Label>
                            <Input
                              id="back_height"
                              type="number"
                              step="0.1"
                              value={formData.back_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, back_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="backrest_angle">Backrest Angle (degrees)</Label>
                            <Input
                              id="backrest_angle"
                              type="number"
                              value={formData.backrest_angle}
                              onChange={(e) => setFormData(prev => ({ ...prev, backrest_angle: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="leg_section_length">Leg Section Length</Label>
                            <Input
                              id="leg_section_length"
                              type="number"
                              step="0.1"
                              value={formData.leg_section_length}
                              onChange={(e) => setFormData(prev => ({ ...prev, leg_section_length: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="arm_height">Arm Height</Label>
                            <Input
                              id="arm_height"
                              type="number"
                              step="0.1"
                              value={formData.arm_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, arm_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="chaise_orientation">Chaise Orientation</Label>
                            <Select
                              value={formData.chaise_orientation || ''}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, chaise_orientation: value as 'left' | 'right' }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select orientation" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="adjustable_positions">Adjustable Positions</Label>
                            <Input
                              id="adjustable_positions"
                              type="number"
                              value={formData.adjustable_positions}
                              onChange={(e) => setFormData(prev => ({ ...prev, adjustable_positions: parseInt(e.target.value) || 0 }))}
                              placeholder="Number of positions"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lounge Chair Specific Dimensions */}
                    {formData.furniture_type === 'lounge' && (
                      <div>
                        <h4 className="text-base font-semibold mb-4">Lounge Chair Dimensions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="seat_height">Seat Height</Label>
                            <Input
                              id="seat_height"
                              type="number"
                              step="0.1"
                              value={formData.seat_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, seat_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="seat_width">Seat Width</Label>
                            <Input
                              id="seat_width"
                              type="number"
                              step="0.1"
                              value={formData.seat_width}
                              onChange={(e) => setFormData(prev => ({ ...prev, seat_width: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="seat_depth">Seat Depth</Label>
                            <Input
                              id="seat_depth"
                              type="number"
                              step="0.1"
                              value={formData.seat_depth}
                              onChange={(e) => setFormData(prev => ({ ...prev, seat_depth: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="back_height">Backrest Height</Label>
                            <Input
                              id="back_height"
                              type="number"
                              step="0.1"
                              value={formData.back_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, back_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="reclined_depth">Reclined Depth</Label>
                            <Input
                              id="reclined_depth"
                              type="number"
                              step="0.1"
                              value={formData.reclined_depth}
                              onChange={(e) => setFormData(prev => ({ ...prev, reclined_depth: parseFloat(e.target.value) || 0 }))}
                              placeholder="When fully reclined"
                            />
                          </div>
                          <div>
                            <Label htmlFor="footrest_length">Footrest Length</Label>
                            <Input
                              id="footrest_length"
                              type="number"
                              step="0.1"
                              value={formData.footrest_length}
                              onChange={(e) => setFormData(prev => ({ ...prev, footrest_length: parseFloat(e.target.value) || 0 }))}
                              placeholder="If applicable"
                            />
                          </div>
                          <div>
                            <Label htmlFor="arm_height">Arm Height</Label>
                            <Input
                              id="arm_height"
                              type="number"
                              step="0.1"
                              value={formData.arm_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, arm_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="swivel_range">Swivel Range (degrees)</Label>
                            <Input
                              id="swivel_range"
                              type="number"
                              value={formData.swivel_range}
                              onChange={(e) => setFormData(prev => ({ ...prev, swivel_range: parseInt(e.target.value) || 0 }))}
                              placeholder="360 for full swivel"
                            />
                          </div>
                          <div>
                            <Label htmlFor="zero_wall_clearance">Zero Wall Clearance</Label>
                            <Input
                              id="zero_wall_clearance"
                              type="number"
                              step="0.1"
                              value={formData.zero_wall_clearance}
                              onChange={(e) => setFormData(prev => ({ ...prev, zero_wall_clearance: parseFloat(e.target.value) || 0 }))}
                              placeholder="Distance from wall"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ottoman Specific Dimensions */}
                    {formData.furniture_type === 'ottoman' && (
                      <div>
                        <h4 className="text-base font-semibold mb-4">Ottoman Dimensions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="ottoman_height">Ottoman Height</Label>
                            <Input
                              id="ottoman_height"
                              type="number"
                              step="0.1"
                              value={formData.ottoman_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, ottoman_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="ottoman_length">Ottoman Length</Label>
                            <Input
                              id="ottoman_length"
                              type="number"
                              step="0.1"
                              value={formData.ottoman_length}
                              onChange={(e) => setFormData(prev => ({ ...prev, ottoman_length: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="ottoman_width">Ottoman Width</Label>
                            <Input
                              id="ottoman_width"
                              type="number"
                              step="0.1"
                              value={formData.ottoman_width}
                              onChange={(e) => setFormData(prev => ({ ...prev, ottoman_width: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Table Dimensions - For tables */}
                    {formData.furniture_type === 'table' && (
                      <div>
                        <h4 className="text-base font-semibold mb-4">Table Dimensions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="clearance_height">Clearance Height</Label>
                            <Input
                              id="clearance_height"
                              type="number"
                              step="0.1"
                              value={formData.clearance_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, clearance_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="table_top_thickness">Table Top Thickness</Label>
                            <Input
                              id="table_top_thickness"
                              type="number"
                              step="0.1"
                              value={formData.table_top_thickness}
                              onChange={(e) => setFormData(prev => ({ ...prev, table_top_thickness: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Detail Dimensions - Show relevant fields based on furniture type */}
                    {formData.furniture_type && (
                      <div>
                        <h4 className="text-base font-semibold mb-4">Detail Dimensions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Cushion Thickness - only for seating */}
                          {['chair', 'bench', 'sofa/loveseat', 'sectional', 'lounge', 'chaise_lounge', 'ottoman'].includes(formData.furniture_type) && (
                            <div>
                              <Label htmlFor="cushion_thickness">Cushion Thickness</Label>
                              <Input
                                id="cushion_thickness"
                                type="number"
                                step="0.1"
                                value={formData.cushion_thickness}
                                onChange={(e) => setFormData(prev => ({ ...prev, cushion_thickness: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                          )}

                        </div>
                      </div>
                    )}

                    {/* Storage Dimensions - Only show for furniture with storage (could include ottoman, bench with storage, etc.) */}
                    {['ottoman', 'bench'].includes(formData.furniture_type) && (
                      <div>
                        <h4 className="text-base font-semibold mb-4">Storage Dimensions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="interior_width">Interior Width</Label>
                            <Input
                              id="interior_width"
                              type="number"
                              step="0.1"
                              value={formData.interior_width}
                              onChange={(e) => setFormData(prev => ({ ...prev, interior_width: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="interior_depth">Interior Depth</Label>
                            <Input
                              id="interior_depth"
                              type="number"
                              step="0.1"
                              value={formData.interior_depth}
                              onChange={(e) => setFormData(prev => ({ ...prev, interior_depth: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="interior_height">Interior Height</Label>
                            <Input
                              id="interior_height"
                              type="number"
                              step="0.1"
                              value={formData.interior_height}
                              onChange={(e) => setFormData(prev => ({ ...prev, interior_height: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="drawer_dimensions">Drawer Dimensions</Label>
                            <Input
                              id="drawer_dimensions"
                              value={formData.drawer_dimensions}
                              onChange={(e) => setFormData(prev => ({ ...prev, drawer_dimensions: e.target.value }))}
                              placeholder='Describe drawer dimensions (e.g., Top drawer: 12" deep, Bottom drawer: 15" deep)'
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {_showAdvancedDimensions && (
                      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                        <p className="text-sm text-blue-200">
                          💡 <strong>Tip:</strong> Select a furniture type in the Basic tab to enable the advanced furniture dimensions form with validation and smart field grouping.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Stock Management</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock_quantity">Current Stock</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="min_stock_level">Min Stock Level</Label>
                      <Input
                        id="min_stock_level"
                        type="number"
                        value={formData.min_stock_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_stock_level">Max Stock Level</Label>
                      <Input
                        id="max_stock_level"
                        type="number"
                        value={formData.max_stock_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_stock_level: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reorder_point">Reorder Point</Label>
                      <Input
                        id="reorder_point"
                        type="number"
                        value={formData.reorder_point}
                        onChange={(e) => setFormData(prev => ({ ...prev, reorder_point: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Supplier Information</h3>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Supplier name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier_sku">Supplier SKU</Label>
                    <Input
                      id="supplier_sku"
                      value={formData.supplier_sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_sku: e.target.value }))}
                      placeholder="Supplier's SKU"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Shipping & Packaging</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="boxed_width">Boxed Width</Label>
                    <Input
                      id="boxed_width"
                      type="number"
                      step="0.1"
                      value={formData.boxed_width}
                      onChange={(e) => setFormData(prev => ({ ...prev, boxed_width: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="boxed_depth">Boxed Depth</Label>
                    <Input
                      id="boxed_depth"
                      type="number"
                      step="0.1"
                      value={formData.boxed_depth}
                      onChange={(e) => setFormData(prev => ({ ...prev, boxed_depth: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="boxed_height">Boxed Height</Label>
                    <Input
                      id="boxed_height"
                      type="number"
                      step="0.1"
                      value={formData.boxed_height}
                      onChange={(e) => setFormData(prev => ({ ...prev, boxed_height: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight_lbs">Weight (lbs)</Label>
                    <Input
                      id="weight_lbs"
                      type="number"
                      step="0.1"
                      value={formData.weight_lbs}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight_lbs: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="num_boxes">Number of Boxes</Label>
                    <Input
                      id="num_boxes"
                      type="number"
                      value={formData.num_boxes}
                      onChange={(e) => setFormData(prev => ({ ...prev, num_boxes: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="assembly_required"
                      checked={formData.assembly_required}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, assembly_required: checked === true }))}
                    />
                    <Label htmlFor="assembly_required">Assembly Required</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="materials" className="space-y-4">
              {/* Fabric Materials */}
              <div className="space-y-3">
                <h4 className="font-medium text-purple-800 dark:text-purple-200">Fabric Materials</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fabric_brand">Fabric Brand</Label>
                    <Select
                      value={formData.fabric_brand}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        fabric_brand: value,
                        fabric_collection: "", // Reset cascade
                        fabric_color: "" // Reset cascade
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {fabricMaterials.filter((m: any) => m.hierarchy_level === 1).map((brand: any) => (
                          <SelectItem key={brand.id} value={brand.name}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fabric_collection">Fabric Collection</Label>
                    <Select
                      value={formData.fabric_collection}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        fabric_collection: value,
                        fabric_color: "" // Reset color when collection changes
                      })}
                      disabled={!formData.fabric_brand}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.fabric_brand ? "Select collection" : "Select brand first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {fabricMaterials.filter((m: any) => m.hierarchy_level === 2).map((collection: any) => (
                          <SelectItem key={collection.id} value={collection.name}>
                            {collection.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fabric_color">Fabric Color</Label>
                    <Select
                      value={formData.fabric_color}
                      onValueChange={(value) => setFormData({ ...formData, fabric_color: value })}
                      disabled={!formData.fabric_collection}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.fabric_collection ? "Select color" : "Select collection first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {fabricMaterials.filter((m: any) => m.hierarchy_level === 3).map((color: any) => (
                          <SelectItem key={color.id} value={color.name}>
                            {color.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Wood Materials */}
              <div className="space-y-3">
                <h4 className="font-medium text-amber-800 dark:text-amber-200">Wood Materials</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wood_type">Wood Type</Label>
                    <Select
                      value={formData.wood_type_id || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setFormData({
                            ...formData,
                            wood_type_id: "",
                            wood_type: "",
                            wood_finish: ""
                          });
                        } else {
                          const selectedWood: any = woodMaterials.find((m: any) => m.id === value);
                          setFormData({
                            ...formData,
                            wood_type_id: value,
                            wood_type: (selectedWood as any)?.name || "",
                            wood_finish: "" // Reset finish when type changes
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select wood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {woodMaterials.filter((m: any) => m.hierarchy_level === 1).map((wood: any) => (
                          <SelectItem key={wood.id} value={wood.id}>
                            {wood.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wood_finish">Wood Finish</Label>
                    <Select
                      value={formData.wood_finish}
                      onValueChange={(value) => setFormData({ ...formData, wood_finish: value })}
                      disabled={!formData.wood_type_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.wood_type_id ? "Select wood finish" : "Select wood type first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {woodMaterials
                          .filter((m: any) =>
                            m.hierarchy_level === 2 &&
                            m.parent_material_id === formData.wood_type_id
                          )
                          .map((finish: any) => (
                            <SelectItem key={finish.id} value={finish.name}>
                              {finish.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Metal Materials */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-800 dark:text-slate-200">Metal Materials</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="metal_type">Metal Type</Label>
                    <Select
                      value={formData.metal_type_id || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setFormData({
                            ...formData,
                            metal_type_id: "",
                            metal_type: "",
                            metal_finish: "",
                            metal_color: ""
                          });
                        } else {
                          const selectedMetal: any = metalMaterials.find((m: any) => m.id === value);
                          setFormData({
                            ...formData,
                            metal_type_id: value,
                            metal_type: (selectedMetal as any)?.name || "",
                            metal_finish: "", // Reset finish when type changes
                            metal_color: "" // Reset color when type changes
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select metal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {metalMaterials.filter((m: any) => m.hierarchy_level === 1).map((metal: any) => (
                          <SelectItem key={metal.id} value={metal.id}>
                            {metal.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metal_finish">Metal Finish</Label>
                    <Select
                      value={formData.metal_finish}
                      onValueChange={(value) => setFormData({ ...formData, metal_finish: value })}
                      disabled={!formData.metal_type_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.metal_type_id ? "Select metal finish" : "Select metal type first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {metalMaterials
                          .filter((m: any) =>
                            m.hierarchy_level === 2 &&
                            m.parent_material_id === formData.metal_type_id
                          )
                          .map((finish: any) => (
                            <SelectItem key={finish.id} value={finish.name}>
                              {finish.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metal_color">Metal Color</Label>
                    <Select
                      value={formData.metal_color}
                      onValueChange={(value) => setFormData({ ...formData, metal_color: value })}
                      disabled={!formData.metal_finish}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.metal_finish ? "Select metal color" : "Select metal finish first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {metalMaterials.filter((m: any) => m.hierarchy_level === 3).map((color: any) => (
                          <SelectItem key={color.id} value={color.name}>
                            {color.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Stone Materials */}
              <div className="space-y-3">
                <h4 className="font-medium text-stone-800 dark:text-stone-200">Stone Materials</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stone_type">Stone Type</Label>
                    <Select
                      value={formData.stone_type_id || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setFormData({
                            ...formData,
                            stone_type_id: "",
                            stone_type: "",
                            stone_finish: ""
                          });
                        } else {
                          const selectedStone: any = stoneMaterials.find((m: any) => m.id === value);
                          setFormData({
                            ...formData,
                            stone_type_id: value,
                            stone_type: (selectedStone as any)?.name || "",
                            stone_finish: "" // Reset finish when type changes
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stone type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {stoneMaterials.filter((m: any) => m.hierarchy_level === 1).map((stone: any) => (
                          <SelectItem key={stone.id} value={stone.id}>
                            {stone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stone_finish">Stone Finish</Label>
                    <Select
                      value={formData.stone_finish}
                      onValueChange={(value) => setFormData({ ...formData, stone_finish: value })}
                      disabled={!formData.stone_type_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.stone_type_id ? "Select stone finish" : "Select stone type first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {stoneMaterials
                          .filter((m: any) =>
                            m.hierarchy_level === 2 &&
                            m.parent_material_id === formData.stone_type_id
                          )
                          .map((finish: any) => (
                            <SelectItem key={finish.id} value={finish.name}>
                              {finish.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Weaving Materials */}
              <div className="space-y-3">
                <h4 className="font-medium text-green-800 dark:text-green-200">Weaving Materials</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weaving_material">Weaving Material</Label>
                    <Select
                      value={formData.weaving_material}
                      onValueChange={(value) => setFormData({ ...formData, weaving_material: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {weavingMaterials.filter((m: any) => m.hierarchy_level === 1).map((material: any) => (
                          <SelectItem key={material.id} value={material.name}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weaving_pattern">Weaving Pattern</Label>
                    <Select
                      value={formData.weaving_pattern}
                      onValueChange={(value) => setFormData({ ...formData, weaving_pattern: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {weavingMaterials.filter((m: any) => m.hierarchy_level === 2).map((pattern: any) => (
                          <SelectItem key={pattern.id} value={pattern.name}>
                            {pattern.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weaving_color">Weaving Color</Label>
                    <Select
                      value={formData.weaving_color}
                      onValueChange={(value) => setFormData({ ...formData, weaving_color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {weavingMaterials.filter((m: any) => m.hierarchy_level === 3).map((color: any) => (
                          <SelectItem key={color.id} value={color.name}>
                            {color.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Carving */}
              <div className="space-y-3">
                <h4 className="font-medium text-orange-800 dark:text-orange-200">Carving</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carving_style">Carving Style</Label>
                    <Select
                      value={formData.carving_style}
                      onValueChange={(value) => setFormData({ ...formData, carving_style: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select carving style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {carvingMaterials.filter((m: any) => m.hierarchy_level === 1).map((style: any) => (
                          <SelectItem key={style.id} value={style.name}>
                            {style.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carving_pattern">Carving Pattern</Label>
                    <Select
                      value={formData.carving_pattern}
                      onValueChange={(value) => setFormData({ ...formData, carving_pattern: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select carving pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {carvingMaterials.filter((m: any) => m.hierarchy_level === 2).map((pattern: any) => (
                          <SelectItem key={pattern.id} value={pattern.name}>
                            {pattern.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              {item?.id ? (
                <CatalogImageManager itemId={item.id} />
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-secondary mb-2">Save the catalog item first to upload images</p>
                  <p className="text-sm text-tertiary">Images can be added after creating the item</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="variations" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="size_variants">Size Variants</Label>
                  <TagInput
                    id="size_variants"
                    value={formData.size_variants}
                    onChange={(value) => setFormData(prev => ({ ...prev, size_variants: value }))}
                    placeholder='Add size variants (e.g., Small, Medium, Large)'
                  />
                </div>

                <div>
                  <Label htmlFor="configuration_options">Configuration Options</Label>
                  <TagInput
                    id="configuration_options"
                    value={formData.configuration_options}
                    onChange={(value) => setFormData(prev => ({ ...prev, configuration_options: value }))}
                    placeholder='Add configuration options (e.g., left arm, right arm, armless)'
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-4">
                <div className="rounded-lg border card/50 p-4">
                  <h4 className="text-sm font-semibold mb-3 text-primary">Product Development Timeline</h4>
                  <p className="text-sm text-secondary mb-4">
                    Track the journey from concept to production-ready item
                  </p>

                  {item ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-primary">Current Stage</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              item.type === 'Concept' ? 'bg-blue-600 text-blue-100' :
                              item.type === 'Prototype' ? 'bg-orange-600 text-orange-100' :
                              'bg-green-600 text-green-100'
                            }`}>
                              {item.type}
                            </span>
                          </div>
                          <p className="text-xs text-secondary mt-1">
                            {item.type === 'Concept' && 'Initial design phase - no materials selected yet'}
                            {item.type === 'Prototype' && 'Testing phase - materials selected for prototyping'}
                            {item.type === 'Production Ready' && 'Vetted and approved for customer orders'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full "></div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-primary">Created</span>
                          <p className="text-xs text-secondary mt-1">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Date not available'}
                          </p>
                        </div>
                      </div>

                      {item.updated_at && item.updated_at !== item.created_at && (
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full "></div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-primary">Last Updated</span>
                            <p className="text-xs text-secondary mt-1">
                              {new Date(item.updated_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-tertiary">
                          Future enhancement: Detailed status change history will be tracked here (Concept → Prototype → Production Ready transitions with dates and users)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm page-subtitle">
                        History tracking will begin once this item is created
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {item ? "Update Item" : "Create Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Component that fetches furniture dimensions and displays them
interface FurnitureDimensionsDisplayProps {
  itemId: string;
  furnitureType: FurnitureType;
  preferredUnit?: 'inches' | 'cm';
  compact?: boolean;
  showEmpty?: boolean;
}

function FurnitureDimensionsDisplay({
  itemId,
  furnitureType,
  preferredUnit = 'inches',
  compact = false,
  showEmpty = true,
}: FurnitureDimensionsDisplayProps) {
  const { data: dimensions, isLoading, error } = api.items.getFurnitureDimensions.useQuery({ itemId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="page-subtitle">Loading dimensions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-400">Error loading dimensions: {error.message}</div>
      </div>
    );
  }

  return (
    <DimensionDisplay
      furnitureType={furnitureType}
      dimensions={dimensions || {}}
      preferredUnit={preferredUnit}
      compact={compact}
      showEmpty={showEmpty}
    />
  );
}

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: collections } = api.products.getAllCollections.useQuery();

  // Get real data from API
  const { data: itemsData, isLoading: _itemsLoading, refetch: _refetchItems } = api.items.getAll.useQuery({
    limit: 50,
    offset: 0,
  });

  const items = itemsData?.items || [];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCollection = selectedCollection === "all" || item.collection_id === selectedCollection;

    // Only show Production Ready items on the Catalog page
    // Check type field for 'Production Ready' items (catalog items)
    const isProductionReady = item.type === "Production Ready";

    return matchesSearch && matchesCollection && isProductionReady;
  });

  const handleSaveItem = (data: ItemFormData) => {
    // TODO: Implement API call to save item
    console.log('Saving item:', data);
    toast({
      title: editingItem ? "Item updated" : "Item created",
      description: `${data.name} has been ${editingItem ? 'updated' : 'created'} successfully.`,
    });
    setEditingItem(undefined);
  };

  const _handleImageUpload = async (_imageType: ImageType, _file: File, _metadata: Partial<ItemImage>) => {
    // TODO: Implement real image upload functionality
    toast({
      title: "Image Upload",
      description: "Image upload functionality will be implemented with real storage.",
    });
  };

  const _handleImageUpdate = async (_imageId: string, _metadata: Partial<ItemImage>) => {
    // TODO: Implement real image update functionality
    toast({
      title: "Image Update",
      description: "Image update functionality will be implemented with real storage.",
    });
  };

  const _handleImageDelete = async (_imageId: string) => {
    // TODO: Implement real image delete functionality
    toast({
      title: "Image Delete",
      description: "Image delete functionality will be implemented with real storage.",
    });
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDeleteItem = (item: Item) => {
    if (!confirm(`Are you sure you want to delete ${item.name}? This action cannot be undone.`)) {
      return;
    }

    // TODO: Implement API call to delete item
    console.log('Deleting item:', item.id);
    toast({
      title: "Item deleted",
      description: `${item.name} has been deleted successfully.`,
    });
  };

  const clearFilters = () => {
    setSelectedCollection("all");
    setSearchTerm("");
  };

  const toggleRowExpansion = (itemId: string) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      return newExpanded;
    });
  };

  const _getStockStatusBadge = (status: string, quantity: number) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="default">In Stock ({quantity})</Badge>;
      case 'low_stock':
        return <Badge variant="destructive">Low Stock ({quantity})</Badge>;
      case 'out_of_stock':
        return <Badge variant="outline">Out of Stock</Badge>;
      case 'discontinued':
        return <Badge variant="secondary">Discontinued</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary">Catalog Items</h1>
          <p className="text-secondary mt-1">
            Production-ready items available for customer orders
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => {
            setEditingItem(undefined);
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center filters-section">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 card  text-primary"
            />
          </div>

          <Select value={selectedCollection} onValueChange={setSelectedCollection}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by collection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All collections</SelectItem>
              {collections?.map((collection: any) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(selectedCollection !== "all" || searchTerm) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <Filter className="mr-1 h-3 w-3" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="text-sm page-subtitle">
          {filteredItems.length} items
        </div>
      </div>

      {/* Items Table */}
      <Card className="card">
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Base SKU</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Furniture Type</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>List Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <React.Fragment key={item.id}>
                  <TableRow
                    className="cursor-pointer hover:card/50"
                    onClick={() => toggleRowExpansion(item.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {expandedRows.has(item.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-secondary max-w-xs truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{item.base_sku}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.collections?.name || 'No collection'}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.furniture_type ? (
                        <Badge variant="secondary" className="capitalize">
                          {item.furniture_type.replace('_', ' ')}
                        </Badge>
                      ) : (
                        <span className="text-tertiary text-sm">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-600 text-green-100">
                        Production Ready
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${item.list_price ? item.list_price.toFixed(2) : '0.00'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-primary">Available: {item.available_quantity}</div>
                        <div className="text-xs page-subtitle">
                          Total: {item.stock_quantity}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.is_active ? "default" : "secondary"}
                        className={item.is_active ? "bg-green-600 text-green-100" : " text-secondary"}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditItem(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteItem(item)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Content */}
                  {expandedRows.has(item.id) && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-6 card/30 border-t">
                          <Tabs defaultValue="inventory" className="w-full">
                            <TabsList className="grid w-full grid-cols-6">
                              <TabsTrigger value="inventory">Inventory</TabsTrigger>
                              <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
                              <TabsTrigger value="shipping">Shipping</TabsTrigger>
                              <TabsTrigger value="materials">Materials</TabsTrigger>
                              <TabsTrigger value="images">Images</TabsTrigger>
                              <TabsTrigger value="variations">Variations</TabsTrigger>
                            </TabsList>

                            <TabsContent value="inventory" className="mt-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <Label className="text-xs page-subtitle">Stock Quantity</Label>
                                  <div className="text-sm font-medium text-primary">{item.stock_quantity}</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Available</Label>
                                  <div className="text-sm font-medium text-primary">{item.available_quantity}</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Reserved</Label>
                                  <div className="text-sm font-medium text-primary">{item.reserved_quantity}</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Reorder Point</Label>
                                  <div className="text-sm font-medium text-primary">{item.reorder_point}</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Supplier</Label>
                                  <div className="text-sm font-medium text-primary">{item.supplier}</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Supplier SKU</Label>
                                  <div className="text-sm font-medium font-mono text-primary">{item.supplier_sku}</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Unit Cost</Label>
                                  <div className="text-sm font-medium text-primary">${item.unit_cost ? item.unit_cost.toFixed(2) : '0.00'}</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Stock Status</Label>
                                  <Badge variant="outline" className="text-xs">
                                    {item.stock_status ? item.stock_status.replace('_', ' ').toUpperCase() : 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="dimensions" className="mt-4">
                              {item.furniture_type ? (
                                <FurnitureDimensionsDisplay
                                  itemId={item.id}
                                  furnitureType={item.furniture_type as FurnitureType}
                                  preferredUnit="inches"
                                  compact={false}
                                  showEmpty={true}
                                />
                              ) : (
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2 text-primary">Overall Dimensions ({item.dimension_units})</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <Label className="text-xs page-subtitle">Width</Label>
                                        <div className="text-sm font-medium text-primary">{item.width}&quot;</div>
                                      </div>
                                      <div>
                                        <Label className="text-xs page-subtitle">Depth</Label>
                                        <div className="text-sm font-medium text-primary">{item.depth}&quot;</div>
                                      </div>
                                      <div>
                                        <Label className="text-xs page-subtitle">Height</Label>
                                        <div className="text-sm font-medium text-primary">{item.height}&quot;</div>
                                      </div>
                                    </div>
                                  </div>

                                  {item.seat_height && (
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2 text-primary">Seating Dimensions</h4>
                                      <div className="grid grid-cols-5 gap-4">
                                        <div>
                                          <Label className="text-xs page-subtitle">Seat Height</Label>
                                          <div className="text-sm font-medium text-primary">{item.seat_height}&quot;</div>
                                        </div>
                                        <div>
                                          <Label className="text-xs page-subtitle">Seat Depth</Label>
                                          <div className="text-sm font-medium text-primary">{item.seat_depth}&quot;</div>
                                        </div>
                                        <div>
                                          <Label className="text-xs page-subtitle">Seat Width</Label>
                                          <div className="text-sm font-medium text-primary">{item.seat_width}&quot;</div>
                                        </div>
                                        <div>
                                          <Label className="text-xs page-subtitle">Arm Height</Label>
                                          <div className="text-sm font-medium text-primary">{item.arm_height}&quot;</div>
                                        </div>
                                        <div>
                                          <Label className="text-xs page-subtitle">Back Height</Label>
                                          <div className="text-sm font-medium text-primary">{item.back_height}&quot;</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="shipping" className="mt-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <Label className="text-xs page-subtitle">Boxed Width</Label>
                                  <div className="text-sm font-medium text-primary">{item.boxed_width}&quot;</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Boxed Depth</Label>
                                  <div className="text-sm font-medium text-primary">{item.boxed_depth}&quot;</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Boxed Height</Label>
                                  <div className="text-sm font-medium text-primary">{item.boxed_height}&quot;</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Weight</Label>
                                  <div className="text-sm font-medium text-primary">{item.weight_lbs} lbs</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Number of Boxes</Label>
                                  <div className="text-sm font-medium text-primary">{item.num_boxes}</div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Assembly Required</Label>
                                  <div className="text-sm font-medium text-primary">
                                    {item.assembly_required ? "Yes" : "No"}
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="materials" className="mt-4">
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-xs page-subtitle">Primary Material</Label>
                                  <div className="text-sm font-medium text-primary">{item.primary_material}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs page-subtitle">Secondary Materials</Label>
                                    <div className="text-sm">
                                      {item.secondary_materials && Array.isArray(item.secondary_materials) && item.secondary_materials.length > 0 ? (
                                        item.secondary_materials.map((material: string, index: number) => (
                                          <Badge key={index} variant="outline" className="mr-1 mb-1">
                                            {material}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-tertiary">No secondary materials specified</span>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs page-subtitle">Available Finishes</Label>
                                    <div className="text-sm">
                                      {item.available_finishes && Array.isArray(item.available_finishes) && item.available_finishes.length > 0 ? (
                                        item.available_finishes.map((finish: string, index: number) => (
                                          <Badge key={index} variant="outline" className="mr-1 mb-1">
                                            {finish}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-tertiary">No finishes specified</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="images" className="mt-4">
                              <CatalogImageManager itemId={item.id} />
                            </TabsContent>

                            <TabsContent value="variations" className="mt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs page-subtitle">Size Variants</Label>
                                  <div className="text-sm">
                                    {item.size_variants && Array.isArray(item.size_variants) && item.size_variants.length > 0 ? (
                                      item.size_variants.map((variant: string, index: number) => (
                                        <Badge key={index} variant="outline" className="mr-1 mb-1">
                                          {variant}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-tertiary">No size variants specified</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs page-subtitle">Configuration Options</Label>
                                  <div className="text-sm">
                                    {item.configuration_options && Array.isArray(item.configuration_options) && item.configuration_options.length > 0 ? (
                                      item.configuration_options.map((option: string, index: number) => (
                                        <Badge key={index} variant="outline" className="mr-1 mb-1">
                                          {option}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-tertiary">No configuration options specified</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="mt-12 text-center">
          <Package className="mx-auto h-12 w-12 text-secondary" />
          <h3 className="mt-4 text-lg font-medium text-primary">No production-ready items found</h3>
          <p className="mt-2 page-subtitle">
            {searchTerm || selectedCollection !== "all"
              ? "Try adjusting your search criteria."
              : "No production-ready catalog items have been created yet."
            }
          </p>
        </div>
      )}

      {/* Item Dialog */}
      <ItemDialog
        item={editingItem}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingItem(undefined);
        }}
        onSave={handleSaveItem}
      />
    </div>
  );
}