"use client";

/**
 * Design Documents Library Page
 *
 * Integrated with hybrid storage system (Supabase + Google Drive).
 * Week 13-15 Day 9: Updated with real API integration.
 */

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 Search,
 Upload,
 FileText,
 Eye,
 HardDrive,
 Cloud,
 Trash2,
 AlertCircle,
 CheckCircle,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { FileUploader } from "@/components/design/FileUploader";
import { formatFileSize } from "@/lib/storage/hybrid-storage";

export const dynamic = 'force-dynamic';

function DesignDocumentsContent() {
 const [storageFilter, setStorageFilter] = useState<string>("all");
 const [categoryFilter, setCategoryFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
 const [page, setPage] = useState(0);
 const pageSize = 20;

 const { user, loading: authLoading } = useAuthContext();
 const router = useRouter();

 // Get Google Drive service account status
 const { data: driveStatus } = api.storage.getDriveStatus.useQuery();

 // Get files list
 const {
 data: filesData,
 isLoading: filesLoading,
 refetch: refetchFiles,
 } = api.storage.listFiles.useQuery({
 storageType: storageFilter === "all" ? undefined : (storageFilter as "supabase" | "google_drive"),
 category: categoryFilter === "all" ? undefined : categoryFilter,
 limit: pageSize,
 offset: page * pageSize,
 });

 // Get storage stats
 const { data: stats } = api.storage.getStorageStats.useQuery();

 // Delete file mutation
 const deleteFile = api.storage.deleteFile.useMutation({
 onSuccess: () => {
 void refetchFiles();
 },
 });

 useEffect(() => {
 if (!authLoading && !user) {
 router.push("/login");
 }
 }, [authLoading, user, router]);

 const handleDelete = async (fileId: string) => {
 if (!confirm('Are you sure you want to delete this file?')) {
 return;
 }

 await deleteFile.mutateAsync({ fileId });
 };

 const getStorageBadge = (storageType: string) => {
 switch (storageType) {
 case 'supabase':
 return (
 <Badge variant="outline" className="badge-info">
 <HardDrive className="mr-1 h-3 w-3" />
 Supabase
 </Badge>
 );
 case 'google_drive':
 return (
 <Badge variant="outline" className="badge-active">
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
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border mx-auto mb-4"></div>
 <p className="text-muted-foreground">Loading...</p>
 </div>
 </div>
 </div>
 );
 }

 if (!user) {
 return null;
 }

 const files = filesData?.files || [];
 const total = filesData?.total || 0;

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
 <Button onClick={() => setUploadDialogOpen(true)}>
 <Upload className="mr-2 h-4 w-4" />
 Upload Document
 </Button>
 </div>

 {/* Google Drive Status - Service Account */}
 {driveStatus && !driveStatus.connected && (
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 <span>
 Google Drive not configured. Service account setup required for files ≥50MB.
 {driveStatus.errors && driveStatus.errors.length > 0 && (
 <span className="block text-xs mt-1 text-muted-foreground">
 {driveStatus.errors.join(', ')}
 </span>
 )}
 </span>
 </AlertDescription>
 </Alert>
 )}

 {driveStatus && driveStatus.connected && (
 <Alert>
 <CheckCircle className="h-4 w-4" />
 <AlertDescription>
 <span>
 Google Drive connected via service account - ready for large file uploads
 </span>
 </AlertDescription>
 </Alert>
 )}

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
 <Select value={categoryFilter} onValueChange={setCategoryFilter}>
 <SelectTrigger className="w-[200px]">
 <SelectValue placeholder="Filter by category" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Categories</SelectItem>
 <SelectItem value="image">Images</SelectItem>
 <SelectItem value="document">Documents</SelectItem>
 <SelectItem value="pdf">PDFs</SelectItem>
 <SelectItem value="video">Videos</SelectItem>
 <SelectItem value="file">Other Files</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Summary Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="p-4 border rounded-lg card/50">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <FileText className="h-4 w-4" />
 <span>Total Documents</span>
 </div>
 <div className="text-2xl font-bold">{stats?.total.files || 0}</div>
 <div className="text-xs text-muted-foreground mt-1">
 {formatFileSize(stats?.total.size || 0)}
 </div>
 </div>
 <div className="p-4 border rounded-lg card/50">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <HardDrive className="h-4 w-4" />
 <span>Supabase</span>
 </div>
 <div className="text-2xl font-bold">{stats?.supabase.files || 0}</div>
 <div className="text-xs text-muted-foreground mt-1">
 {formatFileSize(stats?.supabase.size || 0)}
 </div>
 </div>
 <div className="p-4 border rounded-lg card/50">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <Cloud className="h-4 w-4" />
 <span>Google Drive</span>
 </div>
 <div className="text-2xl font-bold">{stats?.googleDrive.files || 0}</div>
 <div className="text-xs text-muted-foreground mt-1">
 {formatFileSize(stats?.googleDrive.size || 0)}
 </div>
 </div>
 <div className="p-4 border rounded-lg card/50">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <FileText className="h-4 w-4" />
 <span>Average Size</span>
 </div>
 <div className="text-2xl font-bold">
 {stats && stats.total.files > 0
 ? formatFileSize(Math.floor(stats.total.size / stats.total.files))
 : '0 B'}
 </div>
 </div>
 </div>

 {/* Documents Table */}
 <div className="rounded-md border ">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>File Name</TableHead>
 <TableHead>Category</TableHead>
 <TableHead>Size</TableHead>
 <TableHead>Storage</TableHead>
 <TableHead>Upload Date</TableHead>
 <TableHead>Uploaded By</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filesLoading ? (
 <TableRow>
 <TableCell colSpan={7} className="text-center py-8">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border mx-auto"></div>
 </TableCell>
 </TableRow>
 ) : files.length === 0 ? (
 <TableRow>
 <TableCell colSpan={7} className="text-center py-8">
 <div className="space-y-2">
 <p className="text-muted-foreground">No documents found</p>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setUploadDialogOpen(true)}
 >
 <Upload className="mr-2 h-4 w-4" />
 Upload your first document
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ) : (
 files.map((file) => (
 <TableRow key={file.id}>
 <TableCell>
 <div className="flex items-center gap-2">
 <FileText className="h-4 w-4 text-muted-foreground" />
 <span className="font-medium">{file.file_name}</span>
 </div>
 </TableCell>
 <TableCell>
 <Badge variant="outline">{file.file_type || 'file'}</Badge>
 </TableCell>
 <TableCell className="text-sm text-muted-foreground">
 {formatFileSize(file.file_size || 0)}
 </TableCell>
 <TableCell>{getStorageBadge(file.storage_type || 'supabase')}</TableCell>
 <TableCell className="text-sm">
 {new Date(file.created_at || new Date()).toLocaleDateString()}
 </TableCell>
 <TableCell className="text-sm text-muted-foreground">
 {
 file.users?.email ||
 'Unknown'}
 </TableCell>
 <TableCell className="text-right">
 <div className="flex items-center justify-end gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => {
 if (file.google_drive_url) {
 window.open(file.google_drive_url, '_blank');
 }
 }}
 >
 <Eye className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => void handleDelete(file.id)}
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>

 {/* Pagination */}
 {total > pageSize && (
 <div className="flex items-center justify-between">
 <div className="text-sm text-muted-foreground">
 Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} documents
 </div>
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(p => Math.max(0, p - 1))}
 disabled={page === 0}
 >
 Previous
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(p => p + 1)}
 disabled={(page + 1) * pageSize >= total}
 >
 Next
 </Button>
 </div>
 </div>
 )}

 {/* Upload Dialog */}
 <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>Upload Documents</DialogTitle>
 <DialogDescription>
 Upload files to your document library. Files under 50MB are stored in Supabase,
 files 50MB and larger are stored in Google Drive.
 </DialogDescription>
 </DialogHeader>

 <FileUploader
 onUploadComplete={() => {
 setUploadDialogOpen(false);
 void refetchFiles();
 }}
 />
 </DialogContent>
 </Dialog>
 </div>
 );
}

export default function DesignDocumentsPage() {
 return (
 <Suspense fallback={
 <div className="container mx-auto py-6">
 <div className="flex items-center justify-center h-64">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border mx-auto mb-4"></div>
 <p className="text-muted-foreground">Loading...</p>
 </div>
 </div>
 </div>
 }>
 <DesignDocumentsContent />
 </Suspense>
 );
}
