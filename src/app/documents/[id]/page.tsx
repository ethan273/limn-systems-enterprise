"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  AlertCircle,
  ArrowLeft,
  Download,
  File,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const documentTypeConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  invoice: {
    label: "Invoice",
    className: "bg-info-muted text-info border-info",
    icon: <FileText className="w-4 h-4" aria-hidden="true" />,
  },
  contract: {
    label: "Contract",
    className: "bg-primary-muted text-primary border-primary",
    icon: <File className="w-4 h-4" aria-hidden="true" />,
  },
  drawing: {
    label: "Drawing",
    className: "bg-success-muted text-success border-success",
    icon: <File className="w-4 h-4" aria-hidden="true" />,
  },
  photo: {
    label: "Photo",
    className: "bg-warning-muted text-warning border-warning",
    icon: <File className="w-4 h-4" aria-hidden="true" />,
  },
  other: {
    label: "Other",
    className: "badge-neutral",
    icon: <File className="w-4 h-4" aria-hidden="true" />,
  },
};

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.id as string;

  // Fetch document details - using documents router
  const { data: documentData, isLoading } = api.documents.getById.useQuery(
    { id: documentId },
    { enabled: !!documentId }
  );

  const document = documentData as any;

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading document details...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="page-container">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>Document not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Determine document type from file type or document_type field
  const getDocType = (doc: any): string => {
    if (doc?.document_type) return doc.document_type;
    if (doc?.file_type?.includes('pdf')) return 'invoice';
    if (doc?.file_type?.includes('image')) return 'photo';
    if (doc?.type?.includes('pdf')) return 'invoice';
    if (doc?.type?.includes('image')) return 'photo';
    return 'other';
  };

  const typeConfig = documentTypeConfig[getDocType(document)] || documentTypeConfig.other;

  // Calculate file size display
  const formatFileSize = (bytes: number | bigint | null | undefined) => {
    if (!bytes) return 'N/A';
    const numBytes = Number(bytes);
    if (numBytes < 1024) return `${numBytes} B`;
    if (numBytes < 1024 * 1024) return `${(numBytes / 1024).toFixed(1)} KB`;
    return `${(numBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/documents")}>
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back
          </Button>
          <div>
            <h1 className="page-title">{document.name || "Document"}</h1>
            <p className="page-description">
              {document.name || "Document Details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={typeConfig.className}>
            <span className="flex items-center gap-1">
              {typeConfig.icon}
              {typeConfig.label}
            </span>
          </Badge>
          {document.url && (
            <Button variant="outline" asChild>
              <a href={document.url} download target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Download
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Document Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={typeConfig.className}>
              <span className="flex items-center gap-1">
                {typeConfig.icon}
                {typeConfig.label}
              </span>
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Upload Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {document.created_at ? format(new Date(document.created_at), "MMM dd, yyyy") : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">File Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {document.size ? formatFileSize(document.size) : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Uploaded By</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">N/A</p>
          </CardContent>
        </Card>
      </div>

      {/* Document Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Document Name</p>
              <p className="font-medium">{document.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Document Type</p>
              <p className="font-medium">{typeConfig.label}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">File Name</p>
              <p className="font-medium">{document.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">File Type</p>
              <p className="font-medium">{document.type || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upload Date</p>
              <p className="font-medium">
                {document.created_at ? format(new Date(document.created_at), "MMM dd, yyyy 'at' h:mm a") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-medium">1.0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Document Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {document.url ? (
            <div className="space-y-4">
              {document.type === 'application/pdf' ? (
                <iframe
                  src={document.url}
                  className="w-full h-[600px] border rounded"
                  title="Document Preview"
                />
              ) : document.type?.startsWith('image/') ? (
                <div className="relative w-full" style={{ minHeight: '400px' }}>
                  <Image
                    src={document.url}
                    alt={document.name || "Document"}
                    width={800}
                    height={600}
                    className="rounded border object-contain"
                    style={{ width: '100%', height: 'auto' }}
                  />
                </div>
              ) : (
                <Alert>
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    Preview not available for this file type. Please download to view.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No file available for preview</p>
          )}
        </CardContent>
      </Card>

      {/* Related Records */}
      <Card>
        <CardHeader>
          <CardTitle>Related Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No related records available</p>
        </CardContent>
      </Card>
    </div>
  );
}
