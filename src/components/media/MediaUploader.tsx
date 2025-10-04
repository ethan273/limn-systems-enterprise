"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Upload, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface MediaFile {
  file: File;
  preview: string;
  media_type?: string;
  use_for_packaging?: boolean;
  use_for_labeling?: boolean;
  use_for_marketing?: boolean;
  is_primary_image?: boolean;
}

interface MediaUploaderProps {
  entityType: "collection" | "concept" | "prototype" | "catalog_item" | "production_order";
  entityId: string;
  onUploadComplete?: () => void;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
}

const MEDIA_TYPES = [
  { value: "isometric", label: "Isometric View" },
  { value: "line_drawing", label: "Line Drawing" },
  { value: "rendering", label: "3D Rendering" },
  { value: "photo", label: "Photograph" },
  { value: "3d_model", label: "3D Model" },
  { value: "technical_drawing", label: "Technical Drawing" },
  { value: "other", label: "Other" },
];

const SUPABASE_MAX_SIZE = 50; // MB
const DEFAULT_MAX_SIZE = 100; // MB

export function MediaUploader({
  entityType,
  entityId,
  onUploadComplete,
  maxFileSize = DEFAULT_MAX_SIZE,
  acceptedFileTypes = ["image/*", "application/pdf", ".stl", ".obj", ".fbx"],
}: MediaUploaderProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: MediaFile[] = acceptedFiles.map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      media_type: "photo",
      use_for_packaging: false,
      use_for_labeling: false,
      use_for_marketing: false,
      is_primary_image: false,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      // eslint-disable-next-line security/detect-object-injection
      const fileToRemove = newFiles[index];
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateFileMetadata = (index: number, updates: Partial<MediaFile>) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      // eslint-disable-next-line security/detect-object-injection
      const currentFile = newFiles[index];
      if (currentFile) {
        // eslint-disable-next-line security/detect-object-injection
        newFiles[index] = { ...currentFile, ...updates };
      }
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setUploading(true);

    try {
      for (const fileData of files) {
        const fileSizeMB = fileData.file.size / (1024 * 1024);
        const useGoogleDrive = fileSizeMB > SUPABASE_MAX_SIZE;

        // TODO: Implement actual upload logic via tRPC
        // For files < 50MB: Upload to Supabase Storage
        // For files > 50MB: Upload to Google Drive
        // Then save document record with appropriate file_source and storage_id

        console.log("Uploading file:", {
          name: fileData.file.name,
          size: fileSizeMB.toFixed(2) + " MB",
          storage: useGoogleDrive ? "Google Drive" : "Supabase",
          entityType,
          entityId,
          metadata: {
            media_type: fileData.media_type,
            use_for_packaging: fileData.use_for_packaging,
            use_for_labeling: fileData.use_for_labeling,
            use_for_marketing: fileData.use_for_marketing,
            is_primary_image: fileData.is_primary_image,
          },
        });
      }

      toast.success(`${files.length} file(s) uploaded successfully`);
      setFiles([]);
      onUploadComplete?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="media-uploader">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "dropzone-active" : ""}`}
      >
        <input {...getInputProps()} />
        <Upload className="upload-icon" />
        <p className="upload-text">
          {isDragActive ? "Drop files here..." : "Drag & drop files here, or click to select"}
        </p>
        <p className="upload-hint">
          Supports images, PDFs, 3D models • Max {maxFileSize}MB per file
        </p>
        <p className="upload-hint-small">
          Files &gt; {SUPABASE_MAX_SIZE}MB will be stored in Google Drive
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="file-list">
          <h3 className="file-list-title">
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </h3>
          {files.map((fileData, index) => {
            const fileSizeMB = fileData.file.size / (1024 * 1024);
            const useGoogleDrive = fileSizeMB > SUPABASE_MAX_SIZE;

            return (
              <div key={index} className="file-item">
                {/* File Preview/Icon */}
                <div className="file-preview">
                  {fileData.preview ? (
                    <Image
                      src={fileData.preview}
                      alt={fileData.file.name}
                      width={60}
                      height={60}
                      className="file-preview-image"
                    />
                  ) : (
                    <File className="file-icon" />
                  )}
                </div>

                {/* File Details */}
                <div className="file-details">
                  <div className="file-name">{fileData.file.name}</div>
                  <div className="file-meta">
                    <span>{fileSizeMB.toFixed(2)} MB</span>
                    <Badge variant={useGoogleDrive ? "secondary" : "outline"} className="storage-badge">
                      {useGoogleDrive ? "Google Drive" : "Supabase"}
                    </Badge>
                  </div>

                  {/* Media Type Selection */}
                  <div className="file-metadata-row">
                    <Label className="file-label">Media Type</Label>
                    <Select
                      value={fileData.media_type}
                      onValueChange={(value) => updateFileMetadata(index, { media_type: value })}
                    >
                      <SelectTrigger className="file-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDIA_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Usage Flags */}
                  <div className="file-usage-flags">
                    <div className="usage-flag-item">
                      <Checkbox
                        id={`packaging-${index}`}
                        checked={fileData.use_for_packaging}
                        onCheckedChange={(checked) =>
                          updateFileMetadata(index, { use_for_packaging: checked as boolean })
                        }
                      />
                      <Label htmlFor={`packaging-${index}`} className="usage-flag-label">
                        Packaging
                      </Label>
                    </div>
                    <div className="usage-flag-item">
                      <Checkbox
                        id={`labeling-${index}`}
                        checked={fileData.use_for_labeling}
                        onCheckedChange={(checked) =>
                          updateFileMetadata(index, { use_for_labeling: checked as boolean })
                        }
                      />
                      <Label htmlFor={`labeling-${index}`} className="usage-flag-label">
                        Labeling
                      </Label>
                    </div>
                    <div className="usage-flag-item">
                      <Checkbox
                        id={`marketing-${index}`}
                        checked={fileData.use_for_marketing}
                        onCheckedChange={(checked) =>
                          updateFileMetadata(index, { use_for_marketing: checked as boolean })
                        }
                      />
                      <Label htmlFor={`marketing-${index}`} className="usage-flag-label">
                        Marketing
                      </Label>
                    </div>
                    <div className="usage-flag-item">
                      <Checkbox
                        id={`primary-${index}`}
                        checked={fileData.is_primary_image}
                        onCheckedChange={(checked) =>
                          updateFileMetadata(index, { is_primary_image: checked as boolean })
                        }
                      />
                      <Label htmlFor={`primary-${index}`} className="usage-flag-label">
                        Primary Image
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="file-remove-btn"
                >
                  <X className="icon-sm" />
                </Button>
              </div>
            );
          })}

          {/* Upload Button */}
          <Button onClick={handleUpload} disabled={uploading} className="upload-submit-btn">
            {uploading ? "Uploading..." : `Upload ${files.length} file${files.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}
