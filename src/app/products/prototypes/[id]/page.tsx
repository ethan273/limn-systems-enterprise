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
  Tag,
  CheckCircle,
  MessageSquare,
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

export default function PrototypeDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const prototypeId = resolvedParams.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    prototype_number: "",
    description: "",
    prototype_type: "",
    designer_id: "",
    manufacturer_id: "",
    collection_id: "",
    concept_id: "",
    status: "",
    priority: "",
    is_client_specific: false,
    is_catalog_candidate: false,
    target_price_usd: 0,
    target_cost_usd: 0,
    tags: [] as string[],
    notes: "",
  });

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

  // Sync formData with fetched prototype data
  useEffect(() => {
    if (prototype) {
      setFormData({
        name: prototype.name || "",
        prototype_number: prototype.prototype_number || "",
        description: prototype.description || "",
        prototype_type: prototype.prototype_type || "",
        designer_id: prototype.designer_id || "",
        manufacturer_id: prototype.manufacturer_id || "",
        collection_id: prototype.collection_id || "",
        concept_id: prototype.concept_id || "",
        status: prototype.status || "",
        priority: prototype.priority || "",
        is_client_specific: prototype.is_client_specific || false,
        is_catalog_candidate: prototype.is_catalog_candidate || false,
        target_price_usd: prototype.target_price_usd ? Number(prototype.target_price_usd) : 0,
        target_cost_usd: prototype.target_cost_usd ? Number(prototype.target_cost_usd) : 0,
        tags: prototype.tags || [],
        notes: prototype.notes || "",
      });
    }
  }, [prototype]);

  // Update mutation
  const updateMutation = api.products.updatePrototype.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prototype updated successfully",
      });
      setIsEditing(false);
      // Invalidate queries for instant updates
      utils.products.getPrototypeById.invalidate({ id: prototypeId });
      utils.products.getAllPrototypes.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update prototype",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Prototype name is required",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: prototypeId,
      name: formData.name,
      prototype_number: formData.prototype_number || undefined,
      description: formData.description || undefined,
      prototype_type: formData.prototype_type || undefined,
      status: formData.status || undefined,
      priority: formData.priority || undefined,
      is_client_specific: formData.is_client_specific,
      is_catalog_candidate: formData.is_catalog_candidate,
      target_price_usd: formData.target_price_usd || undefined,
      target_cost_usd: formData.target_cost_usd || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleCancel = () => {
    if (prototype) {
      setFormData({
        name: prototype.name || "",
        prototype_number: prototype.prototype_number || "",
        description: prototype.description || "",
        prototype_type: prototype.prototype_type || "",
        designer_id: prototype.designer_id || "",
        manufacturer_id: prototype.manufacturer_id || "",
        collection_id: prototype.collection_id || "",
        concept_id: prototype.concept_id || "",
        status: prototype.status || "",
        priority: prototype.priority || "",
        is_client_specific: prototype.is_client_specific || false,
        is_catalog_candidate: prototype.is_catalog_candidate || false,
        target_price_usd: prototype.target_price_usd ? Number(prototype.target_price_usd) : 0,
        target_cost_usd: prototype.target_cost_usd ? Number(prototype.target_cost_usd) : 0,
        tags: prototype.tags || [],
        notes: prototype.notes || "",
      });
    }
    setIsEditing(false);
  };

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
          { icon: Package, value: prototype.designers?.name || "—", label: "Designer" },
          { icon: Package, value: prototype.manufacturers?.name || "—", label: "Manufacturer" },
          { icon: Package, value: prototype.collections?.name || "—", label: "Collection" },
        ]}
        tags={prototype.tags || []}
        actions={
          isEditing
            ? [
                { label: 'Cancel', icon: X, onClick: handleCancel },
                { label: 'Save Changes', icon: Check, onClick: handleSave },
              ]
            : [
                { label: 'Edit Prototype', icon: Edit, onClick: () => setIsEditing(true) },
              ]
        }
        status={prototype.status as string}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Target Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{prototype.target_price_usd ? `$${Number(prototype.target_price_usd).toFixed(2)}` : "—"}</div>
            <p className="stat-label">Estimated retail</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Target Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{prototype.target_cost_usd ? `$${Number(prototype.target_cost_usd).toFixed(2)}` : "—"}</div>
            <p className="stat-label">Manufacturing cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{prototype.prototype_feedback?.length || 0}</div>
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
            Feedback ({prototype.prototype_feedback?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="milestones" className="tabs-trigger">
            <CheckCircle className="icon-sm" aria-hidden="true" />
            Milestones ({prototype.prototype_milestones?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prototype Information */}
            <EditableFieldGroup title="Prototype Information" isEditing={isEditing}>
              <EditableField
                label="Prototype Name"
                value={formData.name}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, name: value })}
                required
                icon={Package}
              />
              <EditableField
                label="Prototype Number"
                value={formData.prototype_number}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, prototype_number: value })}
                type="text"
              />
              <EditableField
                label="Type"
                value={formData.prototype_type}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, prototype_type: value })}
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
                value={prototype.designers?.name || "—"}
                isEditing={false}
                icon={Package}
              />
              <EditableField
                label="Manufacturer"
                value={prototype.manufacturers?.name || "—"}
                isEditing={false}
                icon={Package}
              />
              <EditableField
                label="Collection"
                value={prototype.collections?.name || "—"}
                isEditing={false}
                icon={Package}
              />
              <EditableField
                label="Concept"
                value={prototype.concepts?.name || "—"}
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
                  { value: 'initial_design', label: 'Initial Design' },
                  { value: 'in_development', label: 'In Development' },
                  { value: 'ready_for_sampling', label: 'Ready for Sampling' },
                  { value: 'sampling', label: 'Sampling' },
                  { value: 'review', label: 'Review' },
                  { value: 'approved', label: 'Approved' },
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
                label="Target Price (USD)"
                value={String(formData.target_price_usd || 0)}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, target_price_usd: parseFloat(value) || 0 })}
                type="number"
                icon={DollarSign}
              />
              <EditableField
                label="Target Cost (USD)"
                value={String(formData.target_cost_usd || 0)}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, target_cost_usd: parseFloat(value) || 0 })}
                type="number"
                icon={DollarSign}
              />
              <EditableField
                label="Feedback Count"
                value={String(prototype.prototype_feedback?.length || 0)}
                isEditing={false}
                icon={MessageSquare}
              />
              <EditableField
                label="Milestone Count"
                value={String(prototype.prototype_milestones?.length || 0)}
                isEditing={false}
                icon={CheckCircle}
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

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="editable-field-group">
                  <label className="editable-field-label">Created</label>
                  <div className="editable-field-value">
                    <span>{formatDistanceToNow(new Date(prototype.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="editable-field-group">
                  <label className="editable-field-label">Last Updated</label>
                  <div className="editable-field-value">
                    <span>
                      {prototype.updated_at
                        ? formatDistanceToNow(new Date(prototype.updated_at), { addSuffix: true })
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="editable-field-group md:col-span-2">
                  <label className="editable-field-label">Prototype ID</label>
                  <div className="editable-field-value">
                    <span className="font-mono text-xs text-muted">{prototype.id}</span>
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
