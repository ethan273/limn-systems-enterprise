"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { DimensionDisplay } from "@/components/furniture/DimensionDisplay";
import type { FurnitureType } from "@/lib/utils/dimension-validation";

interface Collection {
  id: string;
  name: string;
  description?: string;
}

interface Item {
  id: string;
  name: string;
  sku_base: string;  // Base product SKU from catalog
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
  sku_base: string;
  collection_id: string;
  description: string;
  type: 'Concept' | 'Prototype' | 'Production Ready';
  furniture_type: 'chair' | 'bench' | 'table' | 'sofa/loveseat' | 'sectional' | 'lounge' | 'chaise_lounge' | 'ottoman';
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

  // Detail dimensions
  clearance_height: number;
  cushion_thickness: number;
  table_top_thickness: number;
  shelf_heights: string; // JSON string

  // Shipping dimensions
  boxed_width: number;
  boxed_depth: number;
  boxed_height: number;
  weight_lbs: number;
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
  wood_type: string;
  wood_finish: string;
  metal_type: string;
  metal_finish: string;
  metal_color: string;
  stone_type: string;
  stone_finish: string;
  weaving_material: string;
  weaving_pattern: string;
  weaving_color: string;
  carving_style: string;
  carving_pattern: string;

  // Images
  primary_image_url: string;
  gallery_images: string; // JSON string
  technical_drawings: string; // JSON string

  // Variations
  size_variants: string; // JSON string
  configuration_options: string; // JSON string
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

