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
  Lightbulb,
  Tag,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MediaUploader } from "@/components/media/MediaUploader";
import { MediaGallery } from "@/components/media/MediaGallery";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConceptDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const conceptId = resolvedParams.id;
  const [activeTab, setActiveTab] = useState("overview");

  // Query concept data
  const { data: concept, isLoading, refetch } = api.products.getConceptById.useQuery(
    { id: conceptId },
    { enabled: !!conceptId }
  );

  // Query media data
  const { data: media = [], refetch: refetchMedia } = api.documents.getByEntity.useQuery(
    {
      entityType: "concept",
      entityId: conceptId,
    },
    {
      enabled: !!conceptId,
    }
  );

  const handleMediaRefresh = () => {
    void refetch();
    void refetchMedia();
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading concept..." size="md" />
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Concept Not Found"
          description="The concept you're looking for doesn't exist."
          action={{
            label: 'Back to Concepts',
            onClick: () => router.push("/products/concepts"),
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
          onClick={() => router.push("/products/concepts")}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Entity Header */}
      <EntityDetailHeader
        icon={Lightbulb}
        title={concept.name}
        subtitle={concept.concept_number ? `Concept #${concept.concept_number}` : "Concept Details"}
        metadata={[
          { icon: Lightbulb, value: concept.designer || "—", label: "Designer" },
          { icon: Package, value: concept.collection || "—", label: "Collection" },
        ]}
        tags={concept.tags || []}
        actions={[
          {
            label: 'Edit Concept',
            onClick: () => router.push(`/products/concepts/${conceptId}/edit`),
          },
        ]}
        status={concept.status as string}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Target Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">${concept.target_price?.toFixed(2) || "—"}</div>
            <p className="stat-label">Estimated retail</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">${concept.estimated_cost?.toFixed(2) || "—"}</div>
            <p className="stat-label">Manufacturing cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Prototypes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{concept.prototypes_count || 0}</div>
            <p className="stat-label">Physical prototypes</p>
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
          <TabsTrigger value="media" className="tabs-trigger">
            <ImageIcon className="icon-sm" aria-hidden="true" />
            Media ({media.length})
          </TabsTrigger>
          <TabsTrigger value="prototypes" className="tabs-trigger">
            <Package className="icon-sm" aria-hidden="true" />
            Prototypes ({concept.prototypes?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              title="Concept Information"
              items={[
                { label: 'Concept Name', value: concept.name },
                { label: 'Concept Number', value: concept.concept_number || '—' },
                { label: 'Designer', value: concept.designer || '—' },
                { label: 'Collection', value: concept.collection || '—' },
                { label: 'Status', value: <StatusBadge status={concept.status as string} /> },
                { label: 'Priority', value: <StatusBadge status={concept.priority as string} /> },
                { label: 'Description', value: concept.description || 'No description provided' },
              ]}
            />

            <InfoCard
              title="Pricing & Costs"
              items={[
                { label: 'Target Price', value: concept.target_price ? `$${concept.target_price.toFixed(2)}` : '—' },
                { label: 'Estimated Cost', value: concept.estimated_cost ? `$${concept.estimated_cost.toFixed(2)}` : '—' },
                { label: 'Prototypes Count', value: concept.prototypes_count?.toString() || '0' },
              ]}
            />
          </div>

          {concept.tags && concept.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="icon-sm" aria-hidden="true" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="card-content-compact">
                <div className="flex flex-wrap gap-2">
                  {concept.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="badge-neutral">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {concept.notes && (
            <InfoCard
              title="Notes"
              items={[
                { label: '', value: concept.notes },
              ]}
            />
          )}

          <InfoCard
            title="Metadata"
            items={[
              {
                label: 'Created',
                value: formatDistanceToNow(new Date(concept.created_at), { addSuffix: true })
              },
              {
                label: 'Last Updated',
                value: concept.updated_at
                  ? formatDistanceToNow(new Date(concept.updated_at), { addSuffix: true })
                  : "—"
              },
              { label: 'Concept ID', value: <span className="font-mono text-xs text-muted">{concept.id}</span> },
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
              {concept.specifications ? (
                <div className="detail-grid">
                  {Object.entries(concept.specifications).map(([key, value]) => (
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
                  description="Technical specifications can be added by editing this concept."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Upload Media</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <MediaUploader
                entityType="concept"
                entityId={conceptId}
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
                entityType="concept"
                entityId={conceptId}
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

        {/* Prototypes Tab */}
        <TabsContent value="prototypes">
          <Card>
            <CardHeader>
              <CardTitle>Prototypes</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <EmptyState
                icon={Package}
                title="No prototypes yet"
                description="Prototypes will appear here once created from this concept."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
