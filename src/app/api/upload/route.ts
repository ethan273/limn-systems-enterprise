import { log } from '@/lib/logger';
/**
 * File Upload API Route
 *
 * Handles file uploads server-side to avoid importing Node.js libraries in client.
 * Routes to Supabase (<50MB) or Google Drive (≥50MB).
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadToSupabase, ensureBucketExists } from '@/lib/storage/supabase-storage';
import { uploadToGoogleDrive } from '@/lib/storage/google-drive-storage';
import { determineStorageType, generateUniqueFilename } from '@/lib/storage/hybrid-storage';
import { getUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to upload files' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accessToken = formData.get('accessToken') as string | null;
    const category = formData.get('category') as string | null;
    const projectId = formData.get('projectId') as string | null;
    const briefId = formData.get('briefId') as string | null;
    const bucketName = formData.get('bucket') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Determine storage type based on file size
    const storageType = determineStorageType(file.size);
    const uniqueFilename = generateUniqueFilename(file.name);

    let result;

    if (storageType === 'google_drive') {
      if (!accessToken) {
        return NextResponse.json(
          { error: 'Google Drive access token required for files ≥50MB' },
          { status: 400 }
        );
      }

      result = await uploadToGoogleDrive(
        file,
        accessToken,
        process.env.GOOGLE_DRIVE_FOLDER_ID
      );
    } else {
      // Supabase upload - use specified bucket or default to design-documents
      const bucket = bucketName || 'design-documents';

      // Ensure bucket exists before uploading
      const bucketExists = await ensureBucketExists(bucket);
      if (!bucketExists) {
        return NextResponse.json(
          { error: `Failed to create or access storage bucket: ${bucket}` },
          { status: 500 }
        );
      }

      const path = `${category || 'general'}/${projectId || briefId || 'general'}/${uniqueFilename}`;
      result = await uploadToSupabase(file, path, bucket);
    }

    return NextResponse.json(result);
  } catch (error) {
    log.error('Upload error:', { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
