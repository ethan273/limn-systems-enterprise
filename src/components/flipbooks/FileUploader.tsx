"use client";

/**
 * File Uploader Component
 *
 * Drag-and-drop file uploader for PDFs and images
 * PDFs upload directly to Cloudinary to bypass Vercel body size limits
 * Images use API route upload
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
  const CACHE_BUSTER = "v2"; // Force bundle hash change

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

  // Upload files directly to Cloudinary (for PDFs) or via API (for images)
  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Update status to uploading
      setUploadFiles((prev) =>
        prev.map((f) => ({ ...f, status: "uploading" as const }))
      );

      if (type === "pdf") {
        // Direct upload to Cloudinary for PDFs (bypasses Vercel body size limits)
        await uploadPdfToCloudinary();
      } else {
        // Use API route for images (smaller files, no size limit issues)
        await uploadImagesToAPI();
      }
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

  // Upload PDF directly to Cloudinary (client-side upload)
  const uploadPdfToCloudinary = async () => {
    const file = uploadFiles[0]!.file;

    // Step 1: Get signed upload parameters from our API
    const signatureResponse = await fetch("/api/flipbooks/upload-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flipbookId }),
    });

    if (!signatureResponse.ok) {
      const error = await signatureResponse.json();
      throw new Error(error.error || "Failed to get upload signature");
    }

    const uploadConfig = await signatureResponse.json();

    // Step 2: Upload directly to Cloudinary using XMLHttpRequest for progress tracking
    const cloudinaryUpload = await new Promise<any>((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", uploadConfig.apiKey);
      formData.append("timestamp", uploadConfig.timestamp.toString());
      formData.append("signature", uploadConfig.signature);
      formData.append("public_id", uploadConfig.publicId);
      formData.append("folder", uploadConfig.folder);
      formData.append("resource_type", "image");
      formData.append("overwrite", "true");
      formData.append("invalidate", "true");
      formData.append("pages", "true");

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 90); // Reserve 10% for processing
          setUploadFiles((prev) =>
            prev.map((f) => ({
              ...f,
              progress: percentComplete,
            }))
          );
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Cloudinary upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${uploadConfig.cloudName}/image/upload`);
      xhr.send(formData);
    });

    console.log("[Cloudinary Upload] Complete:", cloudinaryUpload);

    // Step 3: Trigger page extraction on our backend
    setUploadFiles((prev) =>
      prev.map((f) => ({
        ...f,
        progress: 95,
      }))
    );

    const extractResponse = await fetch("/api/flipbooks/extract-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flipbookId,
        cloudinaryPublicId: cloudinaryUpload.public_id,
        cloudinaryUrl: cloudinaryUpload.secure_url,
        pageCount: cloudinaryUpload.pages || 0,
      }),
    });

    if (!extractResponse.ok) {
      const error = await extractResponse.json();
      throw new Error(error.error || "Failed to extract pages");
    }

    const result = await extractResponse.json();

    // Mark as success
    setUploadFiles((prev) =>
      prev.map((f) => ({
        ...f,
        status: "success" as const,
        progress: 100,
      }))
    );

    toast.success(
      `PDF uploaded! Extracting ${result.pagesExtracted || cloudinaryUpload.pages} pages...`,
      {
        description: "Pages will appear shortly. You can continue working.",
        duration: 5000,
      }
    );

    onUploadComplete?.(result);

    // Clear files after success
    setTimeout(() => {
      setUploadFiles([]);
    }, 2000);
  };

  // Upload images via API route (existing flow)
  const uploadImagesToAPI = async () => {
    const formData = new FormData();
    formData.append("flipbookId", flipbookId);
    uploadFiles.forEach((uf) => {
      formData.append("files", uf.file);
    });

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadFiles((prev) =>
        prev.map((f) => ({
          ...f,
          progress: Math.min(f.progress + 10, 90),
        }))
      );
    }, 200);

    const response = await fetch("/api/flipbooks/upload-images", {
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

    toast.success(`${result.pagesAdded} images uploaded successfully!`);

    onUploadComplete?.(result);

    // Clear files after success
    setTimeout(() => {
      setUploadFiles([]);
    }, 2000);
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
