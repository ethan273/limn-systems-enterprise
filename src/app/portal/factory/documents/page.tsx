'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState, EmptyState } from '@/components/common';
import {
  FileText,
  AlertTriangle,
  RefreshCw,
  Upload,
  Download,
  Eye,
  Search,
  Filter,
  Package,
} from 'lucide-react';

/**
 * Factory Documents Page
 * External portal for factories to view and manage production documents
 */
export default function FactoryDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    documentType: 'other' as 'packing_list' | 'qc_report' | 'shipping_doc' | 'invoice' | 'certificate' | 'other',
    description: '',
    productionOrderId: '',
    qualityInspectionId: '',
  });

  // Queries
  const { data: documentsData, isLoading, error, refetch } = api.portal.getFactoryDocuments.useQuery();
  const { data: ordersData } = api.portal.getFactoryOrders.useQuery({ limit: 100, offset: 0 });
  const createDocument = api.portal.createFactoryDocument.useMutation();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const documents = (documentsData?.documents || []) as any[];
  const orders = ordersData?.orders || [];

  // Filter documents based on search and filter
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = searchQuery === '' ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.category === filterType;
    return matchesSearch && matchesFilter;
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Auto-detect document type based on file extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['pdf'].includes(ext || '')) {
        const fileName = file.name.toLowerCase();
        if (fileName.includes('packing') || fileName.includes('pack')) {
          setUploadForm(prev => ({ ...prev, documentType: 'packing_list' }));
        } else if (fileName.includes('qc') || fileName.includes('quality') || fileName.includes('inspection')) {
          setUploadForm(prev => ({ ...prev, documentType: 'qc_report' }));
        } else if (fileName.includes('shipping') || fileName.includes('ship')) {
          setUploadForm(prev => ({ ...prev, documentType: 'shipping_doc' }));
        } else if (fileName.includes('invoice')) {
          setUploadForm(prev => ({ ...prev, documentType: 'invoice' }));
        } else if (fileName.includes('certificate') || fileName.includes('cert')) {
          setUploadForm(prev => ({ ...prev, documentType: 'certificate' }));
        }
      }
    }
  };

  // Handle document upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      // Upload to Supabase Storage
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const timestamp = Date.now();
      const filePath = `factory-documents/${timestamp}-${selectedFile.name}`;

      const { data: _data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        alert('Failed to upload file to storage');
        return;
      }

      // Create document record in database
      await createDocument.mutateAsync({
        name: selectedFile.name,
        documentType: uploadForm.documentType,
        storagePath: filePath,
        storageBucket: 'documents',
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        productionOrderId: uploadForm.productionOrderId || undefined,
        qualityInspectionId: uploadForm.qualityInspectionId || undefined,
        description: uploadForm.description || undefined,
      });

      // Show success and refresh
      setUploadSuccess(true);
      setUploadDialogOpen(false);
      void utils.portal.getFactoryDocuments.invalidate();

      // Reset form
      setTimeout(() => {
        setUploadSuccess(false);
        setSelectedFile(null);
        setUploadForm({
          documentType: 'other',
          description: '',
          productionOrderId: '',
          qualityInspectionId: '',
        });
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  // Handle document view
  const handleView = (doc: typeof documents[0]) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  // Handle document download
  const handleDownload = (doc: typeof documents[0]) => {
    if (doc.download_url) {
      const link = document.createElement('a');
      link.href = doc.download_url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  // Get document type badge color
  const getDocTypeBadge = (category: string | null) => {
    switch (category) {
      case 'packing_list':
        return <Badge variant="default">Packing List</Badge>;
      case 'qc_report':
        return <Badge variant="default">QC Report</Badge>;
      case 'shipping_doc':
        return <Badge variant="secondary">Shipping</Badge>;
      case 'invoice':
        return <Badge variant="secondary">Invoice</Badge>;
      case 'certificate':
        return <Badge variant="secondary">Certificate</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  // Format file size
  const formatFileSize = (bytes: bigint | null) => {
    if (!bytes) return 'Unknown size';
    const num = Number(bytes);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Production Documents</h1>
          <p className="page-subtitle">Access and manage production documentation</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load documents"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => refetch(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading documents..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Production Documents</h1>
            <p className="page-subtitle">Access and manage production documentation</p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-4 bg-success/10 text-success border border-success/20 rounded-lg">
          <FileText className="h-5 w-5" />
          <span className="font-medium">Document uploaded successfully</span>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter by type */}
            <div className="w-full md:w-[200px]">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  <SelectItem value="packing_list">Packing Lists</SelectItem>
                  <SelectItem value="qc_report">QC Reports</SelectItem>
                  <SelectItem value="shipping_doc">Shipping</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
                  <SelectItem value="certificate">Certificates</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Library ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterType !== 'all'
                  ? 'No documents match your search criteria'
                  : 'No documents uploaded yet'
                }
              </p>
              {!searchQuery && filterType === 'all' && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Document Icon */}
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {getDocTypeBadge(doc.category)}
                          {doc.production_orders && (
                            <Badge variant="outline" className="text-xs">
                              Order #{doc.production_orders.order_number}
                            </Badge>
                          )}
                          {doc.quality_inspections && (
                            <Badge variant="outline" className="text-xs">
                              QC Inspection
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Uploaded {new Date(doc.created_at!).toLocaleDateString()} • {formatFileSize(doc.size)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(doc)}
                          disabled={!doc.url}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          disabled={!doc.url && !doc.download_url}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload production documents, QC reports, or shipping documentation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Selection */}
            <div>
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Document Type */}
            <div>
              <Label htmlFor="doc-type">Document Type</Label>
              <Select
                value={uploadForm.documentType}
                onValueChange={(value: any) =>
                  setUploadForm({ ...uploadForm, documentType: value })
                }
              >
                <SelectTrigger id="doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="packing_list">Packing List</SelectItem>
                  <SelectItem value="qc_report">QC Report</SelectItem>
                  <SelectItem value="shipping_doc">Shipping Document</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Production Order Selection */}
            <div>
              <Label htmlFor="order">Link to Production Order (Optional)</Label>
              <Select
                value={uploadForm.productionOrderId}
                onValueChange={(value) =>
                  setUploadForm({ ...uploadForm, productionOrderId: value })
                }
              >
                <SelectTrigger id="order">
                  <SelectValue placeholder="Select a production order..." />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Order #{order.order_number}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes about this document..."
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
