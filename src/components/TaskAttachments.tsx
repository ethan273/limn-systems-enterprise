"use client";

import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Paperclip,
  Plus,
  Download,
  Eye,
  MoreVertical,
  Trash2,
  Upload,
  FileText,
  Image,
  File,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uploadTaskAttachment } from "@/lib/storage";

interface TaskAttachmentsProps {
  taskId: string;
  onUpdate?: () => void;
}

export default function TaskAttachments({ taskId, onUpdate }: TaskAttachmentsProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: attachments, isLoading, refetch } = api.tasks.getAttachments.useQuery({
    task_id: taskId,
  });

  const deleteAttachmentMutation = api.tasks.deleteAttachment.useMutation({
    onSuccess: () => {
      refetch();
      onUpdate?.();
    },
  });

  const addAttachmentMutation = api.tasks.addAttachment.useMutation({
    onSuccess: () => {
      refetch();
      onUpdate?.();
    },
  });

  // Mock user ID - in production this would come from session
  const mockUserId = "550e8400-e29b-41d4-a716-446655440000";

  const handleDeleteAttachment = (attachmentId: string) => {
    if (confirm("Are you sure you want to delete this attachment?")) {
      deleteAttachmentMutation.mutate({
        id: attachmentId,
        user_id: mockUserId,
      });
    }
  };

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      return file.size <= maxSize && allowedTypes.includes(file.type);
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0 || uploading) return;

    setUploading(true);
    const progressUpdates: Record<string, number> = {};

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileKey = `${file.name}-${i}`;

        progressUpdates[fileKey] = 0;
        setUploadProgress({ ...progressUpdates });

        // Upload to Supabase Storage
        const uploadResult = await uploadTaskAttachment(
          taskId,
          file,
          (progress) => {
            progressUpdates[fileKey] = progress;
            setUploadProgress({ ...progressUpdates });
          }
        );

        if (uploadResult.success && uploadResult.data) {
          // Save attachment record to database
          await addAttachmentMutation.mutateAsync({
            task_id: taskId,
            file_name: file.name,
            file_path: uploadResult.data.path,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: mockUserId,
          });

          progressUpdates[fileKey] = 100;
        } else {
          console.error(`Upload failed for ${file.name}:`, uploadResult.error);
          // Remove failed file from progress
          delete progressUpdates[fileKey];
        }
      }

      // Clear selected files and close dialog
      setSelectedFiles([]);
      setUploadProgress({});
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (mimeType: string | null, fileName: string) => {
    if (!mimeType) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
        return <Image className="h-4 w-4 text-blue-400" />;
      }
      if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
        return <FileText className="h-4 w-4 text-green-400" />;
      }
      return <File className="h-4 w-4 text-gray-400" />;
    }

    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-400" />;
    }
    if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="h-4 w-4 text-green-400" />;
    }
    return <File className="h-4 w-4 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Paperclip className="h-4 w-4" />
          Attachments
        </div>
        <div className="text-sm text-gray-500">Loading attachments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Paperclip className="h-4 w-4" />
          Attachments ({attachments?.length || 0})
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add File
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Attachment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-400/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-400 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  PNG, JPG, PDF, DOC up to 50MB
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleInputChange}
                />

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-300">
                      Selected Files ({selectedFiles.length})
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedFiles.map((file, index) => {
                        const fileKey = `${file.name}-${index}`;
                        const progress = uploadProgress[fileKey] || 0;

                        return (
                          <div
                            key={fileKey}
                            className="flex items-center justify-between p-2 bg-gray-700 rounded text-xs"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getFileIcon(file.type, file.name)}
                              <span className="truncate">{file.name}</span>
                              <span className="text-gray-400">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>

                            {uploading && progress > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-600 rounded-full h-1">
                                  <div
                                    className="bg-blue-400 h-1 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span>{Math.round(progress)}%</span>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSelectedFile(index);
                                }}
                                className="text-red-400 hover:text-red-300"
                                disabled={uploading}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsUploadDialogOpen(false);
                    setSelectedFiles([]);
                    setUploadProgress({});
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={uploadFiles}
                  disabled={selectedFiles.length === 0 || uploading}
                >
                  {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length === 1 ? '' : 's'}`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {attachments && attachments.length > 0 ? (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 bg-gray-700/30 rounded border border-gray-600/50 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(attachment.mime_type, attachment.file_name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">
                    {attachment.file_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{formatFileSize(attachment.file_size)}</span>
                    <span>•</span>
                    <span>
                      {attachment.created_at
                        ? formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })
                        : 'Unknown'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-400"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                    disabled={deleteAttachmentMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500 py-2">
            No attachments yet
          </div>
        )}
      </div>
    </div>
  );
}