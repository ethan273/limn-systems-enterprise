"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Upload, FileText, Download, Eye, HardDrive, Cloud } from "lucide-react";

export const dynamic = 'force-dynamic';

// Mock data for demonstration (will be replaced with real API in Day 7-9)
const mockDocuments = [
  {
    id: "1",
    file_name: "Modern Chair Design Specs.pdf",
    document_type: "Technical Drawing",
    file_size: 2457600,
    storage_type: "supabase",
    upload_date: new Date("2025-09-15"),
    status: "active",
  },
  {
    id: "2",
    file_name: "Material Samples Photos.zip",
    document_type: "Reference Images",
    file_size: 15728640,
    storage_type: "google_drive",
    upload_date: new Date("2025-09-20"),
    status: "active",
  },
  {
    id: "3",
    file_name: "Client Feedback Notes.docx",
    document_type: "Meeting Notes",
    file_size: 98304,
    storage_type: "supabase",
    upload_date: new Date("2025-09-22"),
    status: "active",
  },
  {
    id: "4",
    file_name: "3D Rendering Final.blend",
    document_type: "3D Model",
    file_size: 52428800,
    storage_type: "google_drive",
    upload_date: new Date("2025-09-25"),
    status: "active",
  },
];

export default function DesignDocumentsPage() {
  const [storageFilter, setStorageFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesStorage = storageFilter === "all" || doc.storage_type === storageFilter;
    const matchesType = typeFilter === "all" || doc.document_type === typeFilter;
    const matchesSearch = !searchQuery || doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStorage && matchesType && matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getStorageBadge = (storageType: string) => {
    switch (storageType) {
      case 'supabase':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            <HardDrive className="mr-1 h-3 w-3" />
            Supabase
          </Badge>
        );
      case 'google_drive':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <Cloud className="mr-1 h-3 w-3" />
            Google Drive
          </Badge>
        );
      default:
        return <Badge variant="outline">{storageType}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents Library</h1>
          <p className="text-muted-foreground">
            Manage design documents across Supabase and Google Drive
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 filters-section">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
        <Select value={storageFilter} onValueChange={setStorageFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by storage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Storage</SelectItem>
            <SelectItem value="supabase">Supabase</SelectItem>
            <SelectItem value="google_drive">Google Drive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Technical Drawing">Technical Drawing</SelectItem>
            <SelectItem value="Reference Images">Reference Images</SelectItem>
            <SelectItem value="Meeting Notes">Meeting Notes</SelectItem>
            <SelectItem value="3D Model">3D Model</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <FileText className="h-4 w-4" />
            <span>Total Documents</span>
          </div>
          <div className="text-2xl font-bold">{filteredDocuments.length}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <HardDrive className="h-4 w-4" />
            <span>Supabase</span>
          </div>
          <div className="text-2xl font-bold">
            {filteredDocuments.filter((d) => d.storage_type === "supabase").length}
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Cloud className="h-4 w-4" />
            <span>Google Drive</span>
          </div>
          <div className="text-2xl font-bold">
            {filteredDocuments.filter((d) => d.storage_type === "google_drive").length}
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <FileText className="h-4 w-4" />
            <span>Total Size</span>
          </div>
          <div className="text-2xl font-bold">
            {formatFileSize(filteredDocuments.reduce((sum, doc) => sum + doc.file_size, 0))}
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">No documents found</p>
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload your first document
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{doc.file_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.document_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(doc.file_size)}
                  </TableCell>
                  <TableCell>{getStorageBadge(doc.storage_type)}</TableCell>
                  <TableCell className="text-sm">
                    {doc.upload_date.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Placeholder Notice */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900">Document Management Placeholder</h3>
            <p className="text-sm text-yellow-700 mt-1">
              This page displays sample data for demonstration. Full document upload and management
              functionality (including Supabase Storage and Google Drive integration) will be
              implemented in Week 13-15 Day 7-9.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
