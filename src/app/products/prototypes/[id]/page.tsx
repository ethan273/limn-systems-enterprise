/* eslint-disable security/detect-object-injection */
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
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import {
  ArrowLeft,
  Package,
  Settings,
  Image as ImageIcon,
  FileText,
  Tag,
  CheckCircle,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MediaUploader } from "@/components/media/MediaUploader";
import { MediaGallery } from "@/components/media/MediaGallery";
import FurnitureDimensionsForm from "@/components/furniture/FurnitureDimensionsForm";
import type { FurnitureType } from "@/lib/utils/dimension-validation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PrototypeDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const prototypeId = resolvedParams.id;
  const [activeTab, setActiveTab] = useState("overview");

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Query prototype data
  const { data: prototype, isLoading } = api.products.getPrototypeById.useQuery(
    { id: prototypeId },
    { enabled: !!prototypeId }
  );

  // Query media data
  const { data: media = [] } = api.documents.getByEntity.useQuery(
    {
      entityType: "prototype",
      entityId: prototypeId,
    },
    {
      enabled: !!prototypeId,
    }
  );

  const handleMediaRefresh = () => {
    // Invalidate queries for instant updates
    utils.products.getPrototypeById.invalidate({ id: prototypeId });
    utils.documents.getByEntity.invalidate({ entityType: "prototype", entityId: prototypeId });
  };

  // Furniture dimensions mutation
  const updateDimensionsMutation = api.items.updateFurnitureDimensions.useMutation({
    onSuccess: () => {
      // Invalidate query to refetch updated data
      void utils.products.getPrototypeById.invalidate({ id: prototypeId });
    },
  });

  const handleSaveDimensions = async (data: { furniture_type: FurnitureType; dimensions: Record<string, number | null> }) => {
    // Convert the input to match the mutation schema
    const mutationData: any = {
      item_id: prototypeId,
      furniture_type: data.furniture_type,
    };

    // Add dimensions to the mutation data
    Object.entries(data.dimensions).forEach(([key, value]) => {
      if (value !== null) {
        mutationData[key] = value;
      }
    });

    updateDimensionsMutation.mutate(mutationData);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading prototype..." size="md" />
      </div>
    );
  }

  if (!prototype) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Prototype Not Found"
          description="The prototype you're looking for doesn't exist."
          action={{
            label: 'Back to Prototypes',
            onClick: () => router.push("/products/prototypes"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Button
          onClick={() => router.push("/products/prototypes")}
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
        title={prototype.name}
        subtitle={prototype.prototype_number ? `Prototype #${prototype.prototype_number}` : "Prototype Details"}
        metadata={[
          { icon: Package, value: prototype.designer || "—", label: "Designer" },
          { icon: Package, value: prototype.manufacturer || "—", label: "Manufacturer" },
          { icon: Package, value: prototype.collection || "—", label: "Collection" },
        ]}
        tags={prototype.tags || []}
        actions={[
          {
            label: 'Edit Prototype',
            onClick: () => router.push(`/products/prototypes/${prototypeId}/edit`),
          },
        ]}
        status={prototype.status as string}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Target Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">${prototype.target_price_usd?.toFixed(2) || "—"}</div>
            <p className="stat-label">Estimated retail</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Target Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">${prototype.target_cost_usd?.toFixed(2) || "—"}</div>
            <p className="stat-label">Manufacturing cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{prototype.feedback_count || 0}</div>
            <p className="stat-label">Client feedback items</p>
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
          <TabsTrigger value="specifications" className="tabs-trigger">
            <Settings className="icon-sm" aria-hidden="true" />
            Specifications
          </TabsTrigger>
          <TabsTrigger value="dimensions" className="tabs-trigger">
            <Package className="icon-sm" aria-hidden="true" />
            Dimensions
          </TabsTrigger>
          <TabsTrigger value="media" className="tabs-trigger">
            <ImageIcon className="icon-sm" aria-hidden="true" />
            Media ({media.length})
          </TabsTrigger>
          <TabsTrigger value="feedback" className="tabs-trigger">
            <MessageSquare className="icon-sm" aria-hidden="true" />
            Feedback ({prototype.feedback_count || 0})
          </TabsTrigger>
          <TabsTrigger value="milestones" className="tabs-trigger">
            <CheckCircle className="icon-sm" aria-hidden="true" />
            Milestones ({prototype.milestone_count || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              title="Prototype Information"
              items={[
                { label: 'Prototype Name', value: prototype.name },
                { label: 'Prototype Number', value: prototype.prototype_number || '—' },
                { label: 'Type', value: prototype.prototype_type || '—' },
                { label: 'Designer', value: prototype.designer || '—' },
                { label: 'Manufacturer', value: prototype.manufacturer || '—' },
                { label: 'Collection', value: prototype.collection || '—' },
                { label: 'Concept', value: prototype.concept || '—' },
                { label: 'Status', value: <StatusBadge status={prototype.status as string} /> },
                { label: 'Priority', value: <StatusBadge status={prototype.priority as string} /> },
                { label: 'Description', value: prototype.description || 'No description provided' },
              ]}
            />

            <InfoCard
              title="Pricing & Costs"
              items={[
                { label: 'Target Price', value: prototype.target_price_usd ? `$${Number(prototype.target_price_usd).toFixed(2)}` : '—' },
                { label: 'Target Cost', value: prototype.target_cost_usd ? `$${Number(prototype.target_cost_usd).toFixed(2)}` : '—' },
                { label: 'Feedback Count', value: (prototype.feedback_count || 0).toString() },
                { label: 'Milestone Count', value: (prototype.milestone_count || 0).toString() },
              ]}
            />
          </div>

          {prototype.tags && prototype.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="icon-sm" aria-hidden="true" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="card-content-compact">
                <div className="flex flex-wrap gap-2">
                  {prototype.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="badge-neutral">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {prototype.is_catalog_candidate && (
            <Card>
              <CardHeader>
                <CardTitle>Catalog Candidate</CardTitle>
              </CardHeader>
              <CardContent className="card-content-compact">
                <p className="text-sm">This prototype is marked as a catalog candidate.</p>
              </CardContent>
            </Card>
          )}

          {prototype.notes && (
            <InfoCard
              title="Notes"
              items={[
                { label: '', value: prototype.notes },
              ]}
            />
          )}

          <InfoCard
            title="Metadata"
            items={[
              {
                label: 'Created',
                value: formatDistanceToNow(new Date(prototype.created_at), { addSuffix: true })
              },
              {
                label: 'Last Updated',
                value: prototype.updated_at
                  ? formatDistanceToNow(new Date(prototype.updated_at), { addSuffix: true })
                  : "—"
              },
              { label: 'Prototype ID', value: <span className="font-mono text-xs text-muted">{prototype.id}</span> },
            ]}
          />
        </TabsContent>

        {/* Specifications Tab */}
        <TabsContent value="specifications">
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              {prototype.specifications ? (
                <div className="detail-grid">
                  {Object.entries(prototype.specifications).map(([key, value]) => (
                    <div key={key} className="detail-field col-span-2">
                      <label className="detail-label">{key}</label>
                      <p className="detail-value">
                        {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Settings}
                  title="No specifications yet"
                  description="Technical specifications can be added by editing this prototype."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dimensions Tab */}
        <TabsContent value="dimensions">
          <FurnitureDimensionsForm
            itemId={prototypeId}
            initialFurnitureType={prototype.furniture_type || undefined}
            initialDimensions={prototype.furniture_dimensions || undefined}
            onSave={handleSaveDimensions}
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
                entityType="prototype"
                entityId={prototypeId}
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
                entityType="prototype"
                entityId={prototypeId}
                media={media.map(m => ({
                  ...m,
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

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Client Feedback</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <EmptyState
                icon={MessageSquare}
                title="No feedback yet"
                description="Client feedback will appear here once collected."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Development Milestones</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <EmptyState
                icon={CheckCircle}
                title="No milestones yet"
                description="Development milestones and progress will be tracked here."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
