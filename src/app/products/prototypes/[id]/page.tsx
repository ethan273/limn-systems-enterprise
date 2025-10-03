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
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MediaUploader } from "@/components/media/MediaUploader";
import { MediaGallery } from "@/components/media/MediaGallery";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PrototypeDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const prototypeId = resolvedParams.id;
  const [activeTab, setActiveTab] = useState("overview");

  // TODO: Replace with actual tRPC query when available
  const isLoading = false;
  const prototype = null;

  // Mock media data
  const mockMedia: any[] = [];

  const handleMediaRefresh = () => {
    // Will trigger refetch when API is available
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4" />
            <p className="page-subtitle">Loading prototype...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!prototype) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted mb-4" />
            <h2 className="text-2xl font-bold mb-2">Prototype Not Found</h2>
            <p className="page-subtitle mb-4">The prototype you&apos;re looking for doesn&apos;t exist.</p>
            <Button onClick={() => router.push("/products/prototypes")}>
              <ArrowLeft className="icon-sm" />
              Back to Prototypes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Mock prototype data
  const mockPrototype = {
    id: prototypeId,
    name: "Sample Prototype",
    prototype_number: "PROTO-2024-001",
    description: "Physical prototype for concept testing",
    prototype_type: "furniture",
    status: "in_review",
    priority: "high",
    is_client_specific: false,
    is_catalog_candidate: true,
    designer: "John Designer",
    manufacturer: "ABC Manufacturing",
    collection: "INYO",
    concept: "CON-2024-001",
    target_price_usd: 1200.00,
    target_cost_usd: 800.00,
    tags: ["prototype", "testing", "furniture"],
    specifications: {
      dimensions: { width: 60, depth: 30, height: 75 },
      materials: ["Oak", "Steel"],
      finish: "Natural oil",
      weight: "45 lbs",
    },
    notes: "Initial prototype completed, awaiting client feedback",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    feedback_count: 0,
    milestone_count: 0,
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/products/prototypes")}
            className="btn-back"
          >
            <ArrowLeft className="icon-sm" />
          </Button>
          <div>
            <h1 className="page-title">{mockPrototype.name}</h1>
            <div className="page-subtitle">
              {mockPrototype.prototype_number && (
                <Badge variant="secondary" className="font-mono mr-2">
                  {mockPrototype.prototype_number}
                </Badge>
              )}
              Prototype Details
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              mockPrototype.status === "concept"
                ? "status-todo"
                : mockPrototype.status === "approved"
                ? "status-completed"
                : "status-in-progress"
            }
          >
            {mockPrototype.status}
          </Badge>
          <Badge
            variant="outline"
            className={
              mockPrototype.priority === "high"
                ? "priority-high"
                : mockPrototype.priority === "medium"
                ? "priority-medium"
                : "priority-low"
            }
          >
            {mockPrototype.priority} priority
          </Badge>
          {mockPrototype.is_catalog_candidate && (
            <Badge variant="outline" className="badge-neutral">
              Catalog Candidate
            </Badge>
          )}
          <Button onClick={() => router.push(`/products/prototypes/${prototypeId}/edit`)}>
            <Edit className="icon-sm" />
            Edit Prototype
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
            Media ({mockMedia.length})
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <MessageSquare className="icon-xs mr-2" />
            Feedback ({mockPrototype.feedback_count})
          </TabsTrigger>
          <TabsTrigger value="milestones">
            <CheckCircle className="icon-xs mr-2" />
            Milestones ({mockPrototype.milestone_count})
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
                  ${mockPrototype.target_price_usd?.toFixed(2) || "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Estimated retail</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Target Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${mockPrototype.target_cost_usd?.toFixed(2) || "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Manufacturing cost</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockPrototype.feedback_count}</div>
                <p className="text-xs text-muted-foreground mt-1">Client feedback items</p>
              </CardContent>
            </Card>
          </div>

          {/* Prototype Information */}
          <div className="detail-section">
            <div className="detail-section-header">
              <Package className="detail-section-icon" />
              <h2 className="detail-section-title">Prototype Information</h2>
            </div>
            <div className="detail-grid">
              <div className="detail-field">
                <label className="detail-label">Prototype Name</label>
                <p className="detail-value">{mockPrototype.name}</p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Prototype Number</label>
                <div className="detail-value">
                  {mockPrototype.prototype_number ? (
                    <Badge variant="secondary" className="font-mono">
                      {mockPrototype.prototype_number}
                    </Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
              </div>
              <div className="detail-field">
                <label className="detail-label">Type</label>
                <p className="detail-value">{mockPrototype.prototype_type}</p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Designer</label>
                <p className="detail-value">
                  {mockPrototype.designer || <span className="text-muted">—</span>}
                </p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Manufacturer</label>
                <p className="detail-value">
                  {mockPrototype.manufacturer || <span className="text-muted">—</span>}
                </p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Collection</label>
                <p className="detail-value">
                  {mockPrototype.collection || <span className="text-muted">—</span>}
                </p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Concept</label>
                <p className="detail-value">
                  {mockPrototype.concept || <span className="text-muted">—</span>}
                </p>
              </div>
              <div className="detail-field">
                <label className="detail-label">Status</label>
                <div className="detail-value">
                  <Badge
                    variant="outline"
                    className={
                      mockPrototype.status === "concept"
                        ? "status-todo"
                        : mockPrototype.status === "approved"
                        ? "status-completed"
                        : "status-in-progress"
                    }
                  >
                    {mockPrototype.status}
                  </Badge>
                </div>
              </div>
              <div className="detail-field">
                <label className="detail-label">Priority</label>
                <div className="detail-value">
                  <Badge
                    variant="outline"
                    className={
                      mockPrototype.priority === "high"
                        ? "priority-high"
                        : mockPrototype.priority === "medium"
                        ? "priority-medium"
                        : "priority-low"
                    }
                  >
                    {mockPrototype.priority}
                  </Badge>
                </div>
              </div>
              <div className="detail-field col-span-2">
                <label className="detail-label">Description</label>
                <p className="detail-value">
                  {mockPrototype.description || <span className="text-muted">No description provided</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {mockPrototype.tags && mockPrototype.tags.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-header">
                <Tag className="detail-section-icon" />
                <h2 className="detail-section-title">Tags</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockPrototype.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="badge-neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {mockPrototype.notes && (
            <div className="detail-section">
              <div className="detail-section-header">
                <FileText className="detail-section-icon" />
                <h2 className="detail-section-title">Notes</h2>
              </div>
              <p className="detail-value">{mockPrototype.notes}</p>
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
                  {formatDistanceToNow(new Date(mockPrototype.created_at), { addSuffix: true })}
                </p>
              </div>
              {mockPrototype.updated_at && (
                <div className="detail-field">
                  <label className="detail-label">Last Updated</label>
                  <p className="detail-value">
                    {formatDistanceToNow(new Date(mockPrototype.updated_at), { addSuffix: true })}
                  </p>
                </div>
              )}
              <div className="detail-field">
                <label className="detail-label">Prototype ID</label>
                <p className="detail-value font-mono text-xs text-muted">{mockPrototype.id}</p>
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
            {mockPrototype.specifications ? (
              <div className="detail-grid">
                {Object.entries(mockPrototype.specifications).map(([key, value]) => (
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
                  Technical specifications can be added by editing this prototype.
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
              entityType="prototype"
              entityId={prototypeId}
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
              entityType="prototype"
              entityId={prototypeId}
              media={mockMedia}
              onRefresh={handleMediaRefresh}
            />
          </div>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="detail-section">
            <div className="detail-section-header">
              <MessageSquare className="detail-section-icon" />
              <h2 className="detail-section-title">Client Feedback</h2>
            </div>
            <div className="empty-state">
              <MessageSquare className="empty-state-icon" />
              <p className="empty-state-title">No feedback yet</p>
              <p className="empty-state-description">
                Client feedback will appear here once collected.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-6">
          <div className="detail-section">
            <div className="detail-section-header">
              <CheckCircle className="detail-section-icon" />
              <h2 className="detail-section-title">Development Milestones</h2>
            </div>
            <div className="empty-state">
              <CheckCircle className="empty-state-icon" />
              <p className="empty-state-title">No milestones yet</p>
              <p className="empty-state-description">
                Development milestones and progress will be tracked here.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
