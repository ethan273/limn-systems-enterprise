'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Box, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const STATUS_OPTIONS = [
  { value: 'concept', label: 'Concept' },
  { value: 'design', label: 'Design' },
  { value: 'in_production', label: 'In Production' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const PROTOTYPE_TYPES = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'textile', label: 'Textile' },
  { value: 'other', label: 'Other' },
];

export default function NewPrototypePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prototypeNumber, setPrototypeNumber] = useState('');
  const [prototypeType, setPrototypeType] = useState('furniture');
  const [designerId, setDesignerId] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [status, setStatus] = useState('concept');
  const [priority, setPriority] = useState('medium');
  const [targetPriceUsd, setTargetPriceUsd] = useState('');
  const [targetCostUsd, setTargetCostUsd] = useState('');
  const [isClientSpecific, setIsClientSpecific] = useState(false);
  const [isCatalogCandidate, setIsCatalogCandidate] = useState(false);
  const [notes, setNotes] = useState('');

  const utils = api.useUtils();

  // Fetch data for dropdowns
  const { data: designersData } = api.partners.getDesigners.useQuery({
    limit: 100,
    offset: 0,
  });

  const { data: factoriesData } = api.partners.getFactories.useQuery({
    limit: 100,
    offset: 0,
  });

  const { data: collectionsData } = api.products.getAllCollections.useQuery();

  const { data: conceptsData } = api.products.getAllConcepts.useQuery();

  // Create prototype mutation
  const createPrototypeMutation = api.products.createPrototype.useMutation({
    onSuccess: (data) => {
      // Invalidate cache
      void utils.products.getAllPrototypes.invalidate();

      toast({
        title: 'Prototype Created',
        description: `Prototype "${data.name}" created successfully`,
      });
      router.push('/products/prototypes');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create prototype',
        variant: 'destructive',
      });
    },
  });

  const handleBack = () => {
    router.push('/products/prototypes');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a prototype name.',
        variant: 'destructive',
      });
      return;
    }

    if (!prototypeNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a prototype number.',
        variant: 'destructive',
      });
      return;
    }

    // Submit
    createPrototypeMutation.mutate({
      name: name.trim(),
      prototype_number: prototypeNumber.trim(),
      description: description.trim() || undefined,
      prototype_type: prototypeType || undefined,
      designer_id: designerId || undefined,
      manufacturer_id: manufacturerId || undefined,
      collection_id: collectionId || undefined,
      concept_id: conceptId || undefined,
      status: status || undefined,
      priority: priority || undefined,
      target_price_usd: targetPriceUsd ? parseFloat(targetPriceUsd) : undefined,
      target_cost_usd: targetCostUsd ? parseFloat(targetCostUsd) : undefined,
      is_client_specific: isClientSpecific,
      is_catalog_candidate: isCatalogCandidate,
      notes: notes.trim() || undefined,
    });
  };

  const isLoading = createPrototypeMutation.isPending;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Breadcrumb />
      {/* Header */}
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
            <h1 className="page-title">New Prototype</h1>
            <p className="page-subtitle">Create a new product prototype</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Prototype Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter prototype name"
                disabled={isLoading}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter prototype description"
                disabled={isLoading}
                rows={4}
              />
            </div>

            {/* Two column layout */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Prototype Number */}
              <div className="space-y-2">
                <Label htmlFor="prototypeNumber">
                  Prototype Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="prototypeNumber"
                  value={prototypeNumber}
                  onChange={(e) => setPrototypeNumber(e.target.value)}
                  placeholder="e.g., PROTO-001"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Prototype Type */}
              <div className="space-y-2">
                <Label htmlFor="prototypeType">Prototype Type</Label>
                <Select
                  value={prototypeType}
                  onValueChange={setPrototypeType}
                  disabled={isLoading}
                >
                  <SelectTrigger id="prototypeType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROTOTYPE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Designer */}
              <div className="space-y-2">
                <Label htmlFor="designer">Designer</Label>
                <Select
                  value={designerId}
                  onValueChange={setDesignerId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="designer">
                    <SelectValue placeholder="Select designer" />
                  </SelectTrigger>
                  <SelectContent>
                    {designersData?.partners?.map((designer: any) => (
                      <SelectItem key={designer.id} value={designer.id}>
                        {designer.company_name || designer.contact_name || 'Unnamed Designer'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Manufacturer */}
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Select
                  value={manufacturerId}
                  onValueChange={setManufacturerId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="manufacturer">
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {factoriesData?.partners?.map((factory: any) => (
                      <SelectItem key={factory.id} value={factory.id}>
                        {factory.company_name || factory.contact_name || 'Unnamed Manufacturer'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Collection */}
              <div className="space-y-2">
                <Label htmlFor="collection">Collection</Label>
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

              {/* Concept */}
              <div className="space-y-2">
                <Label htmlFor="concept">Based on Concept</Label>
                <Select
                  value={conceptId}
                  onValueChange={setConceptId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="concept">
                    <SelectValue placeholder="Select concept" />
                  </SelectTrigger>
                  <SelectContent>
                    {conceptsData?.map((concept: any) => (
                      <SelectItem key={concept.id} value={concept.id}>
                        {concept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  disabled={isLoading}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={setPriority}
                  disabled={isLoading}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Price */}
              <div className="space-y-2">
                <Label htmlFor="targetPriceUsd">Target Price (USD)</Label>
                <Input
                  id="targetPriceUsd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetPriceUsd}
                  onChange={(e) => setTargetPriceUsd(e.target.value)}
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>

              {/* Target Cost */}
              <div className="space-y-2">
                <Label htmlFor="targetCostUsd">Target Cost (USD)</Label>
                <Input
                  id="targetCostUsd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetCostUsd}
                  onChange={(e) => setTargetCostUsd(e.target.value)}
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              {/* Client Specific */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isClientSpecific">Client Specific</Label>
                  <p className="text-sm text-muted-foreground">
                    This prototype is for a specific client project
                  </p>
                </div>
                <Switch
                  id="isClientSpecific"
                  checked={isClientSpecific}
                  onCheckedChange={setIsClientSpecific}
                  disabled={isLoading}
                />
              </div>

              {/* Catalog Candidate */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isCatalogCandidate">Catalog Candidate</Label>
                  <p className="text-sm text-muted-foreground">
                    This prototype could be added to the catalog
                  </p>
                </div>
                <Switch
                  id="isCatalogCandidate"
                  checked={isCatalogCandidate}
                  onCheckedChange={setIsCatalogCandidate}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this prototype"
                disabled={isLoading}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
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
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Prototype
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
