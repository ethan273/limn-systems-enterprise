/**
 * Supabase Storage utilities for file uploads
 */

import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = getSupabaseBrowserClient();
  }
  if (!supabase) {
    throw new Error('Failed to initialize Supabase client');
  }
  return supabase;
}

export interface UploadResult {
  success: boolean;
  data?: {
    path: string;
    fullPath: string;
    publicUrl: string;
  };
  error?: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadTaskAttachment(
  taskId: string,
  file: File,
  _onProgress?: (_progress: number) => void
): Promise<UploadResult> {
  try {
    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 50MB limit'
      };
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'File type not allowed'
      };
    }

    // Generate unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `attachments/task-${taskId}/${fileName}`;

    // Upload to Supabase Storage
    const client = getSupabase();
    const { data, error } = await client.storage
      .from('task-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from('task-attachments')
      .getPublicUrl(filePath);

    return {
      success: true,
      data: {
        path: filePath,
        fullPath: data.path,
        publicUrl: urlData.publicUrl
      }
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteTaskAttachment(filePath: string): Promise<boolean> {
  try {
    const client = getSupabase();
    const { error } = await client.storage
      .from('task-attachments')
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Get download URL for a file
 */
export async function getDownloadUrl(filePath: string): Promise<string | null> {
  try {
    const client = getSupabase();
    const { data } = client.storage
      .from('task-attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Get URL error:', error);
    return null;
  }
}

/**
 * Create a thumbnail for images (if needed)
 */
export async function createThumbnail(
  originalPath: string,
  thumbnailFile: Blob
): Promise<string | null> {
  try {
    const client = getSupabase();
    const thumbnailPath = originalPath.replace(/\.[^.]+$/, '_thumb.jpg');

    const { data, error } = await client.storage
      .from('task-attachments')
      .upload(thumbnailPath, thumbnailFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Thumbnail upload error:', error);
      return null;
    }

    return data.path;
  } catch (error) {
    console.error('Thumbnail error:', error);
    return null;
  }
}