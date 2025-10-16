/* eslint-disable security/detect-object-injection */
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { EditableFieldGroup, EditableField } from "@/components/common/EditableField";
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
  Edit,
  Check,
  X,
  DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MediaUploader } from "@/components/media/MediaUploader";
import { MediaGallery } from "@/components/media/MediaGallery";
import FurnitureDimensionsForm from "@/components/furniture/FurnitureDimensionsForm";
import type { FurnitureType } from "@/lib/utils/dimension-validation";
import { toast } from "@/hooks/use-toast";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConceptDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const conceptId = resolvedParams.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    concept_number: "",
    description: "",
    designer_id: "",
    collection_id: "",
    status: "",
    priority: "",
    target_price: 0,
    estimated_cost: 0,
    tags: [] as string[],
    notes: "",
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Query concept data
  const { data: concept, isLoading } = api.products.getConceptById.useQuery(
    { id: conceptId },
    { enabled: !!conceptId }
  );

  // Query media data
  const { data: media = [] } = api.documents.getByEntity.useQuery(
    {
      entityType: "concept",
      entityId: conceptId,
    },
    {
      enabled: !!conceptId,
    }
  );

  // Sync formData with fetched concept data
  useEffect(() => {
    if (concept) {
      setFormData({
        name: concept.name || "",
        concept_number: concept.concept_number || "",
        description: concept.description || "",
        designer_id: concept.designer_id || "",
        collection_id: concept.collection_id || "",
        status: concept.status || "",
        priority: concept.priority || "",
        target_price: concept.target_price ? Number(concept.target_price) : 0,
        estimated_cost: concept.estimated_cost ? Number(concept.estimated_cost) : 0,
        tags: concept.tags || [],
        notes: concept.notes || "",
      });
    }
  }, [concept]);

  // Update mutation
  const updateMutation = api.products.updateConcept.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Concept updated successfully",
      });
      setIsEditing(false);
      // Invalidate queries for instant updates
      utils.products.getConceptById.invalidate({ id: conceptId });
      utils.products.getAllConcepts.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update concept",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Concept name is required",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: conceptId,
      name: formData.name,
      concept_number: formData.concept_number || undefined,
      description: formData.description || undefined,
      status: formData.status || undefined,
      priority: formData.priority || undefined,
      target_price: formData.target_price || undefined,
      estimated_cost: formData.estimated_cost || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleCancel = () => {
    if (concept) {
      setFormData({
        name: concept.name || "",
        concept_number: concept.concept_number || "",
        description: concept.description || "",
        designer_id: concept.designer_id || "",
        collection_id: concept.collection_id || "",
        status: concept.status || "",
        priority: concept.priority || "",
        target_price: concept.target_price ? Number(concept.target_price) : 0,
        estimated_cost: concept.estimated_cost ? Number(concept.estimated_cost) : 0,
        tags: concept.tags || [],
        notes: concept.notes || "",
      });
    }
    setIsEditing(false);
  };

  const handleMediaRefresh = () => {
    // Invalidate queries for instant updates
    utils.products.getConceptById.invalidate({ id: conceptId });
    utils.documents.getByEntity.invalidate({ entityType: "concept", entityId: conceptId });
  };

  // Furniture dimensions mutation
  const updateDimensionsMutation = api.items.updateFurnitureDimensions.useMutation({
    onSuccess: () => {
      // Invalidate query to refetch updated data
      void utils.products.getConceptById.invalidate({ id: conceptId });
    },
  });

  const handleSaveDimensions = async (data: { furniture_type: FurnitureType; dimensions: Record<string, number | null> }) => {
    // Convert the input to match the mutation schema
    const mutationData: any = {
      item_id: conceptId,
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
          { icon: Lightbulb, value: concept.designers?.name || "—", label: "Designer" },
          { icon: Package, value: concept.collections?.name || "—", label: "Collection" },
        ]}
        tags={concept.tags || []}
        actions={
          isEditing
            ? [
                { label: 'Cancel', icon: X, onClick: handleCancel },
                { label: 'Save Changes', icon: Check, onClick: handleSave },
              ]
            : [
                { label: 'Edit Concept', icon: Edit, onClick: () => setIsEditing(true) },
              ]
        }
        status={concept.status as string}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Target Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{concept.target_price ? `$${Number(concept.target_price).toFixed(2)}` : "—"}</div>
            <p className="stat-label">Estimated retail</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{concept.estimated_cost ? `$${Number(concept.estimated_cost).toFixed(2)}` : "—"}</div>
            <p className="stat-label">Manufacturing cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Prototypes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{concept.prototypes?.length || 0}</div>
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
          <TabsTrigger value="dimensions" className="tabs-trigger">
            <Package className="icon-sm" aria-hidden="true" />
            Dimensions
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
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Concept Information */}
            <EditableFieldGroup title="Concept Information" isEditing={isEditing}>
              <EditableField
                label="Concept Name"
                value={formData.name}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, name: value })}
                required
                icon={Lightbulb}
              />
              <EditableField
                label="Concept Number"
                value={formData.concept_number}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, concept_number: value })}
                type="text"
              />
              <EditableField
                label="Description"
                value={formData.description}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, description: value })}
                type="textarea"
              />
              <EditableField
                label="Designer"
                value={concept.designers?.name || "—"}
                isEditing={false}
                icon={Lightbulb}
              />
              <EditableField
                label="Collection"
                value={concept.collections?.name || "—"}
                isEditing={false}
                icon={Package}
              />
              <EditableField
                label="Status"
                value={formData.status}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, status: value })}
                type="select"
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'in_review', label: 'In Review' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'in_development', label: 'In Development' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'on_hold', label: 'On Hold' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
              <EditableField
                label="Priority"
                value={formData.priority}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, priority: value })}
                type="select"
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
              />
            </EditableFieldGroup>

            {/* Pricing & Costs */}
            <EditableFieldGroup title="Pricing & Costs" isEditing={isEditing}>
              <EditableField
                label="Target Price"
                value={String(formData.target_price || 0)}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, target_price: parseFloat(value) || 0 })}
                type="number"
                icon={DollarSign}
              />
              <EditableField
                label="Estimated Cost"
                value={String(formData.estimated_cost || 0)}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, estimated_cost: parseFloat(value) || 0 })}
                type="number"
                icon={DollarSign}
              />
              <EditableField
                label="Prototypes Count"
                value={String(concept.prototypes?.length || 0)}
                isEditing={false}
                icon={Package}
              />
              <EditableField
                label="Notes"
                value={formData.notes}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, notes: value })}
                type="textarea"
              />
            </EditableFieldGroup>
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

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="editable-field-group">
                  <label className="editable-field-label">Created</label>
                  <div className="editable-field-value">
                    <span>{formatDistanceToNow(new Date(concept.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="editable-field-group">
                  <label className="editable-field-label">Last Updated</label>
                  <div className="editable-field-value">
                    <span>
                      {concept.updated_at
                        ? formatDistanceToNow(new Date(concept.updated_at), { addSuffix: true })
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="editable-field-group md:col-span-2">
                  <label className="editable-field-label">Concept ID</label>
                  <div className="editable-field-value">
                    <span className="font-mono text-xs text-muted">{concept.id}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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

        {/* Dimensions Tab */}
        <TabsContent value="dimensions">
          <FurnitureDimensionsForm
            itemId={conceptId}
            initialFurnitureType={concept.furniture_type || undefined}
            initialDimensions={concept.furniture_dimensions || undefined}
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
              {concept.prototypes && concept.prototypes.length > 0 ? (
                <div className="space-y-3">
                  {concept.prototypes.map((prototype: any) => (
                    <div
                      key={prototype.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/products/prototypes/${prototype.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{prototype.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {prototype.prototype_number || "No number"}
                          </p>
                        </div>
                        <StatusBadge status={prototype.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Package}
                  title="No prototypes yet"
                  description="Prototypes will appear here once created from this concept."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
