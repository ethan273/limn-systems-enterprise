import { log } from '@/lib/logger';
/**
 * Supabase Storage Utilities for Flipbooks
 *
 * Handles file uploads to Supabase Storage for flipbook assets (PDFs, images, etc.)
 * Uses Supabase's built-in CDN for delivery
 */

import { getSupabaseAdmin } from "@/lib/supabase";

const BUCKET_NAME = "flipbooks";

export interface UploadResult {
  key: string;
  url: string;
  cdnUrl: string;
}

/**
 * Initialize Supabase Storage bucket (call once on setup)
 */
export async function initializeStorage() {
  const supabase = getSupabaseAdmin();

  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    // Create bucket as public
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    });

    if (error) {
      log.error("Error creating storage bucket:", error);
      throw error;
    }
  }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(key, file, {
      contentType,
      cacheControl: "public, max-age=31536000", // 1 year
      upsert: true, // Overwrite if exists
    });

  if (error) {
    log.error("Upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(key);

  return {
    key,
    url: urlData.publicUrl,
    cdnUrl: urlData.publicUrl, // Supabase CDN is already included
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFromS3(key: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([key]);

  if (error) {
    log.error("Delete error:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Generate a signed URL for temporary access (for private files)
 * Note: Our bucket is public, so this is optional
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(key, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Generate S3 key for flipbook PDF
 */
export function generatePdfKey(flipbookId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `flipbooks/${flipbookId}/pdfs/${timestamp}-${sanitized}`;
}

/**
 * Generate S3 key for flipbook page image
 */
export function generatePageImageKey(flipbookId: string, pageNumber: number): string {
  return `flipbooks/${flipbookId}/pages/page-${pageNumber}.jpg`;
}

/**
 * Generate S3 key for flipbook thumbnail
 */
export function generateThumbnailKey(flipbookId: string): string {
  return `flipbooks/${flipbookId}/thumbnail.jpg`;
}

/**
 * Generate S3 key for flipbook cover
 */
export function generateCoverKey(flipbookId: string): string {
  return `flipbooks/${flipbookId}/cover.jpg`;
}
