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
import { ArrowLeft, Loader2, Package, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function EditCollectionPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prefix, setPrefix] = useState('');
  const [designer, setDesigner] = useState('');
  const [isActive, setIsActive] = useState(true);

  const utils = api.useUtils();

  // Fetch collection data
  const { data: collection, isLoading: isLoadingCollection, error } = api.products.getCollectionById.useQuery(
    { id: collectionId },
    { enabled: !!collectionId }
  );

  // Update collection mutation
  const updateCollectionMutation = api.products.updateCollection.useMutation({
    onSuccess: (data) => {
      // Invalidate cache
      void utils.products.getAllCollections.invalidate();
      void utils.products.getCollectionById.invalidate({ id: collectionId });

      toast({
        title: 'Collection Updated',
        description: `Collection "${data.name}" updated successfully`,
      });
      router.push('/products/collections');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update collection',
        variant: 'destructive',
      });
    },
  });

  // Populate form when collection data loads
  useEffect(() => {
    if (collection) {
      setName(collection.name || '');
      setDescription(collection.description || '');
      setPrefix(collection.prefix || '');
      setDesigner(collection.designer || '');
      setIsActive(collection.is_active ?? true);
    }
  }, [collection]);

  const handleBack = () => {
    router.push('/products/collections');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a collection name.',
        variant: 'destructive',
      });
      return;
    }

    // Submit
    updateCollectionMutation.mutate({
      id: collectionId,
      name: name.trim(),
      description: description.trim() || undefined,
      prefix: prefix.trim() || undefined,
      designer: designer.trim() || undefined,
      is_active: isActive,
    });
  };

  const isLoading = updateCollectionMutation.isPending;

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

  if (isLoadingCollection) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading collection...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
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
            <h1 className="page-title">Edit Collection</h1>
            <p className="page-subtitle">Update collection details</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Collection Details
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
                placeholder="Enter collection name"
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
                placeholder="Enter collection description"
                disabled={isLoading}
                rows={4}
              />
            </div>

            {/* Prefix */}
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g., COL, COLL, etc."
                disabled={isLoading}
                maxLength={10}
              />
              <p className="text-sm text-muted-foreground">
                Used for generating unique identifiers for items in this collection
              </p>
            </div>

            {/* Designer */}
            <div className="space-y-2">
              <Label htmlFor="designer">Designer</Label>
              <Input
                id="designer"
                value={designer}
                onChange={(e) => setDesigner(e.target.value)}
                placeholder="Enter designer name"
                disabled={isLoading}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive collections are hidden from selection lists
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isLoading}
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
