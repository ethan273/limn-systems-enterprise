'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

/**
 * QC Portal Documents
 * View and download inspection reports and documentation
 */
export default function QCDocumentsPage() {
  const utils = api.useUtils();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: documentsData, isLoading, error } = api.portal.getQCDocuments.useQuery({
    documentType: typeFilter === 'all' ? undefined : typeFilter as any,
    limit: 100,
    offset: 0,
  });

  const documents = documentsData?.documents || [];

  const filteredDocuments = documents.filter((doc: any) => {
    if (typeFilter !== 'all' && doc.document_type !== typeFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        doc.name?.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentIcon = (_type: string) => {
    return <FileText className="h-5 w-5 text-primary" />;
  };

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Documents"
          subtitle="View and download inspection reports and documentation"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load documents"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getQCDocuments.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Documents</h1>
        <p className="page-subtitle">View and download inspection reports and documentation</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inspection_report">Inspection Reports</SelectItem>
                <SelectItem value="quality_certificate">Quality Certificates</SelectItem>
                <SelectItem value="photos">Photos</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading documents...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents found"
              description={search || typeFilter !== 'all'
                ? "Try adjusting your search or filters"
                : "No documents available yet"}
            />
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc: any) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getDocumentIcon(doc.document_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1 truncate">{doc.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(doc.created_at)}
                          </span>
                          <span>{formatFileSize(doc.file_size || 0)}</span>
                          <span className="capitalize">{doc.document_type?.replace('_', ' ')}</span>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Types Info */}
      <Card>
        <CardHeader>
          <CardTitle>Document Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Inspection Reports</h4>
              <p className="text-sm text-muted-foreground">
                Detailed quality inspection reports and findings
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Quality Certificates</h4>
              <p className="text-sm text-muted-foreground">
                Official quality certification documents
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Photos</h4>
              <p className="text-sm text-muted-foreground">
                Inspection photos and visual documentation
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Other</h4>
              <p className="text-sm text-muted-foreground">
                Additional supporting documentation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
