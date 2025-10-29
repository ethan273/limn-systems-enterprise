/**
 * Document Detail Page
 *
 * Displays full details of a document including file info, entity relationships, and download options
 *
 * @module documents/[id]
 * @created 2025-10-28
 * @phase Grand Plan Phase 5 - Missing Pages Fix
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  Hash,
} from "lucide-react";
import { format } from "date-fns";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const { data: document, isLoading, error } = api.documents.getById.useQuery(
    { id: docId },
    { enabled: !!docId }
  );

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Document Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">
              {error.message || "Unable to load document details"}
            </p>
            <Button onClick={() => router.push("/documents")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading document details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Document Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The requested document could not be found.</p>
            <Button onClick={() => router.push("/documents")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get document type badge
  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      image: { label: "Image", variant: "default" },
      pdf: { label: "PDF", variant: "destructive" },
      document: { label: "Document", variant: "default" },
      spreadsheet: { label: "Spreadsheet", variant: "secondary" },
      other: { label: "Other", variant: "outline" },
    };

    const info = typeMap[type] || { label: type, variant: "outline" as const };
    return (
      <Badge variant={info.variant}>
        {info.label}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/documents")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{document.file_name}</h1>
            <p className="text-muted-foreground">Document Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {document.document_type && getTypeBadge(document.document_type)}
          {document.is_primary_image && (
            <Badge variant="outline">
              Primary Image
            </Badge>
          )}
        </div>
      </div>

      {/* Document Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">File Name</h3>
              <p className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {document.file_name}
              </p>
            </div>
            {document.file_path && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Storage Path</h3>
                <p className="text-base font-mono text-xs break-all">{document.file_path}</p>
              </div>
            )}
            {document.file_size && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">File Size</h3>
                <p className="text-base">{formatFileSize(Number(document.file_size))}</p>
              </div>
            )}
            {document.mime_type && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">MIME Type</h3>
                <p className="text-base">{document.mime_type}</p>
              </div>
            )}
            {document.hash && (
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  File Hash (Integrity)
                </h3>
                <p className="text-base font-mono text-xs break-all">{document.hash}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
              <p className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {document.created_at ? format(new Date(document.created_at), "PPp") : "N/A"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
              <p className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {document.updated_at ? format(new Date(document.updated_at), "PPp") : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description Card */}
      {document.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{document.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Related Entities Card */}
      <Card>
        <CardHeader>
          <CardTitle>Related Entities</CardTitle>
          <CardDescription>
            Entities this document is associated with
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {document.project_id && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Project ID</h3>
                <p className="text-base font-mono text-xs">{document.project_id}</p>
              </div>
            )}
            {document.customer_id && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer ID</h3>
                <p className="text-base font-mono text-xs">{document.customer_id}</p>
              </div>
            )}
            {document.product_id && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Product ID</h3>
                <p className="text-base font-mono text-xs">{document.product_id}</p>
              </div>
            )}
            {!document.project_id && !document.customer_id && !document.product_id && (
              <p className="text-muted-foreground col-span-2">No related entities found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {document.file_path && (
              <Button
                onClick={() => {
                  window.open(document.file_path, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View File
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (document.file_path) {
                  const link = window.document.createElement('a');
                  link.href = document.file_path;
                  link.download = document.file_name;
                  link.click();
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
