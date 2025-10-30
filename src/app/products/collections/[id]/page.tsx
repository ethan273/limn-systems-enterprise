"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { InfoCard } from "@/components/common/InfoCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import {
  ArrowLeft,
  Package,
  Image as ImageIcon,
  BarChart3,
  Layers,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MediaUploader } from "@/components/media/MediaUploader";
import { MediaGallery } from "@/components/media/MediaGallery";
import { VariationsManager } from "@/components/products/VariationsManager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CollectionDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const collectionId = resolvedParams.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingVariations, setIsEditingVariations] = useState(false);

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Query collection data
  const { data: collections, isLoading } = api.products.getAllCollections.useQuery();
  const collection = collections?.find((c: any) => c.id === collectionId);

  // Query media data
  const { data: media = [] } = api.documents.getByEntity.useQuery(
    {
      entityType: "collection",
      entityId: collectionId,
    },
    {
      enabled: !!collectionId,
    }
  );

  const handleMediaRefresh = () => {
    // Invalidate queries for instant updates
    utils.products.getAllCollections.invalidate();
    utils.documents.getByEntity.invalidate({ entityType: "collection", entityId: collectionId });
  };

  const updateCollectionMutation = api.products.updateCollection.useMutation({
    onSuccess: () => {
      utils.products.getAllCollections.invalidate();
      setIsEditingVariations(false);
    },
  });

  const handleSaveVariations = async (variations: string[]) => {
    await updateCollectionMutation.mutateAsync({
      id: collectionId,
      name: collection.name,
      variation_types: variations,
    });
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading collection..." size="md" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Collection Not Found"
          description="The collection you're looking for doesn't exist."
          action={{
            label: 'Back to Collections',
            onClick: () => router.push("/products/collections"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Breadcrumb />
      {/* Header */}
      <div className="page-header">
        <Button
          onClick={() => router.push("/products/collections")}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Entity Header */}
      <EntityDetailHeader
        icon={Package}
        title={collection.name}
        subtitle={collection.prefix ? `Prefix: ${collection.prefix}` : "Collection Details"}
        metadata={[
          { icon: Package, value: collection.designer || "—", label: "Designer" },
        ]}
        tags={collection.variation_types || []}
        actions={[
          {
            label: isEditingVariations ? 'Cancel Editing' : 'Edit Variations',
            onClick: () => setIsEditingVariations(!isEditingVariations),
          },
        ]}
        status={collection.is_active !== false ? "active" : "inactive"}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">0</div>
            <p className="stat-label">Total materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Catalog Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">0</div>
            <p className="stat-label">Items in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Media Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{media.length}</div>
            <p className="stat-label">Images and documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tabs-trigger">
            <FileText className="icon-sm" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="media" className="tabs-trigger">
            <ImageIcon className="icon-sm" aria-hidden="true" />
            Media ({media.length})
          </TabsTrigger>
          <TabsTrigger value="materials" className="tabs-trigger">
            <Layers className="icon-sm" aria-hidden="true" />
            Materials (0)
          </TabsTrigger>
          <TabsTrigger value="catalog" className="tabs-trigger">
            <Package className="icon-sm" aria-hidden="true" />
            Catalog Items (0)
          </TabsTrigger>
          <TabsTrigger value="statistics" className="tabs-trigger">
            <BarChart3 className="icon-sm" aria-hidden="true" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              title="Collection Information"
              items={[
                { label: 'Collection Name', value: collection.name },
                { label: 'Prefix', value: collection.prefix || '—' },
                { label: 'Designer', value: collection.designer || '—' },
                { label: 'Display Order', value: collection.display_order?.toString() || '—' },
                { label: 'Status', value: <StatusBadge status={collection.is_active !== false ? "active" : "inactive"} /> },
                { label: 'Description', value: collection.description || 'No description provided' },
              ]}
            />

            <InfoCard
              title="Metadata"
              items={[
                {
                  label: 'Created',
                  value: formatDistanceToNow(new Date(collection.created_at), { addSuffix: true })
                },
                {
                  label: 'Last Updated',
                  value: collection.updated_at
                    ? formatDistanceToNow(new Date(collection.updated_at), { addSuffix: true })
                    : "—"
                },
                { label: 'Collection ID', value: <span className="font-mono text-xs text-muted">{collection.id}</span> },
              ]}
            />
          </div>

          <VariationsManager
            variations={collection.variation_types || []}
            onSave={handleSaveVariations}
            isEditing={isEditingVariations}
          />
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Upload Media</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <MediaUploader
                entityType="collection"
                entityId={collectionId}
                onUploadComplete={handleMediaRefresh}
                maxFileSize={100}
                acceptedFileTypes={["image/*", "application/pdf", ".stl", ".obj", ".fbx"]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media Gallery</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <MediaGallery
                entityType="collection"
                entityId={collectionId}
                media={media.map((m: Record<string, any>) => ({
                  ...m,
                  id: m.id,
                  file_name: m.name ?? '',
                  file_url: m.url ?? '',
                  file_type: m.type ?? '',
                  file_size: 0,
                  media_type: m.media_type ?? undefined,
                  use_for_packaging: m.use_for_packaging ?? undefined,
                  use_for_labeling: m.use_for_labeling ?? undefined,
                  use_for_marketing: m.use_for_marketing ?? undefined,
                  is_primary_image: m.is_primary_image ?? undefined,
                  display_order: m.display_order ?? undefined
                }))}
                onRefresh={handleMediaRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Associated Materials</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <EmptyState
                icon={Layers}
                title="No materials yet"
                description="Materials can be assigned to this collection from the Materials page."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Catalog Items Tab */}
        <TabsContent value="catalog">
          <Card>
            <CardHeader>
              <CardTitle>Catalog Items</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <EmptyState
                icon={Package}
                title="No catalog items yet"
                description="Items will appear here once created in the Catalog module."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Material Distribution</CardTitle>
              </CardHeader>
              <CardContent className="card-content-compact">
                <EmptyState
                  icon={BarChart3}
                  title="No statistics available"
                  description="Material statistics will appear here once materials are added."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catalog Item Types</CardTitle>
              </CardHeader>
              <CardContent className="card-content-compact">
                <EmptyState
                  icon={Package}
                  title="No statistics available"
                  description="Catalog statistics will appear here once items are added."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
