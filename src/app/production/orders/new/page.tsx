"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProductionOrderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    project_id: "",
    product_type: "catalog" as "catalog" | "prototype" | "concept",
    catalog_item_id: "",
    prototype_id: "",
    concept_id: "",
    item_name: "",
    item_description: "",
    quantity: 1,
    unit_price: 0,
    estimated_ship_date: "",
    factory_id: "",
    factory_notes: "",
  });

  const { data: projects } = api.projects.getAll.useQuery({});
  const { data: catalogItems } = api.items.getAll.useQuery({});
  // TODO: Add manufacturers query when partners module is implemented
  // const { data: manufacturers } = api.partners.getAll.useQuery({ type: "manufacturer" });

  const createOrder = api.productionOrders.create.useMutation({
    onSuccess: (data) => {
      router.push(`/production/orders/${data.order.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createOrder.mutate({
      project_id: formData.project_id || undefined,
      product_type: formData.product_type,
      catalog_item_id: formData.product_type === "catalog" ? formData.catalog_item_id || undefined : undefined,
      prototype_id: formData.product_type === "prototype" ? formData.prototype_id || undefined : undefined,
      concept_id: formData.product_type === "concept" ? formData.concept_id || undefined : undefined,
      item_name: formData.item_name,
      item_description: formData.item_description || undefined,
      quantity: Number(formData.quantity),
      unit_price: Number(formData.unit_price),
      estimated_ship_date: formData.estimated_ship_date ? new Date(formData.estimated_ship_date) : undefined,
      factory_id: formData.factory_id || undefined,
      factory_notes: formData.factory_notes || undefined,
    });
  };

  // Auto-populate when catalog item selected
  const handleCatalogSelect = (catalogItemId: string) => {
    const item = catalogItems?.items.find((i: any) => i.id === catalogItemId);
    if (item) {
      setFormData({
        ...formData,
        catalog_item_id: catalogItemId,
        item_name: item.name,
        item_description: item.description ?? "",
        unit_price: Number(item.base_price) || 0,
      });
    }
  };

  const totalCost = formData.quantity * formData.unit_price;
  const depositAmount = totalCost * 0.5;
  const balanceAmount = totalCost * 0.5;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/production/orders">
          <Button variant="ghost" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Production Orders
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Production Order</h1>
        <p className="text-muted-foreground">Create a new production order from catalog items or custom designs</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Terms Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Payment Terms:</strong> 50% deposit due on PO creation (production blocked until paid), 50% balance + shipping due at FOB (shipping blocked until paid)
          </AlertDescription>
        </Alert>

        {/* Project Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project_id">CRM Project (Optional)</Label>
              <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Project</SelectItem>
                  {projects?.items.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.customers?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Product Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Product Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="product_type">Type</Label>
              <Select value={formData.product_type} onValueChange={(value: "catalog" | "prototype" | "concept") => setFormData({ ...formData, product_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="catalog">Catalog Item (90% of orders)</SelectItem>
                  <SelectItem value="prototype">Prototype (Custom Design)</SelectItem>
                  <SelectItem value="concept">Concept (Custom Design)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.product_type === "catalog" && (
              <div>
                <Label htmlFor="catalog_item_id">Catalog Item</Label>
                <Select value={formData.catalog_item_id} onValueChange={handleCatalogSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select catalog item" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogItems?.items.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.sku_full} - {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="item_name">Item Name *</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="item_description">Item Description</Label>
              <Textarea
                id="item_description"
                value={formData.item_description}
                onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="unit_price">Unit Price ($) *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Total Order Value:</span>
                <span className="text-2xl font-bold">${totalCost.toFixed(2)}</span>
              </div>
              <div className="mt-2 text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Deposit (50%):</span>
                  <span className="font-medium">${depositAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Balance at FOB (50%):</span>
                  <span className="font-medium">${balanceAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="estimated_ship_date">Estimated Ship Date</Label>
              <Input
                id="estimated_ship_date"
                type="date"
                value={formData.estimated_ship_date}
                onChange={(e) => setFormData({ ...formData, estimated_ship_date: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Factory Assignment - TODO: Re-enable when partners module is implemented */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Factory Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="factory_id">Factory</Label>
              <Select value={formData.factory_id} onValueChange={(value) => setFormData({ ...formData, factory_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select factory (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not Assigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="factory_notes">Factory Notes</Label>
              <Textarea
                id="factory_notes"
                value={formData.factory_notes}
                onChange={(e) => setFormData({ ...formData, factory_notes: e.target.value })}
                placeholder="Special instructions for the factory..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card> */}

        {/* Auto-Generation Notice */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Upon creating this Production Order:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Order number will be auto-generated (PO-{new Date().getFullYear()}-XXXX)</li>
              <li>Deposit invoice (50%) will be auto-created</li>
              <li>Status will be "Awaiting Deposit" (production blocked)</li>
              <li>Once deposit is paid, {formData.quantity} ordered items will be auto-created</li>
              <li>Production status will change to "In Progress"</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={createOrder.isPending}>
            {createOrder.isPending ? "Creating..." : "Create Production Order & Generate Invoice"}
          </Button>
          <Link href="/production/orders">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>

        {createOrder.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{createOrder.error.message}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}
