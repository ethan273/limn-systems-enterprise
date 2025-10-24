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
import { renderAllPdfPages } from "@/lib/pdf/client-processor";

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

      // If PDF upload, automatically extract and upload pages
      if (type === "pdf" && result.pageCount > 0) {
        toast.success(`PDF uploaded! Extracting ${result.pageCount} pages...`);

        try {
          await extractAndUploadPages(uploadFiles[0]!.file, flipbookId, result.pageCount);
          toast.success(`Successfully extracted and uploaded ${result.pageCount} pages!`);
        } catch (error) {
          console.error("Page extraction error:", error);
          toast.error(`PDF uploaded but page extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        toast.success(
          type === "pdf"
            ? `PDF uploaded successfully! ${result.pageCount} pages extracted.`
            : `${result.pagesAdded} images uploaded successfully!`
        );
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

  // Extract PDF pages and upload as images
  const extractAndUploadPages = async (pdfFile: File, flipbookId: string, pageCount: number) => {
    console.log(`[FlipbookUploader] Starting automatic page extraction for ${pageCount} pages...`);

    // Render all PDF pages to images using PDF.js
    const pages = await renderAllPdfPages(pdfFile, {
      scale: 2.0,
      format: 'jpeg',
      quality: 0.9,
    }, (current, total) => {
      console.log(`[FlipbookUploader] Extracted page ${current}/${total}`);
    });

    console.log(`[FlipbookUploader] Successfully extracted ${pages.length} pages, uploading to server...`);

    // Create FormData with all page images
    const formData = new FormData();
    formData.append('flipbookId', flipbookId);

    // Convert blobs to files and add to FormData
    pages.forEach((page, index) => {
      const file = new File([page.blob], `page-${index + 1}.jpg`, { type: 'image/jpeg' });
      formData.append('files', file);
    });

    // Upload all pages to the server
    const response = await fetch('/api/flipbooks/upload-images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload pages');
    }

    const result = await response.json();
    console.log(`[FlipbookUploader] Successfully uploaded ${result.pagesAdded} pages to server`);

    return result;
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
