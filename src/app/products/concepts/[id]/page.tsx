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
  FileText,
  DollarSign,
  Lightbulb,
  Tag,
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4" />
            <p className="page-subtitle">Loading concept...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Lightbulb className="mx-auto h-12 w-12 text-muted mb-4" />
            <h2 className="text-2xl font-bold mb-2">Concept Not Found</h2>
            <p className="page-subtitle mb-4">The concept you&apos;re looking for doesn&apos;t exist.</p>
            <Button onClick={() => router.push("/products/concepts")}>
              <ArrowLeft className="icon-sm" />
              Back to Concepts
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
            onClick={() => router.push("/products/concepts")}
            className="btn-back"
          >
            <ArrowLeft className="icon-sm" />
          </Button>
          <div>
            <h1 className="page-title">{concept.name}</h1>
            <div className="page-subtitle">
              {concept.concept_number && (
                <Badge variant="secondary" className="font-mono mr-2">
                  {concept.concept_number}
                </Badge>
              )}
              Concept Details
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              concept.status === "concept"
                ? "status-todo"
                : concept.status === "approved"
                ? "status-completed"
                : "status-in-progress"
            }
          >
            {concept.status}
          </Badge>
          <Badge
            variant="outline"
            className={
              concept.priority === "high"
                ? "priority-high"
                : concept.priority === "medium"
                ? "priority-medium"
                : "priority-low"
            }
          >
            {concept.priority} priority
          </Badge>
          <Button onClick={() => router.push(`/products/concepts/${conceptId}/edit`)}>
            <Edit className="icon-sm" />
            Edit Concept
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
          <TabsTrigger value="specifications">
            <Settings className="icon-xs mr-2" />
            Specifications
          </TabsTrigger>
          <TabsTrigger value="media">
            <ImageIcon className="icon-xs mr-2" />
            Media ({media.length})
          </TabsTrigger>
          <TabsTrigger value="prototypes">
            <Package className="icon-xs mr-2" />
            Prototypes ({concept.prototypes?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Target Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${concept.target_price?.toFixed(2) || "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Estimated retail</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${concept.estimated_cost?.toFixed(2) || "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Manufacturing cost</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prototypes</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{concept.prototypes_count}</div>
                <p className="text-xs text-muted-foreground mt-1">Physical prototypes</p>
              </CardContent>
            </Card>
          </div>

          {/* Concept Information */}
          <div className="detail-section">
            <div className="detail-section-header">
              <Lightbulb className="detail-section-icon" />
              <h2 className="detail-section-title">Concept Information</h2>
            </div>
            <div className="detail-grid">
              <div className="detail-field">
                <label className="detail-label">Concept Name</label>
                <p className="detail-value">{concept.name}</p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Concept Number</label>
                <div className="detail-value">
                  {concept.concept_number ? (
                    <Badge variant="secondary" className="font-mono">
                      {concept.concept_number}
                    </Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
              </div>
              <div className="detail-field">
                <label className="detail-label">Designer</label>
                <p className="detail-value">
                  {concept.designer || <span className="text-muted">—</span>}
                </p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Collection</label>
                <p className="detail-value">
                  {concept.collection || <span className="text-muted">—</span>}
                </p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Status</label>
                <div className="detail-value">
                  <Badge
                    variant="outline"
                    className={
                      concept.status === "concept"
                        ? "status-todo"
                        : concept.status === "approved"
                        ? "status-completed"
                        : "status-in-progress"
                    }
                  >
                    {concept.status}
                  </Badge>
                </div>
              </div>
              <div className="detail-field">
                <label className="detail-label">Priority</label>
                <div className="detail-value">
                  <Badge
                    variant="outline"
                    className={
                      concept.priority === "high"
                        ? "priority-high"
                        : concept.priority === "medium"
                        ? "priority-medium"
                        : "priority-low"
                    }
                  >
                    {concept.priority}
                  </Badge>
                </div>
              </div>
              <div className="detail-field col-span-2">
                <label className="detail-label">Description</label>
                <p className="detail-value">
                  {concept.description || <span className="text-muted">No description provided</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {concept.tags && concept.tags.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-header">
                <Tag className="detail-section-icon" />
                <h2 className="detail-section-title">Tags</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {concept.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="badge-neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {concept.notes && (
            <div className="detail-section">
              <div className="detail-section-header">
                <FileText className="detail-section-icon" />
                <h2 className="detail-section-title">Notes</h2>
              </div>
              <p className="detail-value">{concept.notes}</p>
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
                  {formatDistanceToNow(new Date(concept.created_at), { addSuffix: true })}
                </p>
              </div>
              {concept.updated_at && (
                <div className="detail-field">
                  <label className="detail-label">Last Updated</label>
                  <p className="detail-value">
                    {formatDistanceToNow(new Date(concept.updated_at), { addSuffix: true })}
                  </p>
                </div>
              )}
              <div className="detail-field">
                <label className="detail-label">Concept ID</label>
                <p className="detail-value font-mono text-xs text-muted">{concept.id}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Specifications Tab */}
        <TabsContent value="specifications" className="space-y-6">
          <div className="detail-section">
            <div className="detail-section-header">
              <Settings className="detail-section-icon" />
              <h2 className="detail-section-title">Specifications</h2>
            </div>
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
              <div className="empty-state">
                <Settings className="empty-state-icon" />
                <p className="empty-state-title">No specifications yet</p>
                <p className="empty-state-description">
                  Technical specifications can be added by editing this concept.
                </p>
              </div>
            )}
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
              entityType="concept"
              entityId={conceptId}
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
              entityType="concept"
              entityId={conceptId}
              media={media}
              onRefresh={handleMediaRefresh}
            />
          </div>
        </TabsContent>

        {/* Prototypes Tab */}
        <TabsContent value="prototypes" className="space-y-6">
          <div className="detail-section">
            <div className="detail-section-header">
              <Package className="detail-section-icon" />
              <h2 className="detail-section-title">Prototypes</h2>
            </div>
            <div className="empty-state">
              <Package className="empty-state-icon" />
              <p className="empty-state-title">No prototypes yet</p>
              <p className="empty-state-description">
                Prototypes will appear here once created from this concept.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
