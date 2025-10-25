"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload, FileUp, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

/**
 * PDF Upload Page for Flipbooks
 *
 * Allows users to create a flipbook by uploading a PDF file.
 * The PDF will be processed and converted into individual pages.
 */
export default function FlipbookUploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Create flipbook mutation
  const createMutation = api.flipbooks.create.useMutation();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      // Auto-fill title from filename if empty
      if (!title) {
        const filename = droppedFile.name.replace(/\.pdf$/i, "");
        setTitle(filename);
      }
    } else {
      toast.error("Please upload a PDF file");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        // Auto-fill title from filename if empty
        if (!title) {
          const filename = selectedFile.name.replace(/\.pdf$/i, "");
          setTitle(filename);
        }
      } else {
        toast.error("Please upload a PDF file");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Create flipbook record
      const flipbook = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      toast.info("Processing PDF in browser...");

      // Step 2: Process PDF pages client-side using shared PDF utility
      // This bypasses Vercel's body size limits by rendering pages in the browser
      const { renderAllPdfPages } = await import("@/lib/pdf/client-processor");

      const pageResults = await renderAllPdfPages(
        file,
        { scale: 2.0, format: 'jpeg', quality: 0.9 },
        (current, total) => {
          toast.info(`Processing page ${current}/${total}`);
        }
      );

      const pageBlobs = pageResults.map(result => result.blob);
      const pageCount = pageBlobs.length;

      toast.success(`Processed ${pageCount} pages! Uploading...`);

      // Step 4: Upload rendered pages to server
      const imagesFormData = new FormData();
      imagesFormData.append("flipbookId", flipbook.id);

      for (let i = 0; i < pageBlobs.length; i++) {
        const blob = pageBlobs.at(i);
        if (blob) {
          imagesFormData.append("files", blob, `page-${i + 1}.jpg`);
        }
      }

      const imagesResponse = await fetch("/api/flipbooks/upload-images", {
        method: "POST",
        body: imagesFormData,
      });

      if (!imagesResponse.ok) {
        const error = await imagesResponse.json();
        throw new Error(error.error || "Failed to upload page images");
      }

      toast.success(`Flipbook created with ${pageCount} pages!`);
      queryClient.invalidateQueries({ queryKey: ['flipbooks'] });

      // Redirect to builder
      router.push(`/flipbooks/builder?id=${flipbook.id}`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload PDF: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Create Flipbook from PDF"
        subtitle="Upload a PDF file to create an interactive flipbook"
        actions={[
          {
            label: 'Back to Library',
            icon: ArrowLeft,
            variant: 'outline',
            onClick: () => router.push("/flipbooks"),
          },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-lg border p-8 space-y-6">
          {/* Title and Description */}
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summer Collection 2025"
                className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isUploading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the flipbook"
                rows={3}
                className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium mb-2">
              PDF File *
            </label>

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragOver
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30"
                }`}
              >
                <input
                  type="file"
                  id="pdf-upload"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      Drop your PDF here, or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum file size: 50MB
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <FileUp className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={handleUpload}
              disabled={!file || !title.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing PDF...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Create Flipbook
                </>
              )}
            </Button>
          </div>

          {/* Processing Info */}
          {isUploading && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-primary">
                Please wait while we process your PDF. This may take a few moments depending on the file size and number of pages.
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">1.</span>
                <span>Your PDF will be uploaded and processed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">2.</span>
                <span>Each page will be converted to an image</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">3.</span>
                <span>You&apos;ll be taken to the builder to add interactive hotspots</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">4.</span>
                <span>Publish your flipbook when ready!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
