"use client";

/**
 * File Uploader Component
 *
 * Hybrid file upload with drag-and-drop support.
 * Automatically routes to Supabase (<50MB) or Google Drive (≥50MB).
 */

import { useState, useCallback } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api/client';
import {
 determineStorageType,
 validateFile,
 formatFileSize,
 getStorageTypeLabel,
 getStorageTypeBadgeColor,
 type StorageType,
} from '@/lib/storage/hybrid-storage';
// Upload functions moved to API route to avoid Node.js imports in client

interface FileUploaderProps {
 projectId?: string;
 briefId?: string;
 category?: string;
 onUploadComplete?: () => void;
 maxFiles?: number;
 allowedTypes?: string[];
}

interface UploadingFile {
 file: File;
 progress: number;
 status: 'uploading' | 'success' | 'error';
 error?: string;
 storageType?: StorageType;
}

export function FileUploader({
 projectId,
 briefId,
 category,
 onUploadComplete,
 maxFiles = 10,
 allowedTypes,
}: FileUploaderProps) {
 const [isDragging, setIsDragging] = useState(false);
 const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

 const { data: connectionStatus } = api.oauth.getConnectionStatus.useQuery();
 const getAccessToken = api.storage.getAccessToken.useQuery(undefined, {
 enabled: false, // Only fetch when needed
 });
 const recordUpload = api.storage.recordUpload.useMutation();

 const handleFiles = useCallback(
 async (files: FileList) => {
 const fileArray = Array.from(files).slice(0, maxFiles);

 // Validate files
 const validatedFiles: UploadingFile[] = [];
 for (const file of fileArray) {
 const validation = validateFile(file);
 if (!validation.valid) {
 validatedFiles.push({
 file,
 progress: 0,
 status: 'error',
 error: validation.error,
 });
 continue;
 }

 // Check storage type
 const storageType = determineStorageType(file.size);

 // If Google Drive and not connected, show error
 if (storageType === 'google_drive' && !connectionStatus?.connected) {
 validatedFiles.push({
 file,
 progress: 0,
 status: 'error',
 storageType,
 error: 'Google Drive not connected. Please connect your account for files ≥50MB.',
 });
 continue;
 }

 validatedFiles.push({
 file,
 progress: 0,
 status: 'uploading',
 storageType,
 });
 }

 setUploadingFiles(prev => [...prev, ...validatedFiles]);

 // Upload each file
 for (let i = 0; i < validatedFiles.length; i++) {
 // eslint-disable-next-line security/detect-object-injection
 const uploadFile = validatedFiles[i];
 if (!uploadFile || uploadFile.status === 'error') continue;

 try {
 const file = uploadFile.file;
 const storageType = uploadFile.storageType!;

 // Get access token if needed for Google Drive
 let accessToken: string | null = null;
 if (storageType === 'google_drive') {
 const { data: tokenData } = await getAccessToken.refetch();
 if (!tokenData?.accessToken) {
 throw new Error('Could not get Google Drive access token');
 }
 accessToken = tokenData.accessToken;
 }

 // Upload via API route (server-side to avoid Node.js imports in client)
 const uploadFormData = new FormData();
 uploadFormData.append('file', file);
 if (accessToken) {
 uploadFormData.append('accessToken', accessToken);
 }
 if (category) {
 uploadFormData.append('category', category);
 }
 if (projectId) {
 uploadFormData.append('projectId', projectId);
 }
 if (briefId) {
 uploadFormData.append('briefId', briefId);
 }

 const uploadResponse = await fetch('/api/upload', {
 method: 'POST',
 body: uploadFormData,
 });

 if (!uploadResponse.ok) {
 const errorData = await uploadResponse.json();
 throw new Error(errorData.error || 'Upload failed');
 }

 const result = await uploadResponse.json();

 if (!result.success) {
 throw new Error(result.error || 'Upload failed');
 }

 // Record in database
 await recordUpload.mutateAsync({
 fileName: file.name,
 fileSize: file.size,
 fileType: file.type,
 storageType: result.storageType,
 storagePath: result.storagePath,
 googleDriveId: result.fileId,
 publicUrl: result.publicUrl,
 projectId,
 briefId,
 category,
 });

 // Update status to success
 setUploadingFiles(prev =>
 prev.map((f, idx) =>
 idx === i
 ? { ...f, progress: 100, status: 'success' as const }
 : f
 )
 );
 } catch (error) {
 // Update status to error
 setUploadingFiles(prev =>
 prev.map((f, idx) =>
 idx === i
 ? {
 ...f,
 status: 'error' as const,
 error: error instanceof Error ? error.message : 'Upload failed',
 }
 : f
 )
 );
 }
 }

 // Call completion callback
 if (onUploadComplete) {
 onUploadComplete();
 }
 },
 [
 maxFiles,
 connectionStatus,
 projectId,
 briefId,
 category,
 recordUpload,
 getAccessToken,
 onUploadComplete,
 ]
 );

 const handleDragOver = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(true);
 }, []);

 const handleDragLeave = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);
 }, []);

 const handleDrop = useCallback(
 (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);

 const files = e.dataTransfer.files;
 if (files.length > 0) {
 void handleFiles(files);
 }
 },
 [handleFiles]
 );

 const handleFileSelect = useCallback(
 (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = e.target.files;
 if (files && files.length > 0) {
 void handleFiles(files);
 }
 // Reset input so same file can be selected again
 e.target.value = '';
 },
 [handleFiles]
 );

 const removeFile = useCallback((index: number) => {
 setUploadingFiles(prev => prev.filter((_, i) => i !== index));
 }, []);

 const clearCompleted = useCallback(() => {
 setUploadingFiles(prev => prev.filter(f => f.status === 'uploading'));
 }, []);

 return (
 <div className="space-y-4">
 {/* Upload Area */}
 <div
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 className={`
 border-2 border-dashed rounded-lg p-8 text-center transition-colors
 ${
 isDragging
 ? 'border-blue-500 bg-blue-500/10'
 : 'border card/50'
 }
 `}
 >
 <Upload className="w-12 h-12 mx-auto mb-4 text-secondary" />
 <p className="text-lg font-semibold mb-2">
 Drop files here or click to browse
 </p>
 <p className="text-sm text-secondary mb-4">
 Files under 50MB → Supabase Storage
 <br />
 Files 50MB and larger → Google Drive
 </p>
 <input
 type="file"
 id="file-upload"
 multiple
 onChange={handleFileSelect}
 className="hidden"
 accept={allowedTypes?.join(',')}
 />
 <label htmlFor="file-upload">
 <Button asChild>
 <span>Select Files</span>
 </Button>
 </label>
 </div>

 {/* Google Drive Connection Status */}
 {!connectionStatus?.connected && (
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 Files ≥50MB require Google Drive. Please connect your account to upload large files.
 </AlertDescription>
 </Alert>
 )}

 {/* Uploading Files */}
 {uploadingFiles.length > 0 && (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <h3 className="font-semibold">Uploading {uploadingFiles.length} file(s)</h3>
 {uploadingFiles.some(f => f.status !== 'uploading') && (
 <Button variant="outline" size="sm" onClick={clearCompleted}>
 Clear Completed
 </Button>
 )}
 </div>

 <div className="space-y-2">
 {uploadingFiles.map((uploadFile, index) => (
 <div
 key={index}
 className="border border rounded-lg p-4 space-y-2"
 >
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-3 flex-1">
 <File className="w-5 h-5 text-secondary mt-0.5" />
 <div className="flex-1 min-w-0">
 <p className="font-medium truncate">{uploadFile.file.name}</p>
 <div className="flex items-center gap-2 text-sm text-secondary">
 <span>{formatFileSize(uploadFile.file.size)}</span>
 {uploadFile.storageType && (
 <span
 className={`px-2 py-0.5 rounded-full text-xs border ${getStorageTypeBadgeColor(
 uploadFile.storageType
 )}`}
 >
 {getStorageTypeLabel(uploadFile.storageType)}
 </span>
 )}
 </div>
 </div>
 </div>

 {uploadFile.status === 'success' && (
 <CheckCircle className="w-5 h-5 text-green-500" />
 )}
 {uploadFile.status === 'error' && (
 <AlertCircle className="w-5 h-5 text-red-500" />
 )}
 {uploadFile.status !== 'uploading' && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => removeFile(index)}
 >
 <X className="w-4 h-4" />
 </Button>
 )}
 </div>

 {uploadFile.status === 'uploading' && (
 <Progress value={uploadFile.progress} />
 )}

 {uploadFile.error && (
 <p className="text-sm text-red-500">{uploadFile.error}</p>
 )}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
