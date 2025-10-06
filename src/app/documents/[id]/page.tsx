"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  EntityDetailHeader,
  InfoCard,
  LoadingState,
  EmptyState,
  type EntityMetadata,
} from "@/components/common";
import {
  FileText,
  AlertCircle,
  ArrowLeft,
  Download,
  File,
  Calendar,
  HardDrive,
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch document details - using documents router
  const { data: documentData, isLoading } = api.documents.getById.useQuery(
    { id: id },
    { enabled: !!id }
  );

  const document = documentData as any;

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading document details..." size="lg" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Document Not Found"
          description="The document you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Documents',
            onClick: () => router.push("/documents"),
            icon: ArrowLeft,
          }}
        />
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

  const metadata: EntityMetadata[] = [
    { icon: Calendar, value: document.created_at ? format(new Date(document.created_at), "MMM dd, yyyy") : "N/A", label: 'Created' },
    { icon: HardDrive, value: formatFileSize(document.size), label: 'Size' },
    { icon: File, value: document.type || "N/A", label: 'Type' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Button variant="ghost" onClick={() => router.push("/documents")} className="btn-secondary">
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      <EntityDetailHeader
        icon={FileText}
        title={document.name || "Document"}
        subtitle={typeConfig.label}
        metadata={metadata}
        status={typeConfig.label}
        actions={document.url ? [
          {
            label: 'Download',
            icon: Download,
            onClick: () => window.open(document.url, '_blank'),
          },
        ] : []}
      />

      {/* Document Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <InfoCard
          title="Document Information"
          items={[
            { label: 'Document Name', value: document.name || "N/A" },
            { label: 'Document Type', value: typeConfig.label },
            { label: 'File Type', value: document.type || "N/A" },
            { label: 'File Size', value: formatFileSize(document.size) },
            { label: 'Upload Date', value: document.created_at ? format(new Date(document.created_at), "MMM dd, yyyy 'at' h:mm a") : "N/A" },
            { label: 'Version', value: '1.0' },
          ]}
        />

        <InfoCard
          title="Metadata"
          items={[
            { label: 'Uploaded By', value: 'N/A' },
            { label: 'Last Modified', value: document.created_at ? format(new Date(document.created_at), "MMM dd, yyyy") : "N/A" },
            { label: 'URL', value: document.url ? <a href={document.url} target="_blank" rel="noopener noreferrer" className="text-info hover:underline">View File</a> : 'N/A' },
          ]}
        />
      </div>

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
