/**
 * Hybrid Storage Router
 *
 * Automatically routes file uploads to appropriate storage:
 * - Files < 50MB → Supabase Storage
 * - Files ≥ 50MB → Google Drive
 */

export type StorageType = 'supabase' | 'google_drive';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  storageType: StorageType;
}

export interface UploadOptions {
  projectId?: string;
  briefId?: string;
  category?: string;
}

export interface UploadResult {
  success: boolean;
  storageType: StorageType;
  fileId?: string;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
}

/**
 * File size threshold for storage routing (50MB)
 */
const THRESHOLD_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Determine storage type based on file size
 */
export function determineStorageType(fileSize: number): StorageType {
  return fileSize < THRESHOLD_BYTES ? 'supabase' : 'google_drive';
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 5GB for Google Drive)
  const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds maximum limit of 5GB',
    };
  }

  // Check file size minimum (1 byte)
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  // Check file name
  if (!file.name || file.name.trim() === '') {
    return {
      valid: false,
      error: 'File name is required',
    };
  }

  return { valid: true };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1]!.toLowerCase() : '';
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove special characters, keep alphanumeric, dots, dashes, underscores
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const extension = getFileExtension(originalName);
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const sanitizedBase = sanitizeFilename(baseName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return extension
    ? `${sanitizedBase}_${timestamp}_${random}.${extension}`
    : `${sanitizedBase}_${timestamp}_${random}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // eslint-disable-next-line security/detect-object-injection
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get storage type label for UI
 */
export function getStorageTypeLabel(storageType: StorageType): string {
  return storageType === 'supabase' ? 'Supabase Storage' : 'Google Drive';
}

/**
 * Get storage type badge color
 */
export function getStorageTypeBadgeColor(storageType: StorageType): string {
  return storageType === 'supabase'
    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    : 'bg-green-500/10 text-green-400 border-green-500/20';
}

/**
 * Check if file type is allowed
 */
export function isFileTypeAllowed(file: File, allowedTypes?: string[]): boolean {
  if (!allowedTypes || allowedTypes.length === 0) {
    return true; // No restrictions
  }

  // eslint-disable-next-line security/detect-object-injection
  return allowedTypes.includes(file.type);
}

/**
 * Get MIME type category (image, document, video, etc.)
 */
export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
  return 'file';
}
