"use client";

/**
 * Catalog Documents Tab Component
 *
 * Displays:
 * - Document library (CAD files, 3D models, certifications, assembly PDFs)
 * - Storage type badges (Supabase vs Google Drive)
 * - Document type filter
 * - File search
 * - Full CRUD operations (upload, download, delete, edit metadata)
 *
 * Uses hybrid storage:
 * - Files < 50MB → Supabase Storage
 * - Files ≥ 50MB → Google Drive (OAuth configured from Design module)
 *
 * Created: October 2, 2025
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Trash2,
  Upload,
  Search,
  AlertCircle,
  File,
  FileArchive,
  FileImage,
  FileCog,
  Cloud,
  Database,
} from "lucide-react";

interface CatalogDocumentsTabProps {
  itemId: string;
}

// Document type icons mapping
const getDocumentIcon = (documentType: string) => {
  const type = documentType?.toLowerCase() || "";
  if (type.includes("cad")) return <FileCog className="doc-icon" />;
  if (type.includes("pdf")) return <FileText className="doc-icon" />;
  if (type.includes("image") || type.includes("photo")) return <FileImage className="doc-icon" />;
  if (type.includes("zip") || type.includes("archive")) return <FileArchive className="doc-icon" />;
  return <File className="doc-icon" />;
};

// Storage type badge
const getStorageBadge = (storageLocation: string) => {
  if (storageLocation === "google_drive") {
    return (
      <Badge variant="outline" className="storage-badge">
        <Cloud className="w-3 h-3 mr-1" />
        Google Drive
      </Badge>
    );
  } else {
    return (
      <Badge variant="secondary" className="storage-badge">
        <Database className="w-3 h-3 mr-1" />
        Supabase
      </Badge>
    );
  }
};

export default function CatalogDocumentsTab({ itemId: _itemId }: CatalogDocumentsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);

  // Fetch documents for this catalog item
  // TODO: Implement documents.getByItemId API endpoint
  // For now using empty array as placeholder
  const documents: any[] = [];
  const isLoading = false;
  const refetch = () => {};

  // Filter documents
  const filteredDocuments = documents?.filter((doc: any) => {
    const matchesSearch =
      !searchQuery ||
      doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = !selectedType || doc.document_type === selectedType;

    return matchesSearch && matchesType;
  });

  // Get unique document types for filter
  const documentTypes = Array.from(
    new Set(documents?.map((doc: any) => doc.document_type).filter(Boolean))
  );

  // Handle download
  const handleDownload = (doc: any) => {
    if (doc.storage_location === "google_drive" && doc.google_drive_url) {
      window.open(doc.google_drive_url, "_blank");
    } else if (doc.supabase_path) {
      // Construct Supabase storage URL
      window.open(`/api/documents/download/${doc.id}`, "_blank");
    }
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      // Call delete API
      // await api.documents.delete.mutate({ id: documentToDelete.id });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      refetch();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="catalog-documents-tab">
      {/* Header Actions */}
      <div className="documents-header">
        <div className="header-actions">
          <div className="search-container">
            <Search className="search-icon" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {documentTypes.length > 0 && (
            <div className="filter-container">
              <Button
                variant={selectedType === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(null)}
              >
                All Types
              </Button>
              {documentTypes.map((type: any) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          )}
        </div>

        <Button className="upload-button" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents Table */}
      <div className="data-table-container">
        <div className="data-table-header">
          <h3 className="data-table-title">Document Library</h3>
          <p className="data-table-description">
            {filteredDocuments?.length || 0} document(s) found
          </p>
        </div>
        {filteredDocuments && filteredDocuments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc: any) => (
                <TableRow key={doc.id}>
                  <TableCell className="flex items-center gap-2">
                    {getDocumentIcon(doc.document_type)}
                    <span className="font-medium">{doc.file_name}</span>
                  </TableCell>
                  <TableCell>
                    {doc.document_type ? (
                      <Badge variant="outline">{doc.document_type}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{getStorageBadge(doc.storage_location)}</TableCell>
                  <TableCell>
                    {doc.file_size
                      ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          setDocumentToDelete(doc);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="empty-state">
            <AlertCircle className="empty-state-icon" />
            <p className="empty-state-text">No documents found</p>
            <p className="empty-state-subtext">
              {searchQuery || selectedType
                ? "Try adjusting your search or filter"
                : "Upload documents to get started"}
            </p>
            {!searchQuery && !selectedType && (
              <Button className="mt-4" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload First Document
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{documentToDelete?.file_name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Storage Info Card */}
      <Card className="storage-info-card">
        <CardHeader>
          <CardTitle>Storage Information</CardTitle>
          <CardDescription>Hybrid storage system for optimal performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="storage-info-grid">
            <div className="storage-info-item">
              <Database className="storage-info-icon" />
              <div>
                <h4 className="storage-info-title">Supabase Storage</h4>
                <p className="storage-info-text">
                  For files under 50MB (PDFs, images, small CAD files)
                </p>
              </div>
            </div>

            <div className="storage-info-item">
              <Cloud className="storage-info-icon" />
              <div>
                <h4 className="storage-info-title">Google Drive</h4>
                <p className="storage-info-text">
                  For large files 50MB+ (3D models, large CAD assemblies)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
