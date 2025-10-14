/**
 * Supabase Storage Integration
 *
 * Handles file uploads to Supabase Storage for files < 50MB.
 */

import { createClient } from '@supabase/supabase-js';
import type { UploadResult } from './hybrid-storage';

// Server-side Supabase client with service role key (bypasses RLS)
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Supabase configuration missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
      );
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  return supabase;
}

/**
 * Upload file to Supabase Storage
 *
 * @param file - File to upload
 * @param path - Storage path (e.g., 'design-documents/project-123/file.pdf')
 * @param bucket - Storage bucket name (default: 'design-documents')
 */
export async function uploadToSupabase(
  file: File,
  path: string,
  bucket: string = 'design-documents'
): Promise<UploadResult> {
  try {
    // Upload file
    const { error } = await getSupabaseClient().storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        storageType: 'supabase',
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = getSupabaseClient().storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      success: true,
      storageType: 'supabase',
      storagePath: path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Supabase upload exception:', error);
    return {
      success: false,
      storageType: 'supabase',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromSupabase(
  path: string,
  bucket: string = 'design-documents'
): Promise<boolean> {
  try {
    const { error } = await getSupabaseClient().storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Supabase delete exception:', error);
    return false;
  }
}

/**
 * Get download URL for file in Supabase Storage
 */
export async function getSupabaseUrl(
  path: string,
  bucket: string = 'design-documents'
): Promise<string | null> {
  try {
    const { data } = getSupabaseClient().storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.error('Supabase get URL exception:', error);
    return null;
  }
}

/**
 * Create signed URL for private files (expires in 1 hour)
 */
export async function createSignedUrl(
  path: string,
  expiresIn: number = 3600,
  bucket: string = 'design-documents'
): Promise<string | null> {
  try {
    const { data, error } = await getSupabaseClient().storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Create signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Create signed URL exception:', error);
    return null;
  }
}

/**
 * List files in a Supabase Storage path
 */
export async function listSupabaseFiles(
  folder: string,
  bucket: string = 'design-documents'
) {
  try {
    const { data, error } = await getSupabaseClient().storage
      .from(bucket)
      .list(folder);

    if (error) {
      console.error('List files error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('List files exception:', error);
    return [];
  }
}

/**
 * Check if bucket exists, create if not
 */
export async function ensureBucketExists(bucket: string): Promise<boolean> {
  try {
    const { data } = await supabase.storage.listBuckets();
    const buckets = data || [];

    const exists = buckets.some(b => b.name === bucket);

    if (!exists) {
      const { error } = await getSupabaseClient().storage.createBucket(bucket, {
        public: true, // Make files publicly accessible
        fileSizeLimit: 52428800, // 50MB
      });

      if (error) {
        console.error('Create bucket error:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Ensure bucket exception:', error);
    return false;
  }
}
