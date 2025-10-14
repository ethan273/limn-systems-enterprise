/**
 * Thumbnail Generation Utility
 *
 * Generates optimized thumbnails from flipbook page images
 * Phase 1: TOC & Thumbnails Enhancement
 */

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { THUMBNAIL_VALIDATION } from "@/types/flipbook-navigation";
import type { ThumbnailSize, ThumbnailData } from "@/types/flipbook-navigation";

// Configure PDF.js - disable worker for Node.js, enable for browser
if (typeof window === "undefined") {
  // Node.js environment: disable worker
  pdfjs.GlobalWorkerOptions.workerPort = null;
} else {
  // Browser environment: use worker
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
}

// Supabase client for storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface ThumbnailGenerationOptions {
  /** Size variant to generate */
  size: ThumbnailSize;

  /** Quality (0-100) */
  quality?: number;

  /** Format */
  format?: "webp" | "jpeg" | "png";

  /** Upload to Supabase storage */
  uploadToStorage?: boolean;

  /** Storage bucket name */
  storageBucket?: string;
}

interface ThumbnailGenerationResult {
  success: boolean;
  url?: string;
  smallUrl?: string;
  buffer?: Buffer;
  error?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface BulkGenerationProgress {
  pageId: string;
  pageNumber: number;
  success: boolean;
  url?: string;
  smallUrl?: string;
  error?: string;
}

/**
 * Get thumbnail dimensions based on size
 */
function getThumbnailDimensions(size: ThumbnailSize): {
  width: number;
  height: number;
} {
  switch (size) {
    case "small":
      return {
        width: THUMBNAIL_VALIDATION.SMALL_WIDTH,
        height: THUMBNAIL_VALIDATION.SMALL_HEIGHT,
      };
    case "large":
      return {
        width: THUMBNAIL_VALIDATION.LARGE_WIDTH,
        height: THUMBNAIL_VALIDATION.LARGE_HEIGHT,
      };
    case "medium":
    default:
      return {
        width: THUMBNAIL_VALIDATION.STANDARD_WIDTH,
        height: THUMBNAIL_VALIDATION.STANDARD_HEIGHT,
      };
  }
}

/**
 * Generate thumbnail from image buffer
 */
export async function generateThumbnailFromBuffer(
  imageBuffer: Buffer,
  options: ThumbnailGenerationOptions
): Promise<ThumbnailGenerationResult> {
  try {
    const dimensions = getThumbnailDimensions(options.size);
    const quality = options.quality || THUMBNAIL_VALIDATION.QUALITY;
    const format = options.format || THUMBNAIL_VALIDATION.FORMAT;

    // Resize and optimize image
    let pipeline = sharp(imageBuffer)
      .resize(dimensions.width, dimensions.height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      });

    // Convert to requested format
    if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    } else if (format === "jpeg") {
      pipeline = pipeline.jpeg({ quality });
    } else {
      pipeline = pipeline.png({ quality });
    }

    const buffer = await pipeline.toBuffer();

    return {
      success: true,
      buffer,
      dimensions,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate thumbnail from PDF page
 */
export async function generateThumbnailFromPDFPage(
  pdfUrl: string,
  pageNumber: number,
  options: ThumbnailGenerationOptions
): Promise<ThumbnailGenerationResult> {
  try {
    // Load PDF
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    // Get page
    const page = await pdf.getPage(pageNumber);

    // Render page to canvas
    const viewport = page.getViewport({ scale: 2.0 }); // 2x for better quality
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
    } as any).promise;

    // Convert canvas to buffer
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to blob"));
      }, "image/png");
    });

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate thumbnail from buffer
    return generateThumbnailFromBuffer(buffer, options);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Upload thumbnail to Supabase storage
 */
