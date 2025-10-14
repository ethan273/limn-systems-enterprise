/* eslint-disable security/detect-object-injection */
'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  File,
  FileImage,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react';

/**
 * Customer Portal Documents Page
 * View and download project documents
 */
export default function CustomerDocumentsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: documentsData, isLoading } = api.portal.getCustomerDocuments.useQuery({
    documentType: typeFilter === 'all' ? undefined : typeFilter,
    limit: 100,
    offset: 0,
  });

  const documents = documentsData?.documents || [];

  // Filter by search term
  const filteredDocuments = documents.filter((doc: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      doc.document_name?.toLowerCase().includes(searchLower) ||
      doc.document_type?.toLowerCase().includes(searchLower) ||
      doc.description?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getDocumentIcon = (type: string) => {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('image') || typeLower.includes('photo')) {
      return FileImage;
    }
    if (typeLower.includes('spreadsheet') || typeLower.includes('excel')) {
      return FileSpreadsheet;
    }
    return FileText;
  };

  const getDocumentTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      contract: { label: 'Contract', variant: 'default' },
      invoice: { label: 'Invoice', variant: 'secondary' },
      shop_drawing: { label: 'Shop Drawing', variant: 'outline' },
      photo: { label: 'Photo', variant: 'outline' },
      other: { label: 'Other', variant: 'outline' },
    };
    const config = typeConfig[type?.toLowerCase() as keyof typeof typeConfig] || {
      label: type || 'Document',
      variant: 'outline' as const
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Group documents by type
  const documentsByType = filteredDocuments.reduce((acc: any, doc: any) => {
    const type = doc.document_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  const documentTypes = Object.keys(documentsByType).sort();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">Documents</h1>
            <p className="page-subtitle">View and download project documents</p>
          </div>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="w-full md:w-[200px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="contract">Contracts</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
                  <SelectItem value="shop_drawing">Shop Drawings</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Count */}
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">Loading documents...</div>
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={search ? Search : FileText}
              title={search ? 'No documents found' : 'No documents yet'}
              description={
                search
                  ? 'Try adjusting your search or filters'
                  : 'Documents will appear here once they are uploaded'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {documentTypes.map((type) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getDocumentTypeBadge(type)}
                  <span className="text-muted-foreground text-sm font-normal">
                    ({documentsByType[type].length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documentsByType[type].map((doc: any) => {
                    const DocIcon = getDocumentIcon(doc.document_type);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="mt-1">
                            <DocIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium mb-1">{doc.document_name}</h4>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {doc.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              {doc.created_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Uploaded: {formatDate(doc.created_at)}</span>
                                </div>
                              )}
                              {doc.file_size && (
                                <div className="flex items-center gap-1">
                                  <File className="h-3 w-3" />
                                  <span>{formatFileSize(doc.file_size)}</span>
                                </div>
                              )}
                              {doc.projects && (
                                <div>Project: {doc.projects.project_name}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (doc.file_url) {
                                window.open(doc.file_url, '_blank');
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Document Information */}
      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Uploading Documents</h4>
            <p className="text-sm text-muted-foreground">
              Click the "Upload Document" button to add contracts, photos, or other files related
              to your projects.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Document Types</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Contracts - Purchase orders and agreements</li>
              <li>Shop Drawings - Technical drawings and specifications</li>
              <li>Photos - Product images and reference photos</li>
              <li>Invoices - Billing documents</li>
              <li>Other - Additional project-related files</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