  const [formData, setFormData] = useState<ItemFormData>({
    // Basic Information
    name: item?.name || "",
    sku_base: item?.sku_base || "",
    collection_id: item?.collection_id || "",
    description: item?.description || "",
    type: item?.type || 'Prototype',
    furniture_type: item?.furniture_type || 'chair',
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

    // Detail dimensions
    clearance_height: item?.clearance_height || 0,
    cushion_thickness: item?.cushion_thickness || 0,
    table_top_thickness: item?.table_top_thickness || 0,
    shelf_heights: JSON.stringify(item?.shelf_heights || []),

    // Shipping dimensions
    boxed_width: item?.boxed_width || 0,
    boxed_depth: item?.boxed_depth || 0,
    boxed_height: item?.boxed_height || 0,
    weight_lbs: item?.weight_lbs || 0,
    num_boxes: item?.num_boxes || 1,
    assembly_required: item?.assembly_required ?? false,

    // Storage dimensions
    interior_width: item?.interior_width || 0,
    interior_depth: item?.interior_depth || 0,
    interior_height: item?.interior_height || 0,
    drawer_dimensions: JSON.stringify(item?.drawer_dimensions || {}),

    // Materials and options (matching Order Form structure)
    fabric_brand: item?.fabric_brand || "",
    fabric_collection: item?.fabric_collection || "",
    fabric_color: item?.fabric_color || "",
    wood_type: item?.wood_type || "",
    wood_finish: item?.wood_finish || "",
    metal_type: item?.metal_type || "",
    metal_finish: item?.metal_finish || "",
    metal_color: item?.metal_color || "",
    stone_type: item?.stone_type || "",
    stone_finish: item?.stone_finish || "",
    weaving_material: item?.weaving_material || "",
    weaving_pattern: item?.weaving_pattern || "",
    weaving_color: item?.weaving_color || "",
    carving_style: item?.carving_style || "",
    carving_pattern: item?.carving_pattern || "",

    // Images
    primary_image_url: item?.primary_image_url || "",
    gallery_images: JSON.stringify(item?.gallery_images || []),
    technical_drawings: JSON.stringify(item?.technical_drawings || []),

    // Variations
    size_variants: JSON.stringify(item?.size_variants || []),
    configuration_options: JSON.stringify(item?.configuration_options || []),
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? `Edit ${item.name}` : "Add New Prototype"}
          </DialogTitle>
          <DialogDescription>
            {item ? "Update prototype details" : "Create a new prototype item"}
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
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="variations">Variations</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Prototype name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="sku_base">Base SKU *</Label>
                  <Input
                    id="sku_base"
                    value={formData.sku_base}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku_base: e.target.value }))}
                    placeholder="PROTOTYPE-SKU-001"
                    required
                  />
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
                  placeholder="Describe this prototype..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Include all other tabs - simplified for prototype stage */}
            <TabsContent value="dimensions" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Overall Dimensions</h3>
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

                {/* Chair/Sofa Seating Dimensions - For furniture with backs and arms */}
                {['chair', 'sofa/loveseat', 'sectional', 'lounge', 'chaise_lounge'].includes(formData.furniture_type) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Seating Dimensions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                        <Label htmlFor="back_height">Back Height</Label>
                        <Input
                          id="back_height"
                          type="number"
                          step="0.1"
                          value={formData.back_height}
                          onChange={(e) => setFormData(prev => ({ ...prev, back_height: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bench Dimensions - For benches (no arms, may or may not have back) */}
                {formData.furniture_type === 'bench' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Bench Dimensions</h3>
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
                        <Label htmlFor="back_height">Back Height (optional)</Label>
                        <Input
                          id="back_height"
                          type="number"
                          step="0.1"
                          value={formData.back_height}
                          onChange={(e) => setFormData(prev => ({ ...prev, back_height: parseFloat(e.target.value) || 0 }))}
                          placeholder="Leave empty if no back"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Ottoman Dimensions - For ottomans (no arms, no back) */}
                {formData.furniture_type === 'ottoman' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Ottoman Dimensions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="seat_height">Surface Height</Label>
                        <Input
                          id="seat_height"
                          type="number"
                          step="0.1"
                          value={formData.seat_height}
                          onChange={(e) => setFormData(prev => ({ ...prev, seat_height: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="seat_depth">Surface Depth</Label>
                        <Input
                          id="seat_depth"
                          type="number"
                          step="0.1"
                          value={formData.seat_depth}
                          onChange={(e) => setFormData(prev => ({ ...prev, seat_depth: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="seat_width">Surface Width</Label>
                        <Input
                          id="seat_width"
                          type="number"
                          step="0.1"
                          value={formData.seat_width}
                          onChange={(e) => setFormData(prev => ({ ...prev, seat_width: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Table Dimensions - For tables */}
                {formData.furniture_type === 'table' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Table Dimensions</h3>
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
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Prototype Stock</h3>
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
                      <Label htmlFor="unit_cost">Production Cost</Label>
                      <Input
                        id="unit_cost"
                        type="number"
                        step="0.01"
                        value={formData.unit_cost}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Shipping & Packaging</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      value={formData.wood_type}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        wood_type: value,
                        wood_finish: "" // Reset finish when type changes
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select wood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {woodMaterials.filter((m: any) => m.hierarchy_level === 1).map((wood: any) => (
                          <SelectItem key={wood.id} value={wood.name}>
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
                      disabled={!formData.wood_type}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.wood_type ? "Select wood finish" : "Select wood type first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {woodMaterials.filter((m: any) => m.hierarchy_level === 2).map((finish: any) => (
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
                      value={formData.metal_type}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        metal_type: value,
                        metal_finish: "", // Reset finish when type changes
                        metal_color: "" // Reset color when type changes
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select metal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {metalMaterials.filter((m: any) => m.hierarchy_level === 1).map((metal: any) => (
                          <SelectItem key={metal.id} value={metal.name}>
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
                      disabled={!formData.metal_type}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.metal_type ? "Select metal finish" : "Select metal type first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {metalMaterials.filter((m: any) => m.hierarchy_level === 2).map((finish: any) => (
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
                      value={formData.stone_type}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        stone_type: value,
                        stone_finish: "" // Reset finish when type changes
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stone type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {stoneMaterials.filter((m: any) => m.hierarchy_level === 1).map((stone: any) => (
                          <SelectItem key={stone.id} value={stone.name}>
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
                      disabled={!formData.stone_type}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.stone_type ? "Select stone finish" : "Select stone type first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {stoneMaterials.filter((m: any) => m.hierarchy_level === 2).map((finish: any) => (
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
              <div className="space-y-4">
                <div>
                  <Label htmlFor="primary_image_url">Primary Image URL</Label>
                  <Input
                    id="primary_image_url"
                    value={formData.primary_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_image_url: e.target.value }))}
                    placeholder="https://example.com/prototype-image.jpg"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="variations" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="size_variants">Size Variants</Label>
                  <Textarea
                    id="size_variants"
                    value={formData.size_variants}
                    onChange={(e) => setFormData(prev => ({ ...prev, size_variants: e.target.value }))}
                    placeholder='Enter size variants separated by commas (e.g., Small, Medium, Large)'
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <h4 className="text-sm font-semibold mb-3 text-gray-200">Product Development Timeline</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Track the journey from concept to production-ready item
                  </p>

                  {item ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-200">Current Stage</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              item.type === 'Concept' ? 'bg-blue-600 text-blue-100' :
                              item.type === 'Prototype' ? 'bg-orange-600 text-orange-100' :
                              'bg-green-600 text-green-100'
                            }`}>
                              {item.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {item.type === 'Concept' && 'Initial design phase - no materials selected yet'}
                            {item.type === 'Prototype' && 'Testing phase - materials selected for prototyping'}
                            {item.type === 'Production Ready' && 'Vetted and approved for customer orders'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-gray-600"></div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-200">Created</span>
                          <p className="text-xs text-gray-400 mt-1">
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
                          <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-gray-600"></div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-200">Last Updated</span>
                            <p className="text-xs text-gray-400 mt-1">
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

                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-xs text-gray-500">
                          Future enhancement: Detailed status change history will be tracked here (Concept → Prototype → Production Ready transitions with dates and users)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-400">
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
              {item ? "Update Prototype" : "Create Prototype"}
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
        <div className="text-gray-400">Loading dimensions...</div>
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

export default function PrototypesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: collections } = api.products.getAllCollections.useQuery();

  // Get real data from API
  const { data: itemsData, isLoading: itemsLoading, error: itemsError, refetch: refetchItems } = api.items.getAll.useQuery({
    limit: 100,
    offset: 0,
  });

  const items = itemsData?.items || [];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku_base.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCollection = selectedCollection === "all" || item.collection_id === selectedCollection;

    // Only show Prototype items on this page
    const isPrototype = item.type === "Prototype";

    return matchesSearch && matchesCollection && isPrototype;
  });

  const handleSaveItem = (data: ItemFormData) => {
    // TODO: Implement API call to save item
    console.log('Saving prototype:', data);
    toast({
      title: editingItem ? "Prototype updated" : "Prototype created",
      description: `${data.name} has been ${editingItem ? 'updated' : 'created'} successfully.`,
    });
    setEditingItem(undefined);
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
    console.log('Deleting prototype:', item.id);
    toast({
      title: "Prototype deleted",
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

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-100">Prototypes</h1>
          <p className="text-gray-400 mt-1">
            Manage working prototypes and beta testing products
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => {
            setEditingItem(undefined);
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Prototype
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center filters-section">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search prototypes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-gray-800 border-gray-600 text-gray-100"
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

        <div className="text-sm text-gray-400">
          {filteredItems.length} prototypes
        </div>
      </div>

      {/* Loading State */}
      {itemsLoading && (
        <Card className="bg-gray-900 border-gray-700">
          <div className="p-6 text-center">
            <div className="text-gray-400">Loading prototypes...</div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {itemsError && (
        <Card className="bg-gray-900 border-gray-700">
          <div className="p-6 text-center">
            <div className="text-red-400">Error loading prototypes: {itemsError.message}</div>
            <Button
              variant="outline"
              onClick={() => refetchItems()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Items Table */}
      {!itemsLoading && !itemsError && (
        <Card className="bg-gray-900 border-gray-700">
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prototype Name</TableHead>
                  <TableHead>Base SKU</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead>Furniture Type</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                <React.Fragment key={item.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-gray-800/50"
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
                            <div className="text-sm text-gray-400 max-w-xs truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{item.sku}</span>
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
                        <span className="text-gray-500 text-sm">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-orange-900 text-orange-200 border-orange-700">
                        Prototype
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.is_active ? "default" : "secondary"}
                        className={item.is_active ? "bg-green-600 text-green-100" : "bg-gray-600 text-gray-300"}
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
                      <TableCell colSpan={8} className="p-0">
                        <div className="p-6 bg-gray-800/30 border-t border-gray-700">
                          <Tabs defaultValue="testing" className="w-full">
                            <TabsList className="grid w-full grid-cols-7">
                              <TabsTrigger value="testing">Testing Data</TabsTrigger>
                              <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
                              <TabsTrigger value="inventory">Inventory</TabsTrigger>
                              <TabsTrigger value="materials">Materials</TabsTrigger>
                              <TabsTrigger value="images">Images</TabsTrigger>
                              <TabsTrigger value="variations">Variations</TabsTrigger>
                              <TabsTrigger value="history">History</TabsTrigger>
                            </TabsList>

                            <TabsContent value="testing" className="mt-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <Label className="text-xs text-gray-400">Production Cost</Label>
                                  <div className="text-sm font-medium text-gray-100">${item.unit_cost ? item.unit_cost.toFixed(2) : '0.00'}</div>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-400">Target Price</Label>
                                  <div className="text-sm font-medium text-gray-100">${item.list_price ? item.list_price.toFixed(2) : '0.00'}</div>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-400">Prototypes Built</Label>
                                  <div className="text-sm font-medium text-gray-100">{item.stock_quantity}</div>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-400">Testing Status</Label>
                                  <Badge variant="outline" className="bg-orange-900 text-orange-200 border-orange-700">
                                    In Testing
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
                                    <h4 className="text-sm font-semibold mb-2 text-gray-200">Overall Dimensions ({item.dimension_units})</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <Label className="text-xs text-gray-400">Width</Label>
                                        <div className="text-sm font-medium text-gray-100">{item.width}&quot;</div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-400">Depth</Label>
                                        <div className="text-sm font-medium text-gray-100">{item.depth}&quot;</div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-400">Height</Label>
                                        <div className="text-sm font-medium text-gray-100">{item.height}&quot;</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="inventory" className="mt-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <Label className="text-xs text-gray-400">Prototypes Available</Label>
                                  <div className="text-sm font-medium text-gray-100">{item.available_quantity}</div>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-400">In Testing</Label>
                                  <div className="text-sm font-medium text-gray-100">{item.reserved_quantity}</div>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-400">Supplier</Label>
                                  <div className="text-sm font-medium text-gray-100">{item.supplier}</div>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-400">Supplier SKU</Label>
                                  <div className="text-sm font-medium font-mono text-gray-100">{item.supplier_sku}</div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="materials" className="mt-4">
                              <div className="space-y-4">
                                {/* Fabric Materials */}
                                {(item.fabric_brand || item.fabric_collection || item.fabric_color) && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-purple-400 mb-2">Fabric</h5>
                                    <div className="grid grid-cols-3 gap-4">
                                      {item.fabric_brand && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Brand</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.fabric_brand}</div>
                                        </div>
                                      )}
                                      {item.fabric_collection && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Collection</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.fabric_collection}</div>
                                        </div>
                                      )}
                                      {item.fabric_color && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Color</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.fabric_color}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Wood Materials */}
                                {(item.wood_type || item.wood_finish) && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-amber-400 mb-2">Wood</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                      {item.wood_type && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Type</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.wood_type}</div>
                                        </div>
                                      )}
                                      {item.wood_finish && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Finish</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.wood_finish}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Metal Materials */}
                                {(item.metal_type || item.metal_finish || item.metal_color) && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-slate-400 mb-2">Metal</h5>
                                    <div className="grid grid-cols-3 gap-4">
                                      {item.metal_type && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Type</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.metal_type}</div>
                                        </div>
                                      )}
                                      {item.metal_finish && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Finish</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.metal_finish}</div>
                                        </div>
                                      )}
                                      {item.metal_color && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Color</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.metal_color}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Stone Materials */}
                                {(item.stone_type || item.stone_finish) && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-stone-400 mb-2">Stone</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                      {item.stone_type && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Type</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.stone_type}</div>
                                        </div>
                                      )}
                                      {item.stone_finish && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Finish</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.stone_finish}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Weaving Materials */}
                                {(item.weaving_material || item.weaving_pattern || item.weaving_color) && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-green-400 mb-2">Weaving</h5>
                                    <div className="grid grid-cols-3 gap-4">
                                      {item.weaving_material && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Material</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.weaving_material}</div>
                                        </div>
                                      )}
                                      {item.weaving_pattern && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Pattern</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.weaving_pattern}</div>
                                        </div>
                                      )}
                                      {item.weaving_color && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Color</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.weaving_color}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Carving */}
                                {(item.carving_style || item.carving_pattern) && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-orange-400 mb-2">Carving</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                      {item.carving_style && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Style</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.carving_style}</div>
                                        </div>
                                      )}
                                      {item.carving_pattern && (
                                        <div>
                                          <Label className="text-xs text-gray-400">Pattern</Label>
                                          <div className="text-sm font-medium text-gray-100">{item.carving_pattern}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Empty State */}
                                {!item.fabric_brand && !item.fabric_collection && !item.fabric_color &&
                                 !item.wood_type && !item.wood_finish &&
                                 !item.metal_type && !item.metal_finish && !item.metal_color &&
                                 !item.stone_type && !item.stone_finish &&
                                 !item.weaving_material && !item.weaving_pattern && !item.weaving_color &&
                                 !item.carving_style && !item.carving_pattern && (
                                  <div className="text-center py-4">
                                    <p className="text-sm text-gray-400">No materials specified</p>
                                  </div>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="images" className="mt-4">
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-xs text-gray-400">Primary Image</Label>
                                  <div className="text-sm text-gray-300">{item.primary_image_url || 'No image set'}</div>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-400">Testing Photos</Label>
                                  <div className="text-sm text-gray-300">
                                    {item.gallery_images?.length ? `${item.gallery_images.length} photos` : 'No testing photos'}
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="variations" className="mt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs text-gray-400">Size Variants</Label>
                                  <div className="text-sm">
                                    {item.size_variants?.map((variant: string, index: number) => (
                                      <Badge key={index} variant="outline" className="mr-1 mb-1">
                                        {variant}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-400">Configuration Options</Label>
                                  <div className="text-sm">
                                    {item.configuration_options?.map((option: string, index: number) => (
                                      <Badge key={index} variant="outline" className="mr-1 mb-1">
                                        {option}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="history" className="mt-4">
                              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                                <h4 className="text-sm font-semibold mb-3 text-gray-200">Product Development Timeline</h4>
                                <div className="space-y-3">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-200">Current Stage</span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          item.type === 'Concept' ? 'bg-blue-600 text-blue-100' :
                                          item.type === 'Prototype' ? 'bg-orange-600 text-orange-100' :
                                          'bg-green-600 text-green-100'
                                        }`}>
                                          {item.type}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {item.type === 'Concept' && 'Initial design phase - no materials selected yet'}
                                        {item.type === 'Prototype' && 'Testing phase - materials selected for prototyping'}
                                        {item.type === 'Production Ready' && 'Vetted and approved for customer orders'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-gray-600"></div>
                                    <div className="flex-1">
                                      <span className="text-sm font-medium text-gray-200">Created</span>
                                      <p className="text-xs text-gray-400 mt-1">
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
                                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-gray-600"></div>
                                      <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-200">Last Updated</span>
                                        <p className="text-xs text-gray-400 mt-1">
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
      )}

      {/* Empty State */}
      {!itemsLoading && !itemsError && filteredItems.length === 0 && (
        <div className="mt-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-100">No prototypes found</h3>
          <p className="mt-2 text-gray-400">
            {searchTerm || selectedCollection !== "all"
              ? "Try adjusting your search criteria."
              : "No prototypes have been created yet."
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