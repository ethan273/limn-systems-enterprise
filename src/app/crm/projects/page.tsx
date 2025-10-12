"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { generateProductSku } from "@/lib/utils/product-sku-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
 Search,
 Plus,
 Package,
 MoreVertical,
 Edit,
 Trash2,
 Eye,
 Filter,
 DollarSign,
 ClipboardList,
 Target,
 CheckCircle2,
 Clock,
 AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PageHeader,
  StatsGrid,
  type StatItem,
} from "@/components/common";

interface Project {
 id: string;
 name: string;
 description?: string | null;
 client_id: string;
 client_name: string;
 client_company?: string | null;
 status: 'planning' | 'active' | 'review' | 'completed' | 'on_hold' | 'cancelled';
 priority: 'low' | 'medium' | 'high' | 'urgent';
 start_date?: Date | null;
 end_date?: Date | null;
 budget?: number | null;
 actual_cost?: number | null;
 ordered_items_count: number;
 ordered_items_value: number;
 completion_percentage: number;
 manager_id?: string | null;
 manager_name?: string | null;
 notes?: string | null;
 created_at?: Date | null;
 updated_at?: Date | null;
}

interface OrderCreationFormData {
 project_id: string;
 collection_id: string;
 furniture_collection_id: string; // NEW: Furniture collection for filtering materials
 variation_type: string;
 product_name: string;
 quantity: string;
 unit_price: string;
 fabric_brand_id: string; // Changed to ID-based
 fabric_collection_id: string; // Changed to ID-based
 fabric_color_id: string; // Changed to ID-based
 wood_type_id: string; // Changed to ID-based
 wood_finish_id: string; // Changed to ID-based
 metal_type_id: string; // Changed to ID-based
 metal_finish_id: string; // Changed to ID-based
 metal_color_id: string; // Changed to ID-based
 stone_type_id: string; // Changed to ID-based
 stone_finish_id: string; // Changed to ID-based
 weaving_material_id: string; // Changed to ID-based
 weaving_pattern_id: string; // Changed to ID-based
 weaving_color_id: string; // Changed to ID-based
 carving_style_id: string; // Changed to ID-based
 carving_pattern_id: string; // Changed to ID-based
 custom_specifications: string;
 estimated_delivery: string;
 notes: string;
}

// SKU generation now handled by utility functions:
// - generateProductSku() from @/lib/utils/product-sku-generator
// - generateProjectSku() from @/lib/utils/project-sku-generator

interface ProjectFormData {
 name: string;
 description: string;
 client_id: string;
 status: string;
 priority: string;
 start_date: string;
 end_date: string;
 budget: string;
 manager_id: string;
 notes: string;
}