export async function uploadThumbnailToStorage(
  buffer: Buffer,
  flipbookId: string,
  pageId: string,
  size: ThumbnailSize,
  bucket: string = "flipbook-thumbnails"
): Promise<{ url: string; error?: string }> {
  try {
    const filename = `${flipbookId}/${pageId}-${size}.webp`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filename);

    return { url: publicUrl };
  } catch (error) {
    return {
      url: "",
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Generate and upload thumbnail for a single page
 */
export async function generateAndUploadThumbnail(
  pdfUrl: string,
  flipbookId: string,
  pageId: string,
  pageNumber: number,
  generateSmall: boolean = true
): Promise<{
  success: boolean;
  thumbnailUrl?: string;
  thumbnailSmallUrl?: string;
  error?: string;
}> {
  try {
    // Generate standard thumbnail
    const standardResult = await generateThumbnailFromPDFPage(pdfUrl, pageNumber, {
      size: "medium",
      uploadToStorage: false,
    });

    if (!standardResult.success || !standardResult.buffer) {
      return {
        success: false,
        error: standardResult.error || "Failed to generate standard thumbnail",
      };
    }

    // Upload standard thumbnail
    const standardUpload = await uploadThumbnailToStorage(
      standardResult.buffer,
      flipbookId,
      pageId,
      "medium"
    );

    if (standardUpload.error) {
      return {
        success: false,
        error: standardUpload.error,
      };
    }

    let smallUrl: string | undefined;

    // Generate small thumbnail if requested
    if (generateSmall) {
      const smallResult = await generateThumbnailFromPDFPage(pdfUrl, pageNumber, {
        size: "small",
        uploadToStorage: false,
      });

      if (smallResult.success && smallResult.buffer) {
        const smallUpload = await uploadThumbnailToStorage(
          smallResult.buffer,
          flipbookId,
          pageId,
          "small"
        );

        if (!smallUpload.error) {
          smallUrl = smallUpload.url;
        }
      }
    }

    return {
      success: true,
      thumbnailUrl: standardUpload.url,
      thumbnailSmallUrl: smallUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate thumbnails for all pages in a flipbook
 */
export async function generateThumbnailsForFlipbook(
  flipbookId: string,
  pdfUrl: string,
  pages: Array<{ id: string; pageNumber: number }>,
  onProgress?: (progress: BulkGenerationProgress) => void
): Promise<{
  success: boolean;
  results: BulkGenerationProgress[];
  successCount: number;
  failureCount: number;
}> {
  const results: BulkGenerationProgress[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const page of pages) {
    const result = await generateAndUploadThumbnail(
      pdfUrl,
      flipbookId,
      page.id,
      page.pageNumber
    );

    const progress: BulkGenerationProgress = {
      pageId: page.id,
      pageNumber: page.pageNumber,
      success: result.success,
      url: result.thumbnailUrl,
      smallUrl: result.thumbnailSmallUrl,
      error: result.error,
    };

    results.push(progress);

    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }

    // Call progress callback
    onProgress?.(progress);
  }

  return {
    success: failureCount === 0,
    results,
    successCount,
    failureCount,
  };
}

/**
 * Regenerate thumbnail for a single page
 */
export async function regenerateThumbnail(
  flipbookId: string,
  pageId: string,
  pageNumber: number,
  pdfUrl: string
): Promise<ThumbnailData | null> {
  const result = await generateAndUploadThumbnail(
    pdfUrl,
    flipbookId,
    pageId,
    pageNumber
  );

  if (!result.success || !result.thumbnailUrl) {
    return null;
  }

  return {
    pageId,
    pageNumber,
    url: result.thumbnailUrl,
    smallUrl: result.thumbnailSmallUrl,
    generatedAt: new Date().toISOString(),
    dimensions: {
      width: THUMBNAIL_VALIDATION.STANDARD_WIDTH,
      height: THUMBNAIL_VALIDATION.STANDARD_HEIGHT,
    },
  };
}

/**
 * Delete thumbnails for a page from storage
 */
export async function deleteThumbnailsFromStorage(
  flipbookId: string,
  pageId: string,
  bucket: string = "flipbook-thumbnails"
): Promise<{ success: boolean; error?: string }> {
  try {
    const filesToDelete = [
      `${flipbookId}/${pageId}-small.webp`,
      `${flipbookId}/${pageId}-medium.webp`,
      `${flipbookId}/${pageId}-large.webp`,
    ];

    const { error } = await supabase.storage.from(bucket).remove(filesToDelete);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Delete all thumbnails for a flipbook
 */
export async function deleteAllThumbnailsForFlipbook(
  flipbookId: string,
  bucket: string = "flipbook-thumbnails"
): Promise<{ success: boolean; error?: string }> {
  try {
    // List all files in the flipbook directory
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list(flipbookId);

    if (listError) {
      throw listError;
    }

    if (!files || files.length === 0) {
      return { success: true };
    }

    // Delete all files
    const filePaths = files.map((file) => `${flipbookId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove(filePaths);

    if (deleteError) {
      throw deleteError;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Check if thumbnail exists in storage
 */
export async function thumbnailExists(
  flipbookId: string,
  pageId: string,
  size: ThumbnailSize = "medium",
  bucket: string = "flipbook-thumbnails"
): Promise<boolean> {
  try {
    const filename = `${flipbookId}/${pageId}-${size}.webp`;
    const { data, error } = await supabase.storage.from(bucket).list(flipbookId);

    if (error || !data) {
      return false;
    }

    return data.some((file) => file.name === `${pageId}-${size}.webp`);
  } catch {
    return false;
  }
}
