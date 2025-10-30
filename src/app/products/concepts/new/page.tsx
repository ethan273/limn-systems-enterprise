'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewConceptPage() {
  const router = useRouter();
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

  // Fetch designers and collections for dropdowns
  const { data: designersData } = api.partners.getDesigners.useQuery({
    limit: 100,
    offset: 0,
  });

  const { data: collectionsData } = api.products.getAllCollections.useQuery();

  // Create concept mutation
  const createConceptMutation = api.products.createConcept.useMutation({
    onSuccess: (data) => {
      // Invalidate cache
      void utils.products.getAllConcepts.invalidate();

      toast({
        title: 'Concept Created',
        description: `Concept "${data.name}" created successfully`,
      });
      router.push('/products/concepts');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create concept',
        variant: 'destructive',
      });
    },
  });

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
    createConceptMutation.mutate({
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

  const isLoading = createConceptMutation.isPending;

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
            <h1 className="page-title">New Concept</h1>
            <p className="page-subtitle">Create a new product concept</p>
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
                <Label htmlFor="conceptNumber">
                  Concept Number{' '}
                  <span className="text-muted-foreground text-sm">
                    (Optional)
                  </span>
                </Label>
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
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Concept
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