function OrderCreationDialog({
 projectId,
 isOpen,
 onClose,
 _onSave,
 orderItems,
 setOrderItems,
 onFinalizeOrder,
}: {
 projectId: string;
 isOpen: boolean;
 onClose: () => void;
 _onSave: (_data: OrderCreationFormData) => void;
 orderItems: Array<{
 id: string;
 product_name: string;
 product_sku: string; // Manufacturing/catalog SKU
 project_sku: string; // Client/project tracking SKU
 base_sku: string; // Original catalog base SKU
 quantity: number;
 unit_price: number;
 total_price: number;
 material_selections: Record<string, string>;
 custom_specifications?: string;
 }>;
 setOrderItems: React.Dispatch<React.SetStateAction<Array<{
 id: string;
 product_name: string;
 product_sku: string; // Manufacturing/catalog SKU
 project_sku: string; // Client/project tracking SKU
 base_sku: string; // Original catalog base SKU
 quantity: number;
 unit_price: number;
 total_price: number;
 material_selections: Record<string, string>;
 custom_specifications?: string;
 }>>>;
 onFinalizeOrder: (_projectId: string) => Promise<void>;
}) {
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
 // If item has a specific variation type, filter the available types
 // Otherwise return all available types for the collection
 return availableVariationTypes;
 };


 // Get furniture collections for filtering
 const { data: furnitureCollections } = api.products.getAllCollections.useQuery();

 // Get materials filtered by furniture collection (hierarchical, uses parent_material_id)
 const { data: filteredMaterials } = api.products.getMaterialsByCollection.useQuery(
 { collectionId: formData.furniture_collection_id },
 { enabled: !!formData.furniture_collection_id }
 );

 // Get ALL materials if no furniture collection selected (fallback)
 const { data: allMaterials } = api.products.getAllMaterials.useQuery(
 undefined,
 { enabled: !formData.furniture_collection_id }
 );

 // Use filtered materials when furniture collection selected, otherwise all materials
 const availableMaterials = formData.furniture_collection_id ? filteredMaterials : allMaterials;

 // Filter by material category and hierarchy level
 const fabricBrands = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('fabric') && m.hierarchy_level === 1
 ) || [];

 const fabricCollections = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('fabric') &&
 m.hierarchy_level === 2 &&
 (!formData.fabric_brand_id || m.parent_material_id === formData.fabric_brand_id)
 ) || [];

 const fabricColors = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('fabric') &&
 m.hierarchy_level === 3 &&
 (!formData.fabric_collection_id || m.parent_material_id === formData.fabric_collection_id)
 ) || [];

 const woodTypes = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('wood') && m.hierarchy_level === 1
 ) || [];

 const woodFinishes = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('wood') &&
 m.hierarchy_level === 2 &&
 (!formData.wood_type_id || m.parent_material_id === formData.wood_type_id)
 ) || [];

 const metalTypes = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('metal') && m.hierarchy_level === 1
 ) || [];

 const metalFinishes = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('metal') &&
 m.hierarchy_level === 2 &&
 (!formData.metal_type_id || m.parent_material_id === formData.metal_type_id)
 ) || [];

 const metalColors = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('metal') &&
 m.hierarchy_level === 3 &&
 (!formData.metal_finish_id || m.parent_material_id === formData.metal_finish_id)
 ) || [];

 const stoneTypes = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('stone') && m.hierarchy_level === 1
 ) || [];

 const stoneFinishes = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('stone') &&
 m.hierarchy_level === 2 &&
 (!formData.stone_type_id || m.parent_material_id === formData.stone_type_id)
 ) || [];

 const weavingMaterials = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('weaving') && m.hierarchy_level === 1
 ) || [];

 const weavingPatterns = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('weaving') && m.hierarchy_level === 2
 ) || [];

 const weavingColors = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('weaving') && m.hierarchy_level === 3
 ) || [];

 const carvingStyles = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('carving') && m.hierarchy_level === 1
 ) || [];

 const carvingPatterns = availableMaterials?.filter((m: any) =>
 m.material_categories?.name?.toLowerCase().includes('carving') && m.hierarchy_level === 2
 ) || [];


 // Check if basic order info is complete
 const isBasicOrderComplete = formData.collection_id && selectedItem;

 const handleSave = async () => {
 if (!formData.product_name.trim()) {
 toast({
 title: "Validation Error",
 description: "Product name is required.",
 variant: "destructive",
 });
 return;
 }

 if (!formData.collection_id) {
 toast({
 title: "Validation Error",
 description: "Collection selection is required.",
 variant: "destructive",
 });
 return;
 }

 if (!formData.quantity || parseInt(formData.quantity) <= 0) {
 toast({
 title: "Validation Error",
 description: "Valid quantity is required.",
 variant: "destructive",
 });
 return;
 }

 if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
 toast({
 title: "Validation Error",
 description: "Valid unit price is required.",
 variant: "destructive",
 });
 return;
 }

 // Get collection info for SKU generation (this is the Order Item Creation dialog)
 // For simplicity, using a placeholder collection - this should be connected to actual collections
 const collectionPrefix = 'XX'; // Placeholder - should get from collection selection

 // Get material names from IDs for SKU generation
 const getMaterialName = (materialId: string) => {
 if (!materialId) return '';
 const material = availableMaterials?.find((m: any) => m.id === materialId);
 return (material as any)?.name || '';
 };

 // Prepare material selections for SKU (using names)
 const materialSelections = {
 fabric_brand: getMaterialName(formData.fabric_brand_id),
 fabric_collection: getMaterialName(formData.fabric_collection_id),
 fabric_color: getMaterialName(formData.fabric_color_id),
 wood_type: getMaterialName(formData.wood_type_id),
 wood_finish: getMaterialName(formData.wood_finish_id),
 metal_type: getMaterialName(formData.metal_type_id),
 metal_finish: getMaterialName(formData.metal_finish_id),
 metal_color: getMaterialName(formData.metal_color_id),
 stone_type: getMaterialName(formData.stone_type_id),
 stone_finish: getMaterialName(formData.stone_finish_id),
 weaving_material: getMaterialName(formData.weaving_material_id),
 weaving_pattern: getMaterialName(formData.weaving_pattern_id),
 weaving_color: getMaterialName(formData.weaving_color_id),
 carving_style: getMaterialName(formData.carving_style_id),
 carving_pattern: getMaterialName(formData.carving_pattern_id),
 };

 // Generate base SKU (using catalog system: PREFIX-ITEM-VERSION)
 const itemCode = formData.product_name.substring(0, 3).toUpperCase();
 const version = String(orderItems.length + 1).padStart(3, '0');
 const baseSKU = `${collectionPrefix}-${itemCode}-${version}`;

 // Generate hierarchical product SKU using utility function
 const productSKU = generateProductSku(baseSKU, materialSelections);

 // Generate project tracking SKU (temporary - will be generated on server when order is saved)
 const projectSKU = `TEMP-${Date.now()}`;

 // Create new order item with dual SKUs
 const newOrderItem = {
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
 // Reset material selections when collection changes
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
 variation_type: "", // Reset variation type when item changes
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

 {/* Furniture Collection Selector */}
 <div className="space-y-2 border-b pb-4">
 <Label htmlFor="furniture_collection_id">Filter by Furniture Collection (Optional)</Label>
 <Select
 value={formData.furniture_collection_id || "all"}
 onValueChange={(value) => setFormData({
 ...formData,
 furniture_collection_id: value === "all" ? "" : value,
 // Reset all material selections when furniture collection changes
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
 })}
 >
 <SelectTrigger>
 <SelectValue placeholder="All furniture collections" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Collections (No Filter)</SelectItem>
 {furnitureCollections?.map((fc: any) => (
 <SelectItem key={fc.id} value={fc.id}>
 {fc.name} {fc.prefix ? `(${fc.prefix})` : ''}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 {formData.furniture_collection_id && (
 <p className="text-xs text-muted-foreground">
 Materials filtered to: {(furnitureCollections?.find((fc: any) => fc.id === formData.furniture_collection_id) as any)?.name}
 </p>
 )}
 {!formData.furniture_collection_id && (
 <p className="text-xs text-muted-foreground">
 Showing all available materials from all collections
 </p>
 )}
 </div>

 {/* Fabric Materials */}
 <div className="space-y-3">
 <h4 className="font-medium text-secondary dark:text-secondary">Fabric Materials (Hierarchical: Brand → Collection → Color)</h4>
 <div className="grid grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label htmlFor="fabric_brand_id">Fabric Brand</Label>
 <Select
 value={formData.fabric_brand_id || "none"}
 onValueChange={(value) => setFormData({
 ...formData,
 fabric_brand_id: value === "none" ? "" : value,
 fabric_collection_id: "", // Reset children
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
 <div className="space-y-3">
 <h4 className="font-medium text-muted dark:text-muted">Wood Materials (Hierarchical: Type → Finish)</h4>
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
 <div className="space-y-3">
 <h4 className="font-medium">Metal Materials (Hierarchical: Type → Finish → Color)</h4>
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
 <div className="space-y-3">
 <h4 className="font-medium text-muted dark:text-muted">Stone Materials (Hierarchical: Type → Finish)</h4>
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
 <div className="space-y-3">
 <h4 className="font-medium text-success dark:text-success">Weaving Materials (Independent selection: Material, Pattern, Color)</h4>
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
 <div className="space-y-3">
 <h4 className="font-medium text-warning dark:text-warning">Carving (Independent selection: Style, Pattern)</h4>
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
 {Object.entries(item.material_selections).some(([_, value]) => value) && (
 <div className="text-xs space-y-1 border-t pt-2">
 <p className="text-muted-foreground font-medium">Materials:</p>
 {Object.entries(item.material_selections)
 .filter(([_, value]) => value && value.trim())
 .map(([key, value]) => (
 <div key={key} className="flex justify-between">
 <span className="text-muted-foreground">
 {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
 </span>
 <span className="truncate ml-1">{value}</span>
 </div>
 ))}
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
 <Button onClick={handleSave}>
 Add Item to Order
 </Button>
 {orderItems.length > 0 && (
 <Button
 onClick={() => onFinalizeOrder(projectId)}
 className="bg-success-muted hover:bg-success-muted"
 >
 Finalize Order (${orderItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)})
 </Button>
 )}
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}

function ProjectDialog({
 project,
 isOpen,
 onClose,
 onSave,
}: {
 project?: Project;
 isOpen: boolean;
 onClose: () => void;
 onSave: (_data: ProjectFormData) => void;
}) {
 const [formData, setFormData] = useState<ProjectFormData>({
 name: project?.name || "",
 description: project?.description || "",
 client_id: project?.client_id || "",
 status: project?.status || "planning",
 priority: project?.priority || "medium",
 start_date: project?.start_date ? project.start_date.toISOString().split('T')[0] : "",
 end_date: project?.end_date ? project.end_date.toISOString().split('T')[0] : "",
 budget: project?.budget?.toString() || "",
 manager_id: project?.manager_id || "",
 notes: project?.notes || "",
 });

 const { data: customers } = api.crm.customers.getAll.useQuery({
 limit: 100,
 offset: 0,
 });

 const handleSave = () => {
 if (!formData.name.trim()) {
 toast({
 title: "Validation Error",
 description: "Project name is required.",
 variant: "destructive",
 });
 return;
 }

 if (!formData.client_id) {
 toast({
 title: "Validation Error",
 description: "Client selection is required.",
 variant: "destructive",
 });
 return;
 }

 onSave(formData);
 };

 const statuses = [
 { value: "planning", label: "Planning" },
 { value: "active", label: "Active" },
 { value: "review", label: "Review" },
 { value: "completed", label: "Completed" },
 { value: "on_hold", label: "On Hold" },
 { value: "cancelled", label: "Cancelled" },
 ];

 const priorities = [
 { value: "low", label: "Low" },
 { value: "medium", label: "Medium" },
 { value: "high", label: "High" },
 { value: "urgent", label: "Urgent" },
 ];

 return (
 <Dialog open={isOpen} onOpenChange={onClose}>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>
 {project ? "Edit Project" : "Create New Project"}
 </DialogTitle>
 <DialogDescription>
 {project
 ? "Update project information and timeline."
 : "Create a new project and assign it to a client."}
 </DialogDescription>
 </DialogHeader>

 <div className="grid gap-4 py-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="name">Project Name *</Label>
 <Input
 id="name"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 placeholder="Enter project name"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="client_id">Client *</Label>
 <Select
 value={formData.client_id}
 onValueChange={(value) => setFormData({ ...formData, client_id: value })}
 >
 <SelectTrigger>
 <SelectValue placeholder="Select client" />
 </SelectTrigger>
 <SelectContent>
 {customers?.items?.map((customer) => (
 <SelectItem key={customer.id} value={customer.id}>
 {customer.name} {customer.company ? `(${customer.company})` : ""}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="description">Description</Label>
 <Textarea
 id="description"
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 placeholder="Project description"
 rows={3}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="status">Status</Label>
 <Select
 value={formData.status}
 onValueChange={(value) => setFormData({ ...formData, status: value })}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {statuses.map((status) => (
 <SelectItem key={status.value} value={status.value}>
 {status.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="priority">Priority</Label>
 <Select
 value={formData.priority}
 onValueChange={(value) => setFormData({ ...formData, priority: value })}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {priorities.map((priority) => (
 <SelectItem key={priority.value} value={priority.value}>
 {priority.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="start_date">Start Date</Label>
 <Input
 id="start_date"
 type="date"
 value={formData.start_date}
 onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="end_date">End Date</Label>
 <Input
 id="end_date"
 type="date"
 value={formData.end_date}
 onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="budget">Budget ($)</Label>
 <Input
 id="budget"
 type="number"
 step="0.01"
 value={formData.budget}
 onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
 placeholder="0.00"
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Textarea
 id="notes"
 value={formData.notes}
 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
 placeholder="Additional notes"
 rows={3}
 />
 </div>
 </div>

 <DialogFooter>
 <Button variant="outline" onClick={onClose}>
 Cancel
 </Button>
 <Button onClick={handleSave}>
 {project ? "Update Project" : "Create Project"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}

export default function ProjectsPage() {
 const router = useRouter();
 const [searchTerm, setSearchTerm] = useState("");
 const [selectedStatus, setSelectedStatus] = useState("");
 const [selectedPriority, setSelectedPriority] = useState("");
 const [selectedProject, setSelectedProject] = useState<Project | undefined>();
 const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
 const [orderCreationProjectId, setOrderCreationProjectId] = useState<string>("");
 const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

 // Query all materials at parent level for SKU generation in handleSaveOrder
 const { data: allMaterialsForSKU } = api.products.getAllMaterials.useQuery();

 // State for tracking order items across dialog sessions
 const [orderItems, setOrderItems] = useState<Array<{
 id: string;
 product_name: string;
 product_sku: string; // Hierarchical material SKU for manufacturing
 project_sku: string; // Client/project tracking SKU
 base_sku: string; // Original catalog SKU
 quantity: number;
 unit_price: number;
 total_price: number;
 material_selections: Record<string, string>;
 custom_specifications?: string;
 }>>([]);

 // Get projects from API
 const { data: projectsData } = api.projects.getAll.useQuery({
 limit: 100,
 offset: 0,
 });

 const projects = projectsData?.items || [];

 // Get collections and customers for SKU generation
 const { data: collections } = api.products.getAllCollections.useQuery();
 const { data: customersData } = api.crm.customers.getAll.useQuery({
 limit: 100,
 offset: 0,
 });
 const _customers = customersData?.items || [];

 const filteredProjects = projects.filter((project: any) => {
 const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (project.customers?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
 (project.customers?.company || '').toLowerCase().includes(searchTerm.toLowerCase());

 const matchesStatus = !selectedStatus || selectedStatus === "all" || project.status === selectedStatus;
 const matchesPriority = !selectedPriority || selectedPriority === "all" || project.priority === selectedPriority;

 return matchesSearch && matchesStatus && matchesPriority;
 });

 const statuses = [
 { value: "planning", label: "Planning", color: "btn-primary text-info dark:btn-primary dark:text-info", icon: Target },
 { value: "active", label: "Active", color: "bg-warning-muted text-warning dark:bg-warning-muted dark:text-warning", icon: Clock },
 { value: "review", label: "Review", color: "btn-secondary text-secondary dark:btn-secondary dark:text-secondary", icon: Eye },
 { value: "completed", label: "Completed", color: "bg-success-muted text-success dark:bg-success-muted dark:text-success", icon: CheckCircle2 },
 { value: "on_hold", label: "On Hold", color: "bg-orange-100 text-warning dark:bg-orange-900 dark:text-warning", icon: AlertCircle },
 { value: "cancelled", label: "Cancelled", color: "bg-destructive-muted text-destructive dark:bg-destructive-muted dark:text-destructive", icon: AlertCircle },
 ];

 const priorities = [
 { value: "low", label: "Low", color: "badge-neutral" },
 { value: "medium", label: "Medium", color: "btn-primary text-info dark:btn-primary dark:text-info" },
 { value: "high", label: "High", color: "bg-orange-100 text-warning dark:bg-orange-900 dark:text-warning" },
 { value: "urgent", label: "Urgent", color: "bg-destructive-muted text-destructive dark:bg-destructive-muted dark:text-destructive" },
 ];

 const getStatusInfo = (status: string) => {
 return statuses.find(s => s.value === status) || statuses[0];
 };

 const getPriorityColor = (priority: string) => {
 return priorities.find(p => p.value === priority)?.color || "badge-neutral";
 };

 const handleCreateProject = () => {
 setSelectedProject(undefined);
 setIsProjectDialogOpen(true);
 };

 const handleEditProject = (project: Project) => {
 setSelectedProject(project);
 setIsProjectDialogOpen(true);
 };

 const createProjectMutation = api.projects.create.useMutation();
 const updateProjectMutation = api.projects.update.useMutation();
 const createCRMOrderMutation = api.orders.createWithItems.useMutation();
 const createProductionOrderMutation = api.productionOrders.create.useMutation();
 const createInvoiceForOrderMutation = api.productionInvoices.createForOrder.useMutation();
 const { refetch: refetchProjects } = api.projects.getAll.useQuery({ limit: 100, offset: 0 });

 const handleSaveProject = async (data: ProjectFormData) => {
 try {
 const projectData = {
 name: data.name,
 customer_id: data.client_id || undefined, // Map client_id to customer_id for API, convert empty string to undefined
 description: data.description || undefined,
 status: data.status as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
 priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
 start_date: data.start_date ? new Date(data.start_date) : undefined,
 end_date: data.end_date ? new Date(data.end_date) : undefined,
 budget: data.budget ? parseFloat(data.budget) : undefined,
 };

 if (selectedProject) {
 await updateProjectMutation.mutateAsync({
 id: selectedProject.id,
 ...projectData,
 });
 } else {
 await createProjectMutation.mutateAsync(projectData);
 }

 toast({
 title: selectedProject ? "Project Updated" : "Project Created",
 description: `${data.name} has been ${selectedProject ? "updated" : "created"} successfully.`,
 });

 setIsProjectDialogOpen(false);
 await refetchProjects();
 } catch (error) {
 toast({
 title: "Error",
 description: `Failed to ${selectedProject ? "update" : "create"} project. Please try again.`,
 variant: "destructive",
 });
 }
 };

 const handleCreateOrder = (projectId: string) => {
 setOrderCreationProjectId(projectId);
 setIsOrderDialogOpen(true);
 };

 const handleFinalizeOrder = async (projectId: string) => {
 if (orderItems.length === 0) {
 toast({
 title: "Error",
 description: "No items in order to finalize.",
 variant: "destructive",
 });
 return;
 }

 try {
 // Find the project to get customer_id
 const project = projects.find((p: any) => p.id === projectId);
 if (!project) {
 toast({
 title: "Error",
 description: "Project not found.",
 variant: "destructive",
 });
 return;
 }

 // STEP 1: Create CRM Order with all items
 const crmOrderResult = await createCRMOrderMutation.mutateAsync({
 project_id: projectId,
 customer_id: project.customer_id,
 collection_id: orderItems[0]?.base_sku ? undefined : undefined,
 order_items: orderItems.map(item => ({
 product_name: item.product_name,
 product_sku: item.product_sku,
 project_sku: item.project_sku,
 base_sku: item.base_sku,
 quantity: item.quantity,
 unit_price: item.unit_price,
 total_price: item.total_price,
 material_selections: item.material_selections,
 custom_specifications: item.custom_specifications,
 })),
 notes: `Order created from project: ${project.name}`,
 priority: 'normal',
 });

 const crmOrderId = crmOrderResult.order.id;
 const crmOrderNumber = crmOrderResult.order.order_number;

 // STEP 2: Create production orders (one per order item) - all linked to CRM order
 const createdProductionOrders = [];
 let totalCost = 0;

 for (const item of orderItems) {
 // Determine product type from base SKU prefix
 // If base_sku starts with collection prefix (e.g., "XX-"), it's a catalog item
 // Otherwise, it's a custom item
 const isCustomItem = !item.base_sku || item.base_sku.startsWith('TEMP-') || item.base_sku.startsWith('CUSTOM-');
 const productType = isCustomItem ? 'custom' : 'catalog';

 // Try to find catalog item ID by matching base_sku
 let catalogItemId: string | undefined;
 if (!isCustomItem) {
 // Query catalog items via tRPC to find matching SKU
 // Note: This would require adding a catalog item lookup by SKU to tRPC API
 // For now, we'll leave as undefined and handle in production order detail view
 catalogItemId = undefined;
 }

 const result = await createProductionOrderMutation.mutateAsync({
 order_id: crmOrderId, // CRITICAL: Links back to CRM order for grouping/shipping
 project_id: projectId,
 product_type: productType,
 catalog_item_id: catalogItemId,
 item_name: item.product_name,
 item_description: `${item.project_sku} - ${item.custom_specifications || ''}`,
 quantity: item.quantity,
 unit_price: item.unit_price,
 estimated_ship_date: undefined,
 factory_id: undefined,
 factory_notes: undefined,
 });

 createdProductionOrders.push(result.order);
 totalCost += item.total_price;
 }

 // STEP 3: Create ONE deposit invoice for the entire CRM order (50%)
 const invoiceResult = await createInvoiceForOrderMutation.mutateAsync({
 order_id: crmOrderId,
 invoice_type: 'deposit',
 });

 toast({
 title: "Success",
 description: `Order ${crmOrderNumber} created with ${createdProductionOrders.length} item${createdProductionOrders.length > 1 ? 's' : ''} totaling $${totalCost.toFixed(2)}. Deposit invoice ${invoiceResult.invoice.invoice_number} generated for $${Number(invoiceResult.invoice.total).toFixed(2)}.`,
 variant: "default",
 });

 // Clear order items and close dialog
 setOrderItems([]);
 setIsOrderDialogOpen(false);

 // Refresh projects to show updated data
 await refetchProjects();

 } catch (error: any) {
 console.error('Error creating order:', error);
 toast({
 title: "Error",
 description: error.message || "Failed to create order. Please try again.",
 variant: "destructive",
 });
 }
 };


 const handleSaveOrder = async (data: OrderCreationFormData) => {
 try {
 // Find the project to get customer_id
 const project = projects.find((p: any) => p.id === data.project_id);
 if (!project) {
 toast({
 title: "Error",
 description: "Project not found.",
 variant: "destructive",
 });
 return;
 }

 // Get collection info for SKU generation
 const selectedCollection = collections?.find((c: any) => c.id === data.collection_id);
 const collectionPrefix = (selectedCollection as any)?.prefix || 'XX';

 // Get material names from IDs for SKU generation
 const getMaterialName = (materialId: string) => {
 if (!materialId) return '';
 const material = allMaterialsForSKU?.find((m: any) => m.id === materialId);
 return (material as any)?.name || '';
 };

 // Prepare material selections for SKU (using names)
 const materialSelections = {
 fabric_brand: getMaterialName(data.fabric_brand_id),
 fabric_collection: getMaterialName(data.fabric_collection_id),
 fabric_color: getMaterialName(data.fabric_color_id),
 wood_type: getMaterialName(data.wood_type_id),
 wood_finish: getMaterialName(data.wood_finish_id),
 metal_type: getMaterialName(data.metal_type_id),
 metal_finish: getMaterialName(data.metal_finish_id),
 metal_color: getMaterialName(data.metal_color_id),
 stone_type: getMaterialName(data.stone_type_id),
 stone_finish: getMaterialName(data.stone_finish_id),
 weaving_material: getMaterialName(data.weaving_material_id),
 weaving_pattern: getMaterialName(data.weaving_pattern_id),
 weaving_color: getMaterialName(data.weaving_color_id),
 carving_style: getMaterialName(data.carving_style_id),
 carving_pattern: getMaterialName(data.carving_pattern_id),
 };

 // Generate base SKU (using catalog system: PREFIX-ITEM-VERSION)
 const itemCode = data.product_name.substring(0, 3).toUpperCase();
 const version = String(orderItems.length + 1).padStart(3, '0');
 const baseSKU = `${collectionPrefix}-${itemCode}-${version}`;

 // Generate hierarchical product SKU using utility function
 const productSKU = generateProductSku(baseSKU, materialSelections);

 // Generate project tracking SKU (temporary - will be generated on server when order is saved)
 const projectSKU = `TEMP-${Date.now()}`;

 // Create new order item with dual SKUs
 const newOrderItem = {
 id: `temp_${Date.now()}`, // Temporary ID until saved to database
 product_name: data.product_name,
 product_sku: productSKU, // Hierarchical SKU for manufacturing
 project_sku: projectSKU, // Client/project tracking SKU
 base_sku: baseSKU, // Original catalog SKU
 quantity: parseInt(data.quantity),
 unit_price: parseFloat(data.unit_price),
 total_price: parseInt(data.quantity) * parseFloat(data.unit_price),
 material_selections: materialSelections,
 custom_specifications: data.custom_specifications,
 };

 // Add to order items list
 setOrderItems(prev => [...prev, newOrderItem]);

 toast({
 title: "Success",
 description: `Order item "${data.product_name}" added successfully! Product SKU: ${productSKU}`,
 variant: "default",
 });

 // Note: Dialog is closed by the dialog component itself

 toast({
 title: "Order Created",
 description: `${data.product_name} has been added to the project.`,
 });

 setIsOrderDialogOpen(false);
 await refetchProjects();
 } catch (error) {
 toast({
 title: "Error",
 description: "Failed to create order. Please try again.",
 variant: "destructive",
 });
 }
 };

 const formatPrice = (price: number) => {
 return new Intl.NumberFormat("en-US", {
 style: "currency",
 currency: "USD",
 }).format(price);
 };

 const formatDate = (date?: Date | null) => {
 if (!date) return "N/A";
 return new Intl.DateTimeFormat("en-US", {
 month: "short",
 day: "numeric",
 year: "numeric",
 }).format(date);
 };

 const clearFilters = () => {
 setSearchTerm("");
 setSelectedStatus("");
 setSelectedPriority("");
 };

 const getTotalBudget = () => {
 return filteredProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
 };

 const getTotalActualCost = () => {
 return filteredProjects.reduce((sum, project) => sum + (project.actual_cost || 0), 0);
 };

 const stats: StatItem[] = [
    {
      title: "Total Projects",
      value: filteredProjects.length,
      icon: ClipboardList,
    },
    {
      title: "Total Budget",
      value: formatPrice(getTotalBudget()),
      icon: DollarSign,
    },
    {
      title: "Actual Cost",
      value: formatPrice(getTotalActualCost()),
      icon: Package,
    },
    {
      title: "Active Projects",
      value: filteredProjects.filter((p: any) => p.status === 'active').length,
      icon: Clock,
    },
  ];

 return (
 <div className="page-container">
 <PageHeader
 title="Projects"
 description="Manage client projects with integrated order creation and tracking"
 actions={[
 {
 label: "Create Project",
 icon: Plus,
 onClick: handleCreateProject,
 },
 ]}
 />

 <StatsGrid stats={stats} />

 {/* Filters */}
 <Card>
 <CardContent className="card-content-compact">
 <div className="filters-section">
 <div className="search-input-wrapper">
 <Search className="search-icon" aria-hidden="true" />
 <Input
 placeholder="Search projects..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="search-input"
 />
 </div>

 <Select value={selectedStatus} onValueChange={setSelectedStatus}>
 <SelectTrigger className="filter-select">
 <SelectValue placeholder="Status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All statuses</SelectItem>
 {statuses.map((status) => (
 <SelectItem key={status.value} value={status.value}>
 {status.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

 <Select value={selectedPriority} onValueChange={setSelectedPriority}>
 <SelectTrigger className="filter-select">
 <SelectValue placeholder="Priority" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All priorities</SelectItem>
 {priorities.map((priority) => (
 <SelectItem key={priority.value} value={priority.value}>
 {priority.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

 {(selectedStatus || selectedPriority || searchTerm) && (
 <Button variant="outline" size="sm" onClick={clearFilters} className="filter-select">
 <Filter className="icon-sm" aria-hidden="true" />
 Clear Filters
 </Button>
 )}
 </div>
 </CardContent>
 </Card>

 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

 <div className="text-sm text-muted-foreground">
 {filteredProjects.length} projects • {formatPrice(getTotalBudget())} budget
 </div>
 </div>

 {/* Projects Table */}
 <div className="mt-6 rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Project</TableHead>
 <TableHead>Client</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Priority</TableHead>
 <TableHead>Progress</TableHead>
 <TableHead>Budget</TableHead>
 <TableHead>Timeline</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredProjects.map((project) => {
 const statusInfo = getStatusInfo(project.status);
 const StatusIcon = statusInfo.icon;

 return (
 <TableRow
 key={project.id}
 className="cursor-pointer hover:bg-muted/50"
 onClick={() => router.push(`/crm/projects/${project.id}`)}
 >
 <TableCell>
 <div className="space-y-1">
 <div className="font-medium">{project.name}</div>
 {project.description && (
 <div className="text-sm text-muted-foreground line-clamp-1">
 {project.description}
 </div>
 )}
 </div>
 </TableCell>
 <TableCell>
 <div className="space-y-1">
 <div className="font-medium text-sm">{project.client_name}</div>
 {project.client_company && (
 <Badge variant="outline" className="text-xs">
 {project.client_company}
 </Badge>
 )}
 </div>
 </TableCell>
 <TableCell>
 <Badge className={statusInfo.color}>
 <StatusIcon className="mr-1 h-3 w-3" />
 {statusInfo.label}
 </Badge>
 </TableCell>
 <TableCell>
 <Badge className={getPriorityColor(project.priority)}>
 {priorities.find(p => p.value === project.priority)?.label}
 </Badge>
 </TableCell>
 <TableCell>
 <div className="flex items-center gap-2">
 <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
 <div
 className="bg-primary h-2 rounded-full transition-all"
 style={{ width: `${project.completion_percentage}%` }}
 />
 </div>
 <span className="text-sm font-medium min-w-[3ch]">{project.completion_percentage}%</span>
 </div>
 </TableCell>
 <TableCell>
 <div className="space-y-1">
 <div className="font-medium text-sm">{formatPrice(project.budget || 0)}</div>
 <div className="text-xs text-muted-foreground">
 Spent: {formatPrice(project.actual_cost || 0)}
 </div>
 </div>
 </TableCell>
 <TableCell>
 <div className="space-y-1">
 <div className="text-sm">{formatDate(project.start_date)}</div>
 <div className="text-xs text-muted-foreground">
 End: {formatDate(project.end_date)}
 </div>
 </div>
 </TableCell>
 <TableCell className="text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
 <Button variant="ghost" size="sm">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCreateOrder(project.id); }}>
 <Plus className="mr-2 h-4 w-4" />
 Create Order
 </DropdownMenuItem>
 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}>
 <Edit className="mr-2 h-4 w-4" />
 Edit
 </DropdownMenuItem>
 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/crm/projects/${project.id}`); }}>
 <Eye className="mr-2 h-4 w-4" />
 View Details
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
 <Trash2 className="mr-2 h-4 w-4" />
 Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </TableCell>
 </TableRow>

 );
 })}
 </TableBody>
 </Table>
 </div>

 {/* Empty State */}
 {filteredProjects.length === 0 && (
 <div className="mt-12 text-center">
 <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
 <h3 className="mt-4 text-lg font-medium">No projects found</h3>
 <p className="mt-2 text-muted-foreground">
 {searchTerm || selectedStatus || selectedPriority
 ? "Try adjusting your search criteria."
 : "Get started by creating your first project."}
 </p>
 {!(searchTerm || selectedStatus || selectedPriority) && (
 <Button className="mt-4" onClick={handleCreateProject}>
 <Plus className="mr-2 h-4 w-4" />
 Create Project
 </Button>
 )}
 </div>
 )}

 {/* Project Dialog */}
 <ProjectDialog
 project={selectedProject}
 isOpen={isProjectDialogOpen}
 onClose={() => setIsProjectDialogOpen(false)}
 onSave={handleSaveProject}
 />

 {/* Order Creation Dialog */}
 <OrderCreationDialog
 projectId={orderCreationProjectId}
 isOpen={isOrderDialogOpen}
 onClose={() => setIsOrderDialogOpen(false)}
 _onSave={handleSaveOrder}
 orderItems={orderItems}
 setOrderItems={setOrderItems}
 onFinalizeOrder={handleFinalizeOrder}
 />
 </div>
 );
}
