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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  
  Package,
  MoreVertical,
  Edit,
  Trash2,
  Filter,
  ShoppingCart,
  DollarSign,
  Hash,
  ChevronDown,
  ChevronRight,
  Truck
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PageHeader,
  StatsGrid,
  type StatItem,
} from "@/components/common";

interface OrderedItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  collection_id?: string | null;
  collection_name?: string | null;
  fabric_brand?: string | null;
  fabric_collection?: string | null;
  fabric_color?: string | null;
  wood_type?: string | null;
  wood_finish?: string | null;
  metal_type?: string | null;
  metal_finish?: string | null;
  metal_color?: string | null;
  stone_type?: string | null;
  stone_finish?: string | null;
  weaving_material?: string | null;
  weaving_pattern?: string | null;
  weaving_color?: string | null;
  carving_style?: string | null;
  carving_pattern?: string | null;
  custom_specifications?: string | null;
  status: 'pending' | 'in_production' | 'ready' | 'delivered' | 'cancelled';
  order_date?: Date | null;
  estimated_delivery?: Date | null;
  actual_delivery?: Date | null;
  customer_name?: string | null;
  customer_company?: string | null;
  notes?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}

interface OrderedItemFormData {
  product_id: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  collection_id: string;
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
  custom_specifications: string;
  status: string;
  estimated_delivery: string;
  notes: string;
}

