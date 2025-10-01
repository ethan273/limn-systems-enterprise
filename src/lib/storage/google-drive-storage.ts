/**
 * Google Drive Storage Integration
 *
 * Handles file uploads to Google Drive for files ≥ 50MB using OAuth tokens.
 */

import { createDriveClient } from '@/lib/oauth/google-drive-client';
import type { UploadResult } from './hybrid-storage';
import { Readable } from 'stream';

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

/**
 * Convert File to Buffer for upload
 */
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload file to Google Drive
 *
 * @param file - File to upload
 * @param accessToken - Valid Google OAuth access token
 * @param folderId - Google Drive folder ID (optional, uses env var if not provided)
 */
export async function uploadToGoogleDrive(
  file: File,
  accessToken: string,
  folderId?: string
): Promise<UploadResult> {
  try {
    const drive = createDriveClient(accessToken);
    const targetFolderId = folderId || GOOGLE_DRIVE_FOLDER_ID;

    if (!targetFolderId) {
      return {
        success: false,
        storageType: 'google_drive',
        error: 'Google Drive folder ID not configured',
      };
    }

    // Convert File to Buffer and then to Stream
    const buffer = await fileToBuffer(file);
    const stream = Readable.from(buffer);

    // Upload file
    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        mimeType: file.type,
        parents: [targetFolderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, name, webViewLink, webContentLink, mimeType, size',
    });

    const fileData = response.data;

    if (!fileData.id) {
      return {
        success: false,
        storageType: 'google_drive',
        error: 'File upload succeeded but no file ID returned',
      };
    }

    // Set file permissions to be accessible (if needed)
    // Note: This makes the file accessible to anyone with the link
    // Remove this if you want files to be private
    await drive.permissions.create({
      fileId: fileData.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return {
      success: true,
      storageType: 'google_drive',
      fileId: fileData.id,
      publicUrl: fileData.webViewLink || undefined,
    };
  } catch (error) {
    console.error('Google Drive upload error:', error);
    return {
      success: false,
      storageType: 'google_drive',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete file from Google Drive
 */
export async function deleteFromGoogleDrive(
  fileId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const drive = createDriveClient(accessToken);

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
export async function getGoogleDriveFileMetadata(
  fileId: string,
  accessToken: string
) {
  try {
    const drive = createDriveClient(accessToken);

    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime',
    });

    return response.data;
  } catch (error) {
    console.error('Get file metadata error:', error);
    return null;
  }
}

/**
 * Get download URL for Google Drive file
 */
export async function getGoogleDriveDownloadUrl(
  fileId: string,
  accessToken: string
): Promise<string | null> {
  try {
    const metadata = await getGoogleDriveFileMetadata(fileId, accessToken);
    return metadata?.webContentLink || metadata?.webViewLink || null;
  } catch (error) {
    console.error('Get download URL error:', error);
    return null;
  }
}

/**
 * List files in Google Drive folder
 */
export async function listGoogleDriveFiles(
  accessToken: string,
  folderId?: string
) {
  try {
    const drive = createDriveClient(accessToken);
    const targetFolderId = folderId || GOOGLE_DRIVE_FOLDER_ID;

    const response = await drive.files.list({
      q: `'${targetFolderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, webViewLink, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc',
    });

    return response.data.files || [];
  } catch (error) {
    console.error('List Google Drive files error:', error);
    return [];
  }
}

/**
 * Create folder in Google Drive (if needed)
 */
export async function createGoogleDriveFolder(
  folderName: string,
  accessToken: string,
  parentFolderId?: string
): Promise<string | null> {
  try {
    const drive = createDriveClient(accessToken);

    const response = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined,
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
 * Update file permissions (make public or private)
 */
export async function updateGoogleDrivePermissions(
  fileId: string,
  accessToken: string,
  isPublic: boolean
): Promise<boolean> {
  try {
    const drive = createDriveClient(accessToken);

    if (isPublic) {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } else {
      // List and remove public permissions
      const perms = await drive.permissions.list({ fileId });
      const publicPerm = perms.data.permissions?.find(p => p.type === 'anyone');

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
