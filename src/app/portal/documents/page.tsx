"use client";

import { api } from "@/lib/api/client";
import {
  FileText,
  Download,
  File,
  Image as ImageIcon,
  FileArchive,
  Calendar,
  Folder,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  DataTable,
  StatsGrid,
  EmptyState,
  LoadingState,
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";

export const dynamic = 'force-dynamic';

const documentTypeConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  invoice: {
    label: "Invoice",
    icon: <FileText className="w-4 h-4" aria-hidden="true" />,
    className: "btn-primary text-info border-primary",
  },
  quote: {
    label: "Quote",
    icon: <FileText className="w-4 h-4" aria-hidden="true" />,
    className: "btn-secondary text-secondary border-secondary",
  },
  contract: {
    label: "Contract",
    icon: <FileText className="w-4 h-4" aria-hidden="true" />,
    className: "bg-success-muted text-success border-success",
  },
  shop_drawing: {
    label: "Shop Drawing",
    icon: <ImageIcon className="w-4 h-4" aria-hidden="true" />,
    className: "bg-orange-100 text-warning border-orange-300",
  },
  photo: {
    label: "Photo",
    icon: <ImageIcon className="w-4 h-4" aria-hidden="true" />,
    className: "bg-muted text-muted border-muted",
  },
  shipping: {
    label: "Shipping Document",
    icon: <FileArchive className="w-4 h-4" aria-hidden="true" />,
    className: "bg-success text-success border-success",
  },
  other: {
    label: "Other",
    icon: <File className="w-4 h-4" aria-hidden="true" />,
    className: "badge-neutral",
  },
};

export default function DocumentsPage() {
  const utils = api.useUtils();

  const { data, isLoading, error } = api.portal.getCustomerDocuments.useQuery({
    documentType: undefined,
    limit: 100,
    offset: 0,
  });

  const documents = data?.documents || [];

  const stats: StatItem[] = [
    {
      title: 'Total Documents',
      value: documents.length,
      description: 'All available files',
      icon: Folder,
      iconColor: 'primary',
    },
    {
      title: 'Invoices',
      value: documents.filter((d) => d.type === "invoice").length,
      description: 'Invoice documents',
      icon: FileText,
      iconColor: 'info',
    },
    {
      title: 'Shop Drawings',
      value: documents.filter((d) => d.type === "shop_drawing").length,
      description: 'Technical drawings',
      icon: ImageIcon,
      iconColor: 'warning',
    },
    {
      title: 'Shipping Docs',
      value: documents.filter((d) => d.type === "shipping").length,
      description: 'Shipping documents',
      icon: FileArchive,
      iconColor: 'success',
    },
    {
      title: 'Photos',
      value: documents.filter((d) => d.type === "photo").length,
      description: 'Project photos',
      icon: ImageIcon,
    },
  ];

  const handleDownload = (doc: any) => {
    const url = doc.download_url || doc.url || doc.google_drive_url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: 'name',
      label: 'Document Name',
      sortable: true,
      render: (value, row) => {
        const typeConfig = documentTypeConfig[row.type || 'other'] || documentTypeConfig.other;
        return (
          <div className="flex items-center gap-2">
            {typeConfig.icon}
            <span className="font-medium">{value as string || "Untitled"}</span>
          </div>
        );
      },
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => {
        const typeConfig = documentTypeConfig[value as string || 'other'] || documentTypeConfig.other;
        return (
          <Badge variant="outline" className={cn(typeConfig.className)}>
            {typeConfig.label}
          </Badge>
        );
      },
    },
    {
      key: 'project_name',
      label: 'Project',
      render: (value) => <span className="text-sm">{value as string || "—"}</span>,
    },
    {
      key: 'category',
      label: 'Description',
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {value as string || "—"}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Upload Date',
      sortable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
          {format(new Date(value as string), "MMM d, yyyy")}
        </div>
      ) : <span className="text-sm">—</span>,
    },
    {
      key: 'size',
      label: 'Size',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {value ? `${(Number(value) / 1024 / 1024).toFixed(2)} MB` : "—"}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const downloadUrl = row.download_url || row.url || row.google_drive_url;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(row);
            }}
            disabled={!downloadUrl}
          >
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Download
          </Button>
        );
      },
    },
  ];

  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search documents',
      type: 'search',
      placeholder: 'Search documents, descriptions, or projects...',
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'invoice', label: 'Invoices' },
        { value: 'quote', label: 'Quotes' },
        { value: 'contract', label: 'Contracts' },
        { value: 'shop_drawing', label: 'Shop Drawings' },
        { value: 'photo', label: 'Photos' },
        { value: 'shipping', label: 'Shipping Documents' },
        { value: 'other', label: 'Other' },
      ],
    },
  ];

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Documents"
          subtitle="Access your project documents and files"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load documents"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getCustomerDocuments.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Documents"
        subtitle="Access your project documents and files"
      />

      <StatsGrid stats={stats} columns={4} />

      {isLoading ? (
        <LoadingState message="Loading documents..." size="lg" />
      ) : !documents || documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="You don't have any documents yet."
        />
      ) : (
        <DataTable
          data={documents}
          columns={columns}
          filters={filters}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: FileText,
            title: 'No documents match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
