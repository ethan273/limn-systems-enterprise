/**
 * Google Drive Service Account Client
 *
 * Provides always-connected Google Drive access using a service account.
 * This eliminates the need for user-specific OAuth authentication.
 *
 * Setup:
 * 1. Create service account in Google Cloud Console
 * 2. Download JSON key file
 * 3. Share corporate Drive folder with service account email
 * 4. Configure environment variables (see GOOGLE_DRIVE_SETUP.md)
 */

import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import { Readable } from 'stream';

/**
 * Service Account Configuration from environment
 */
const SERVICE_ACCOUNT_CONFIG = {
  email: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL,
  privateKey: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY,
  folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
};

/**
 * Validate service account configuration
 */
export function validateServiceAccountConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!SERVICE_ACCOUNT_CONFIG.email) {
    errors.push('GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL is not configured');
  }

  if (!SERVICE_ACCOUNT_CONFIG.privateKey) {
    errors.push('GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY is not configured');
  }

  if (!SERVICE_ACCOUNT_CONFIG.folderId) {
    errors.push('GOOGLE_DRIVE_FOLDER_ID is not configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create authenticated Google Drive client using service account
 */
export function createDriveServiceClient(): drive_v3.Drive {
  const validation = validateServiceAccountConfig();

  if (!validation.valid) {
    throw new Error(
      `Google Drive service account not configured: ${validation.errors.join(', ')}`
    );
  }

  // Create JWT auth client with service account credentials
  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_CONFIG.email!,
    key: SERVICE_ACCOUNT_CONFIG.privateKey!.replace(/\\n/g, '\n'), // Convert escaped newlines
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Upload Result Interface
 */
export interface UploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  webContentLink?: string;
  error?: string;
}

/**
 * Upload file to Google Drive corporate folder
 *
 * @param file - File object or Buffer to upload
 * @param fileName - Name for the file
 * @param mimeType - MIME type of the file
 * @param folderId - Optional folder ID (uses env var if not provided)
 */
export async function uploadFileToDrive(
  file: File | Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<UploadResult> {
  try {
    const drive = createDriveServiceClient();
    const targetFolderId = folderId || SERVICE_ACCOUNT_CONFIG.folderId!;

    // Convert File to Buffer if needed
    let buffer: Buffer;
    if (file instanceof Buffer) {
      buffer = file;
    } else {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Create readable stream from buffer
    const stream = Readable.from(buffer);

    // Upload file
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType,
        parents: [targetFolderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id, name, webViewLink, webContentLink, mimeType, size',
    });

    const fileData = response.data;

    if (!fileData.id) {
      return {
        success: false,
        error: 'File upload succeeded but no file ID returned',
      };
    }

    // Make file accessible (set permissions)
    await drive.permissions.create({
      fileId: fileData.id,
      requestBody: {
        role: 'reader',
        type: 'anyone', // Anyone with link can view
      },
    });

    return {
      success: true,
      fileId: fileData.id,
      webViewLink: fileData.webViewLink || undefined,
      webContentLink: fileData.webContentLink || undefined,
    };
  } catch (error) {
    console.error('Google Drive upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete file from Google Drive
 */
export async function deleteFileFromDrive(fileId: string): Promise<boolean> {
  try {
    const drive = createDriveServiceClient();

    await drive.files.delete({
      fileId,
    });

    return true;
  } catch (error) {
    console.error('Google Drive delete error:', error);
    return false;
  }
}

/**
 * Get file metadata from Google Drive
 */
export async function getFileMetadata(fileId: string) {
  try {
    const drive = createDriveServiceClient();

    const response = await drive.files.get({
      fileId,
      fields:
        'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime',
    });

    return response.data;
  } catch (error) {
    console.error('Get file metadata error:', error);
    return null;
  }
}

/**
 * List files in Google Drive corporate folder
 */
export async function listDriveFiles(folderId?: string, pageSize = 100) {
  try {
    const drive = createDriveServiceClient();
    const targetFolderId = folderId || SERVICE_ACCOUNT_CONFIG.folderId!;

    const response = await drive.files.list({
      q: `'${targetFolderId}' in parents and trashed=false`,
      fields:
        'files(id, name, mimeType, size, webViewLink, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize,
    });

    return response.data.files || [];
  } catch (error) {
    console.error('List Google Drive files error:', error);
    return [];
  }
}

/**
 * Get download URL for Google Drive file
 */
export async function getDownloadUrl(fileId: string): Promise<string | null> {
  try {
    const metadata = await getFileMetadata(fileId);
    return metadata?.webContentLink || metadata?.webViewLink || null;
  } catch (error) {
    console.error('Get download URL error:', error);
    return null;
  }
}

/**
 * Create subfolder in Google Drive
 */
export async function createFolder(
  folderName: string,
  parentFolderId?: string
): Promise<string | null> {
  try {
    const drive = createDriveServiceClient();
    const targetParentId = parentFolderId || SERVICE_ACCOUNT_CONFIG.folderId!;

    const response = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [targetParentId],
      },
      fields: 'id',
    });

    return response.data.id || null;
  } catch (error) {
    console.error('Create folder error:', error);
    return null;
  }
}

/**
 * Update file permissions
 */
export async function updateFilePermissions(
  fileId: string,
  isPublic: boolean
): Promise<boolean> {
  try {
    const drive = createDriveServiceClient();

    if (isPublic) {
      // Make public (anyone with link)
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } else {
      // Remove public permissions
      const perms = await drive.permissions.list({ fileId });
      const publicPerm = perms.data.permissions?.find((p) => p.type === 'anyone');

      if (publicPerm?.id) {
        await drive.permissions.delete({
          fileId,
          permissionId: publicPerm.id,
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Update permissions error:', error);
    return false;
  }
}

/**
 * Test service account connection
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Validate config first
    const validation = validateServiceAccountConfig();
    if (!validation.valid) {
      return {
        success: false,
        message: `Configuration error: ${validation.errors.join(', ')}`,
      };
    }

    // Try to list files in the folder
    const drive = createDriveServiceClient();
    await drive.files.list({
      q: `'${SERVICE_ACCOUNT_CONFIG.folderId}' in parents`,
      pageSize: 1,
    });

    return {
      success: true,
      message: 'Successfully connected to Google Drive',
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to connect to Google Drive',
    };
  }
}
