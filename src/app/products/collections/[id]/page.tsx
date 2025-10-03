"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Package,
  Calendar,
  Settings,
  Edit,
  Image as ImageIcon,
  BarChart3,
  Layers,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MediaUploader } from "@/components/media/MediaUploader";
import { MediaGallery } from "@/components/media/MediaGallery";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CollectionDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const collectionId = resolvedParams.id;
  const [activeTab, setActiveTab] = useState("overview");

  // Query collection data
  const { data: collections, isLoading, refetch } = api.products.getAllCollections.useQuery();
  const collection = collections?.find((c: any) => c.id === collectionId);

  // Mock media data (will be replaced with actual tRPC query)
  const mockMedia: any[] = [];

  const handleMediaRefresh = () => {
    void refetch();
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4" />
            <p className="page-subtitle">Loading collection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted mb-4" />
            <h2 className="text-2xl font-bold mb-2">Collection Not Found</h2>
            <p className="page-subtitle mb-4">The collection you&apos;re looking for doesn&apos;t exist.</p>
            <Button onClick={() => router.push("/products/collections")}>
              <ArrowLeft className="icon-sm" />
              Back to Collections
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/products/collections")}
            className="btn-back"
          >
            <ArrowLeft className="icon-sm" />
          </Button>
          <div>
            <h1 className="page-title">{collection.name}</h1>
            <div className="page-subtitle">
              {collection.prefix && (
                <Badge variant="secondary" className="font-mono mr-2">
                  {collection.prefix}
                </Badge>
              )}
              Collection Details
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={collection.is_active !== false ? "status-active" : "status-inactive"}
          >
            {collection.is_active !== false ? "Active" : "Inactive"}
          </Badge>
          <Button onClick={() => router.push(`/products/collections/${collectionId}/edit`)}>
            <Edit className="icon-sm" />
            Edit Collection
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <FileText className="icon-xs mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="media">
            <ImageIcon className="icon-xs mr-2" />
            Media ({mockMedia.length})
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Layers className="icon-xs mr-2" />
            Materials (0)
          </TabsTrigger>
          <TabsTrigger value="catalog">
            <Package className="icon-xs mr-2" />
            Catalog Items (0)
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="icon-xs mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Materials</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">Total materials</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Catalog Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">Items in catalog</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Media Files</CardTitle>
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMedia.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Images and documents</p>
              </CardContent>
            </Card>
          </div>

          {/* Collection Details */}
          <div className="detail-section">
            <div className="detail-section-header">
              <Package className="detail-section-icon" />
              <h2 className="detail-section-title">Collection Information</h2>
            </div>
            <div className="detail-grid">
              <div className="detail-field">
                <label className="detail-label">Collection Name</label>
                <p className="detail-value">{collection.name}</p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Prefix</label>
                <div className="detail-value">
                  {collection.prefix ? (
                    <Badge variant="secondary" className="font-mono">
                      {collection.prefix}
                    </Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
              </div>
              <div className="detail-field">
                <label className="detail-label">Designer</label>
                <p className="detail-value">{collection.designer || <span className="text-muted">—</span>}</p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Display Order</label>
                <p className="detail-value">{collection.display_order || <span className="text-muted">—</span>}</p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Status</label>
                <div className="detail-value">
                  <Badge
                    variant="outline"
                    className={collection.is_active !== false ? "status-active" : "status-inactive"}
                  >
                    {collection.is_active !== false ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="detail-field col-span-2">
                <label className="detail-label">Description</label>
                <p className="detail-value">
                  {collection.description || <span className="text-muted">No description provided</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Variation Types */}
          {collection.variation_types && collection.variation_types.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-header">
                <Settings className="detail-section-icon" />
                <h2 className="detail-section-title">Variation Types</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {collection.variation_types.map((type: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="badge-neutral">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="detail-section">
            <div className="detail-section-header">
              <Calendar className="detail-section-icon" />
              <h2 className="detail-section-title">Metadata</h2>
            </div>
            <div className="detail-grid">
              <div className="detail-field">
                <label className="detail-label">Created</label>
                <p className="detail-value">
                  {formatDistanceToNow(new Date(collection.created_at), { addSuffix: true })}
                </p>
              </div>
              {collection.updated_at && (
                <div className="detail-field">
                  <label className="detail-label">Last Updated</label>
                  <p className="detail-value">
                    {formatDistanceToNow(new Date(collection.updated_at), { addSuffix: true })}
                  </p>
                </div>
              )}
              <div className="detail-field">
                <label className="detail-label">Collection ID</label>
                <p className="detail-value font-mono text-xs text-muted">{collection.id}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          <div className="detail-section">
            <div className="detail-section-header">
              <ImageIcon className="detail-section-icon" />
              <h2 className="detail-section-title">Upload Media</h2>
            </div>
            <MediaUploader
              entityType="collection"
              entityId={collectionId}
              onUploadComplete={handleMediaRefresh}
              maxFileSize={100}
              acceptedFileTypes={["image/*", "application/pdf", ".stl", ".obj", ".fbx"]}
            />
          </div>

          <div className="detail-section">
            <div className="detail-section-header">
              <ImageIcon className="detail-section-icon" />
              <h2 className="detail-section-title">Media Gallery</h2>
            </div>
            <MediaGallery
              entityType="collection"
              entityId={collectionId}
              media={mockMedia}
              onRefresh={handleMediaRefresh}
            />
          </div>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-6">
          <div className="detail-section">
            <div className="detail-section-header">
              <Layers className="detail-section-icon" />
              <h2 className="detail-section-title">Associated Materials</h2>
            </div>
            <div className="empty-state">
              <Layers className="empty-state-icon" />
              <p className="empty-state-title">No materials yet</p>
              <p className="empty-state-description">
                Materials can be assigned to this collection from the Materials page.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Catalog Items Tab */}
        <TabsContent value="catalog" className="space-y-6">
          <div className="detail-section">
            <div className="detail-section-header">
              <Package className="detail-section-icon" />
              <h2 className="detail-section-title">Catalog Items</h2>
            </div>
            <div className="empty-state">
              <Package className="empty-state-icon" />
              <p className="empty-state-title">No catalog items yet</p>
              <p className="empty-state-description">
                Items will appear here once created in the Catalog module.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Material Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="empty-state">
                  <BarChart3 className="empty-state-icon" />
                  <p className="empty-state-description">No material statistics available yet</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catalog Item Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="empty-state">
                  <Package className="empty-state-icon" />
                  <p className="empty-state-description">No catalog statistics available yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