function OrderedItemDialog({
  item,
  isOpen,
  onClose,
  onSave,
}: {
  item?: OrderedItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (_data: OrderedItemFormData) => void;
}) {
  const [formData, setFormData] = useState<OrderedItemFormData>({
    product_id: item?.product_id || "",
    product_name: item?.product_name || "",
    quantity: item?.quantity?.toString() || "1",
    unit_price: item?.unit_price?.toString() || "",
    collection_id: item?.collection_id || "",
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
    custom_specifications: item?.custom_specifications || "",
    status: item?.status || "pending",
    estimated_delivery: item?.estimated_delivery?.toISOString().split('T')[0] || "",
    notes: item?.notes || "",
  });

  const { data: collections } = api.products.getAllCollections.useQuery();
  const { data: allMaterials } = api.products.getAllMaterials.useQuery();

  // Filter materials by category for dropdowns (hierarchical system)
  const fabricMaterials = allMaterials?.filter((material: any) =>
    material.material_categories?.name?.toLowerCase().includes('fabric')
  ) || [];

  const woodMaterials = allMaterials?.filter((material: any) =>
    material.material_categories?.name?.toLowerCase().includes('wood')
  ) || [];

  // Note: Additional material categories available for future use
  // const metalMaterials = allMaterials?.filter((material: any) =>
  //   material.material_categories?.name?.toLowerCase().includes('metal')
  // ) || [];
  // const stoneMaterials = allMaterials?.filter((material: any) =>
  //   material.material_categories?.name?.toLowerCase().includes('stone')
  // ) || [];
  // const weavingMaterials = allMaterials?.filter((material: any) =>
  //   material.material_categories?.name?.toLowerCase().includes('weav')
  // ) || [];
  // const carvingMaterials = allMaterials?.filter((material: any) =>
  //   material.material_categories?.name?.toLowerCase().includes('carving')
  // ) || [];

  const handleSave = () => {
    if (!formData.product_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required.",
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

    onSave(formData);
  };

  const statuses = [
    { value: "pending", label: "Pending" },
    { value: "in_production", label: "In Production" },
    { value: "ready", label: "Ready" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit Ordered Item" : "Create New Ordered Item"}
          </DialogTitle>
          <DialogDescription>
            {item
              ? "Update ordered item details and material specifications."
              : "Add a new ordered item with product and material specifications."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection_id">Collection</Label>
                <Select
                  value={formData.collection_id}
                  onValueChange={(value) => setFormData({ ...formData, collection_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No collection</SelectItem>
                    {collections?.map((collection: any) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
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
            </div>
          </div>

          {/* Material Specifications - Keep complex hierarchical UI as-is */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Material Specifications</h3>

            {/* Fabric Materials */}
            <div className="space-y-3">
              <h4 className="font-medium text-primary dark:text-primary">Fabric Materials</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fabric_brand">Fabric Brand</Label>
                  <Select
                    value={formData.fabric_brand}
                    onValueChange={(value) => setFormData({ ...formData, fabric_brand: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {fabricMaterials.filter((m: any) => m.hierarchy_level === 1).map((material: any) => (
                        <SelectItem key={material.id} value={material.name}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fabric_collection">Fabric Collection</Label>
                  <Select
                    value={formData.fabric_collection}
                    onValueChange={(value) => setFormData({ ...formData, fabric_collection: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {fabricMaterials.filter((m: any) => m.hierarchy_level === 2).map((material: any) => (
                        <SelectItem key={material.id} value={material.name}>
                          {material.name}
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
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {fabricMaterials.filter((m: any) => m.hierarchy_level === 3).map((material: any) => (
                        <SelectItem key={material.id} value={material.name}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Wood Materials */}
            <div className="space-y-3">
              <h4 className="font-medium text-muted dark:text-muted">Wood Materials</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wood_type">Wood Type</Label>
                  <Select
                    value={formData.wood_type}
                    onValueChange={(value) => setFormData({ ...formData, wood_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select wood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {woodMaterials.filter((m: any) => m.hierarchy_level === 1).map((material: any) => (
                        <SelectItem key={material.id} value={material.name}>
                          {material.name}
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
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select wood finish" />
                    </SelectTrigger>
                    <SelectContent>
                      {woodMaterials.filter((m: any) => m.hierarchy_level === 2).map((material: any) => (
                        <SelectItem key={material.id} value={material.name}>
                          {material.name}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {item ? "Update Item" : "Create Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OrderedItemsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedItem, setSelectedItem] = useState<OrderedItem | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Get real data from API
  const { data: orderItemsData, isLoading } = api.orderItems.getAll.useQuery({
    limit: 100,
    offset: 0,
    status: selectedStatus || undefined,
    search: searchTerm || undefined,
  });

  const orderItems = orderItemsData?.items || [];

  const { data: collections } = api.products.getAllCollections.useQuery();

  // Transform API data to match component interface
  const filteredItems = orderItems.map((item: any) => ({
    id: item.id,
    order_id: item.orders?.order_number || 'N/A',
    product_id: item.id,
    product_name: item.description || 'Unnamed Product',
    product_sku: item.project_sku,
    quantity: item.quantity || 0,
    unit_price: item.unit_price || 0,
    total_price: (item.quantity || 0) * (item.unit_price || 0),
    collection_id: null,
    collection_name: null,
    fabric_brand: item.specifications?.fabric_brand,
    fabric_collection: item.specifications?.fabric_collection,
    fabric_color: item.specifications?.fabric_color,
    wood_type: item.specifications?.wood_type,
    wood_finish: item.specifications?.wood_finish,
    metal_type: item.specifications?.metal_type,
    metal_finish: item.specifications?.metal_finish,
    metal_color: item.specifications?.metal_color,
    stone_type: item.specifications?.stone_type,
    stone_finish: item.specifications?.stone_finish,
    weaving_material: item.specifications?.weaving_material,
    weaving_pattern: item.specifications?.weaving_pattern,
    weaving_color: item.specifications?.weaving_color,
    carving_style: item.specifications?.carving_style,
    carving_pattern: item.specifications?.carving_pattern,
    custom_specifications: item.specifications?.custom_specifications,
    status: item.status as 'pending' | 'in_production' | 'ready' | 'delivered' | 'cancelled',
    order_date: item.orders?.created_at ? new Date(item.orders.created_at) : null,
    estimated_delivery: item.specifications?.estimated_delivery ? new Date(item.specifications.estimated_delivery) : null,
    actual_delivery: null,
    customer_name: item.orders?.customers?.name,
    customer_company: item.orders?.customers?.company_name,
    notes: item.specifications?.notes,
    created_at: item.created_at ? new Date(item.created_at) : null,
    updated_at: item.updated_at ? new Date(item.updated_at) : null,
  }));

  const statuses = [
    { value: "pending", label: "Pending", color: "bg-warning-muted text-warning dark:bg-warning-muted dark:text-warning" },
    { value: "in_production", label: "In Production", color: "bg-info-muted text-info dark:bg-info-muted dark:text-info" },
    { value: "ready", label: "Ready", color: "bg-success-muted text-success dark:bg-success-muted dark:text-success" },
    { value: "delivered", label: "Delivered", color: "badge-neutral" },
    { value: "cancelled", label: "Cancelled", color: "bg-destructive-muted text-destructive dark:bg-destructive-muted dark:text-destructive" },
  ];

  const getStatusColor = (status: string) => {
    return statuses.find(s => s.value === status)?.color || "badge-neutral";
  };

  const _handleCreateItem = () => {
    setSelectedItem(undefined);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: OrderedItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const createOrderItemMutation = api.orderItems.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Item Created",
        description: "Order item has been created successfully.",
      });
      setIsDialogOpen(false);
      // Invalidate queries for instant updates
      utils.orderItems.getAll.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateOrderItemMutation = api.orderItems.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Item Updated",
        description: "Order item has been updated successfully.",
      });
      setIsDialogOpen(false);
      // Invalidate queries for instant updates
      utils.orderItems.getAll.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteOrderItemMutation = api.orderItems.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Item Deleted",
        description: "Order item has been deleted successfully.",
      });
      // Invalidate queries for instant updates
      utils.orderItems.getAll.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveItem = (data: OrderedItemFormData) => {
    const itemData = {
      product_name: data.product_name,
      quantity: parseInt(data.quantity),
      unit_price: parseFloat(data.unit_price),
      collection_id: data.collection_id || undefined,
      fabric_brand: data.fabric_brand || undefined,
      fabric_collection: data.fabric_collection || undefined,
      fabric_color: data.fabric_color || undefined,
      wood_type: data.wood_type || undefined,
      wood_finish: data.wood_finish || undefined,
      metal_type: data.metal_type || undefined,
      metal_finish: data.metal_finish || undefined,
      metal_color: data.metal_color || undefined,
      stone_type: data.stone_type || undefined,
      stone_finish: data.stone_finish || undefined,
      weaving_material: data.weaving_material || undefined,
      weaving_pattern: data.weaving_pattern || undefined,
      weaving_color: data.weaving_color || undefined,
      carving_style: data.carving_style || undefined,
      carving_pattern: data.carving_pattern || undefined,
      custom_specifications: data.custom_specifications || undefined,
      status: data.status as 'pending' | 'in_production' | 'ready' | 'delivered' | 'cancelled',
      estimated_delivery: data.estimated_delivery || undefined,
      notes: data.notes || undefined,
    };

    if (selectedItem) {
      updateOrderItemMutation.mutate({
        id: selectedItem.id,
        data: itemData,
      });
    } else {
      createOrderItemMutation.mutate(itemData);
    }
  };

  const handleDeleteItem = (item: OrderedItem) => {
    deleteOrderItemMutation.mutate({ id: item.id });
  };

  const handleStatusChange = (item: OrderedItem, newStatus: string) => {
    updateOrderItemMutation.mutate({
      id: item.id,
      data: {
        status: newStatus as 'pending' | 'in_production' | 'ready' | 'delivered' | 'cancelled',
      },
    });
  };

  const toggleRow = (itemId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(itemId)) {
      newExpandedRows.delete(itemId);
    } else {
      newExpandedRows.add(itemId);
    }
    setExpandedRows(newExpandedRows);
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
    setSelectedCollection("");
  };

  const getTotalValue = () => {
    return filteredItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const stats: StatItem[] = [
    {
      title: "Total Items",
      value: filteredItems.length,
      description: "All ordered items",
      icon: Hash,
      iconColor: 'info',
    },
    {
      title: "Total Value",
      value: formatPrice(getTotalValue()),
      description: "Total order value",
      icon: DollarSign,
      iconColor: 'primary',
    },
    {
      title: "In Production",
      value: filteredItems.filter(item => item.status === 'in_production').length,
      description: "Currently being made",
      icon: Package,
      iconColor: 'info',
    },
    {
      title: "Ready",
      value: filteredItems.filter(item => item.status === 'ready').length,
      description: "Ready to ship",
      icon: ShoppingCart,
      iconColor: 'success',
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Ordered Items"
        description="Track and manage individual ordered items with material specifications"
      />

      <StatsGrid stats={stats} />

      {/* Filters and Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center filters-section">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 card text-primary"
            />
          </div>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
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

          <Select value={selectedCollection} onValueChange={setSelectedCollection}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Collection" />
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

          {(selectedStatus || selectedCollection || searchTerm) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <Filter className="mr-1 h-3 w-3" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm page-subtitle">
            {filteredItems.length} items • {formatPrice(getTotalValue())}
          </div>
        </div>
      </div>

      {/* Ordered Table - KEEP COMPLEX NESTED UI AS-IS */}
      <Card className="card">
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border"></div>
                      <span className="ml-2 page-subtitle">Loading order items...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 page-subtitle">
                    No order items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <React.Fragment key={item.id}>
                    <TableRow
                      className="cursor-pointer hover:card/50"
                      onClick={() => toggleRow(item.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(item.id);
                            }}
                          >
                            {expandedRows.has(item.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            {item.product_sku && (
                              <div className="text-sm text-secondary font-mono">
                                {item.product_sku}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{item.order_id}</div>
                        <div className="text-xs page-subtitle">
                          {formatDate(item.order_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.customer_name}</div>
                          {item.customer_company && (
                            <div className="text-sm page-subtitle">
                              {item.customer_company}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.collection_name ? (
                          <Badge variant="outline">{item.collection_name}</Badge>
                        ) : (
                          <span className="page-subtitle">No collection</span>
                        )}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatPrice(item.unit_price)}</TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(item.total_price)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {statuses.find(s => s.value === item.status)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(item.estimated_delivery)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleEditItem(item);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                                <Package className="mr-2 h-4 w-4" />
                                Change Status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {statuses.map((status) => (
                                  <DropdownMenuItem
                                    key={status.value}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(item, status.value);
                                    }}
                                    disabled={item.status === status.value}
                                  >
                                    {status.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: "Generate Label",
                                description: "Shipping label generation will be implemented soon.",
                              });
                            }}>
                              <Truck className="mr-2 h-4 w-4" />
                              Generate Label
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Content - KEEP AS-IS */}
                    {expandedRows.has(item.id) && (
                      <TableRow>
                        <TableCell colSpan={10} className="p-0">
                          <div className="p-6 card/30 border-t">
                            <Tabs defaultValue="dimensions" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
                                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                                <TabsTrigger value="images">Images</TabsTrigger>
                              </TabsList>

                              <TabsContent value="dimensions" className="mt-4">
                                <div className="text-sm page-subtitle">
                                  Dimensions data will be displayed here
                                </div>
                              </TabsContent>

                              <TabsContent value="shipping" className="mt-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <Label className="text-xs page-subtitle">Estimated Delivery</Label>
                                    <div className="text-sm font-medium text-primary">
                                      {formatDate(item.estimated_delivery)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs page-subtitle">Actual Delivery</Label>
                                    <div className="text-sm font-medium text-primary">
                                      {formatDate(item.actual_delivery)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs page-subtitle">Status</Label>
                                    <div className="text-sm font-medium">
                                      <Badge className={getStatusColor(item.status)}>
                                        {statuses.find(s => s.value === item.status)?.label}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="images" className="mt-4">
                                <div className="text-sm page-subtitle">
                                  Image management will be displayed here
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Ordered Item Dialog */}
      <OrderedItemDialog
        item={selectedItem}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveItem}
      />
    </div>
  );
}
