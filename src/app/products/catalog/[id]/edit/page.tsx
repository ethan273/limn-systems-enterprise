'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Package, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ITEM_TYPES = [
  { value: 'Concept', label: 'Concept' },
  { value: 'Prototype', label: 'Prototype' },
  { value: 'Production Ready', label: 'Production Ready' },
];

const FURNITURE_TYPES = [
  { value: 'chair', label: 'Chair' },
  { value: 'bench', label: 'Bench' },
  { value: 'table', label: 'Table' },
  { value: 'sofa/loveseat', label: 'Sofa/Loveseat' },
  { value: 'sectional', label: 'Sectional' },
  { value: 'lounge', label: 'Lounge' },
  { value: 'chaise_lounge', label: 'Chaise Lounge' },
  { value: 'ottoman', label: 'Ottoman' },
];

export default function EditCatalogItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [minOrderQuantity, setMinOrderQuantity] = useState('1');
  const [active, setActive] = useState(true);
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [type, setType] = useState('Production Ready');
  const [furnitureType, setFurnitureType] = useState('');
  const [baseSku, setBaseSku] = useState('');
  const [variationType, setVariationType] = useState('');

  const utils = api.useUtils();

  // Fetch item data
  const { data: item, isLoading: isLoadingItem, error } = api.items.getById.useQuery(
    { id: itemId },
    { enabled: !!itemId }
  );

  // Fetch collections for dropdown
  const { data: collectionsData } = api.products.getAllCollections.useQuery();

  // Update catalog item mutation
  const updateItemMutation = api.items.update.useMutation({
    onSuccess: (data) => {
      void utils.items.getAll.invalidate();
      void utils.items.getById.invalidate({ id: itemId });

      toast({
        title: 'Catalog Item Updated',
        description: `Item "${data.name}" updated successfully`,
      });
      router.push('/products/catalog');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update catalog item',
        variant: 'destructive',
      });
    },
  });

  // Populate form when item data loads
  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setSku(item.sku || '');
      setDescription(item.description || '');
      setCollectionId(item.collection_id || '');
      setCategory(item.category || '');
      setSubcategory(item.subcategory || '');
      setListPrice(item.list_price ? item.list_price.toString() : '');
      setCurrency(item.currency || 'USD');
      setLeadTimeDays(item.lead_time_days ? item.lead_time_days.toString() : '');
      setMinOrderQuantity(item.min_order_quantity ? item.min_order_quantity.toString() : '1');
      setActive(item.active ?? true);
      setIsCustomizable(item.is_customizable ?? false);
      setType(item.type || 'Production Ready');
      setFurnitureType(item.furniture_type || '');
      setBaseSku(item.base_sku || '');
      setVariationType(item.variation_type || '');
    }
  }, [item]);

  const handleBack = () => {
    router.push('/products/catalog');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an item name.',
        variant: 'destructive',
      });
      return;
    }

    if (!sku.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a SKU.',
        variant: 'destructive',
      });
      return;
    }

    if (!collectionId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a collection.',
        variant: 'destructive',
      });
      return;
    }

    if (!listPrice || parseFloat(listPrice) < 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid list price.',
        variant: 'destructive',
      });
      return;
    }

    updateItemMutation.mutate({
      id: itemId,
      data: {
        name: name.trim(),
        sku: sku.trim(),
        collection_id: collectionId,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        subcategory: subcategory.trim() || undefined,
        list_price: parseFloat(listPrice),
        currency: currency || 'USD',
        lead_time_days: leadTimeDays ? parseInt(leadTimeDays) : undefined,
        min_order_quantity: minOrderQuantity ? parseInt(minOrderQuantity) : 1,
        active,
        is_customizable: isCustomizable,
        type: type as 'Concept' | 'Prototype' | 'Production Ready',
        furniture_type: furnitureType ? (furnitureType as 'chair' | 'bench' | 'table' | 'sofa/loveseat' | 'sectional' | 'lounge' | 'chaise_lounge' | 'ottoman') : undefined,
        base_sku: baseSku.trim() || undefined,
        variation_type: variationType.trim() || undefined,
      },
    });
  };

  const isLoading = updateItemMutation.isPending;

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="page-title">Error</h1>
            <p className="page-subtitle text-destructive">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingItem) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading catalog item...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="page-title">Edit Catalog Item</h1>
            <p className="page-subtitle">Update catalog item details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Catalog Item Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter item name"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter item description"
                disabled={isLoading}
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g., ITEM-001"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection">
                  Collection <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={collectionId}
                  onValueChange={setCollectionId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="collection">
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionsData?.map((collection: any) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Seating"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g., Dining Chairs"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="listPrice">
                  List Price <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="listPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="USD"
                  disabled={isLoading}
                  maxLength={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Item Type</Label>
                <Select
                  value={type}
                  onValueChange={setType}
                  disabled={isLoading}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((itemType) => (
                      <SelectItem key={itemType.value} value={itemType.value}>
                        {itemType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="furnitureType">Furniture Type</Label>
                <Select
                  value={furnitureType}
                  onValueChange={setFurnitureType}
                  disabled={isLoading}
                >
                  <SelectTrigger id="furnitureType">
                    <SelectValue placeholder="Select furniture type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FURNITURE_TYPES.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value}>
                        {ft.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseSku">Base SKU</Label>
                <Input
                  id="baseSku"
                  value={baseSku}
                  onChange={(e) => setBaseSku(e.target.value)}
                  placeholder="Auto-generated if empty"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variationType">Variation Type</Label>
                <Input
                  id="variationType"
                  value={variationType}
                  onChange={(e) => setVariationType(e.target.value)}
                  placeholder="e.g., Deep, Short, Wide"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadTimeDays">Lead Time (Days)</Label>
                <Input
                  id="leadTimeDays"
                  type="number"
                  min="0"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minOrderQuantity">Minimum Order Quantity</Label>
                <Input
                  id="minOrderQuantity"
                  type="number"
                  min="1"
                  value={minOrderQuantity}
                  onChange={(e) => setMinOrderQuantity(e.target.value)}
                  placeholder="1"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="active">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    This item is available in the catalog
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={active}
                  onCheckedChange={setActive}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isCustomizable">Customizable</Label>
                  <p className="text-sm text-muted-foreground">
                    This item can be customized by customers
                  </p>
                </div>
                <Switch
                  id="isCustomizable"
                  checked={isCustomizable}
                  onCheckedChange={setIsCustomizable}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
