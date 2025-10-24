"use client";

/**
 * File Uploader Component
 *
 * Drag-and-drop file uploader for PDFs and images
 * Integrates with flipbook upload API routes
 */

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploaderProps {
  flipbookId: string;
  type: "pdf" | "images";
  onUploadComplete?: (_result: any) => void;
  onUploadError?: (_error: Error) => void;
  className?: string;
}

interface UploadFile {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

export function FileUploader({
  flipbookId,
  type,
  onUploadComplete,
  onUploadError,
  className,
}: FileUploaderProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const acceptedFileTypes: Record<string, string[]> = type === "pdf"
    ? { "application/pdf": [".pdf"] }
    : { "image/*": [".jpg", ".jpeg", ".png", ".webp"] };

  const maxFiles = type === "pdf" ? 1 : 20;

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
        file,
        status: "pending",
        progress: 0,
      }));

      setUploadFiles(newFiles);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles,
    disabled: isUploading,
  });

  // Upload files
  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("flipbookId", flipbookId);

      if (type === "pdf") {
        formData.append("file", uploadFiles[0]!.file);
      } else {
        uploadFiles.forEach((uf) => {
          formData.append("files", uf.file);
        });
      }

      // Update status to uploading
      setUploadFiles((prev) =>
        prev.map((f) => ({ ...f, status: "uploading" as const }))
      );

      const endpoint =
        type === "pdf" ? "/api/flipbooks/upload-pdf" : "/api/flipbooks/upload-images";

      // Simulate progress (real implementation would use XMLHttpRequest for progress tracking)
      const progressInterval = setInterval(() => {
        setUploadFiles((prev) =>
          prev.map((f) => ({
            ...f,
            progress: Math.min(f.progress + 10, 90),
          }))
        );
      }, 200);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      // Mark as success
      setUploadFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: "success" as const,
          progress: 100,
        }))
      );

      // Show different messages based on upload type
      if (type === "pdf") {
        if (result.extractionTriggered) {
          toast.success(
            `PDF uploaded! Extracting ${result.pageCount} pages automatically...`,
            {
              description: "Pages will appear shortly. You can continue working while extraction completes.",
              duration: 5000,
            }
          );
        } else {
          toast.success(`PDF uploaded successfully! ${result.pageCount} pages detected.`);
        }
      } else {
        toast.success(`${result.pagesAdded} images uploaded successfully!`);
      }

      onUploadComplete?.(result);

      // Clear files after success
      setTimeout(() => {
        setUploadFiles([]);
      }, 2000);
    } catch (error: any) {
      console.error("Upload error:", error);

      setUploadFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: "error" as const,
          error: error.message,
        }))
      );

      toast.error(`Upload failed: ${error.message}`);
      onUploadError?.(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all
  const clearAll = () => {
    setUploadFiles([]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
          isDragActive && "border-primary bg-accent",
          isUploading && "pointer-events-none opacity-50",
          !isDragActive && !isUploading && "hover:border-primary hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {type === "pdf" ? (
            <FileText className="h-12 w-12 text-muted-foreground" aria-label="PDF file icon" />
          ) : (
            <Image className="h-12 w-12 text-muted-foreground" aria-label="Image file icon" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isDragActive
                ? `Drop ${type === "pdf" ? "PDF" : "images"} here`
                : `Drag & drop ${type === "pdf" ? "a PDF" : "images"} here`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {type === "pdf"
              ? "Accepts PDF files up to 100MB"
              : `Accepts JPG, PNG, WebP (max ${maxFiles} files)`}
          </p>
        </div>
      </div>

      {/* File list */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {uploadFiles.length} {uploadFiles.length === 1 ? "file" : "files"} selected
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={isUploading}
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadFiles.map((uploadFile, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {uploadFile.status === "pending" && (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  {uploadFile.status === "uploading" && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                  {uploadFile.status === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                  {uploadFile.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadFile.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploadFile.status === "uploading" && (
                      <p className="text-xs text-primary">
                        {uploadFile.progress}%
                      </p>
                    )}
                    {uploadFile.status === "error" && (
                      <p className="text-xs text-destructive">{uploadFile.error}</p>
                    )}
                  </div>

                  {/* Progress bar */}
                  {uploadFile.status === "uploading" && (
                    <Progress value={uploadFile.progress} className="h-1 mt-2" />
                  )}
                </div>

                {/* Remove button */}
                {uploadFile.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Upload button */}
          {uploadFiles.some((f) => f.status === "pending") && (
            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {uploadFiles.length} {uploadFiles.length === 1 ? "file" : "files"}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
