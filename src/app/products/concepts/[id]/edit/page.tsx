'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Lightbulb, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const STATUS_OPTIONS = [
  { value: 'concept', label: 'Concept' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_development', label: 'In Development' },
  { value: 'rejected', label: 'Rejected' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function EditConceptPage() {
  const router = useRouter();
  const params = useParams();
  const conceptId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conceptNumber, setConceptNumber] = useState('');
  const [designerId, setDesignerId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [status, setStatus] = useState('concept');
  const [priority, setPriority] = useState('medium');
  const [targetPrice, setTargetPrice] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [notes, setNotes] = useState('');

  const utils = api.useUtils();

  // Fetch concept data
  const { data: concept, isLoading: isLoadingConcept, error } = api.products.getConceptById.useQuery(
    { id: conceptId },
    { enabled: !!conceptId }
  );

  // Fetch designers and collections for dropdowns
  const { data: designersData } = api.partners.getDesigners.useQuery({
    limit: 100,
    offset: 0,
  });

  const { data: collectionsData } = api.products.getAllCollections.useQuery();

  // Update concept mutation
  const updateConceptMutation = api.products.updateConcept.useMutation({
    onSuccess: (data) => {
      // Invalidate cache
      void utils.products.getAllConcepts.invalidate();
      void utils.products.getConceptById.invalidate({ id: conceptId });

      toast({
        title: 'Concept Updated',
        description: `Concept "${data.name}" updated successfully`,
      });
      router.push('/products/concepts');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update concept',
        variant: 'destructive',
      });
    },
  });

  // Populate form when concept data loads
  useEffect(() => {
    if (concept) {
      setName(concept.name || '');
      setDescription(concept.description || '');
      setConceptNumber(concept.concept_number || '');
      setDesignerId(concept.designer_id || '');
      setCollectionId(concept.collection_id || '');
      setStatus(concept.status || 'concept');
      setPriority(concept.priority || 'medium');
      setTargetPrice(concept.target_price ? concept.target_price.toString() : '');
      setEstimatedCost(concept.estimated_cost ? concept.estimated_cost.toString() : '');
      setNotes(concept.notes || '');
    }
  }, [concept]);

  const handleBack = () => {
    router.push('/products/concepts');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a concept name.',
        variant: 'destructive',
      });
      return;
    }

    // Submit
    updateConceptMutation.mutate({
      id: conceptId,
      name: name.trim(),
      description: description.trim() || undefined,
      concept_number: conceptNumber.trim() || undefined,
      designer_id: designerId || undefined,
      collection_id: collectionId || undefined,
      status: status || undefined,
      priority: priority || undefined,
      target_price: targetPrice ? parseFloat(targetPrice) : undefined,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const isLoading = updateConceptMutation.isPending;

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
          >
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

  if (isLoadingConcept) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading concept...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="page-title">Edit Concept</h1>
            <p className="page-subtitle">Update concept details</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Concept Details
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
                placeholder="Enter concept name"
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
                placeholder="Enter concept description"
                disabled={isLoading}
                rows={4}
              />
            </div>

            {/* Two column layout */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Concept Number */}
              <div className="space-y-2">
                <Label htmlFor="conceptNumber">Concept Number</Label>
                <Input
                  id="conceptNumber"
                  value={conceptNumber}
                  onChange={(e) => setConceptNumber(e.target.value)}
                  placeholder="e.g., CONC-001"
                  disabled={isLoading}
                  maxLength={50}
                />
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
                <Label htmlFor="targetPrice">Target Price ($)</Label>
                <Input
                  id="targetPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>

              {/* Estimated Cost */}
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="0.00"
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
                placeholder="Additional notes about this concept"
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
