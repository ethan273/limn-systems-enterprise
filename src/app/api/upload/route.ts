/**
 * File Upload API Route
 *
 * Handles file uploads server-side to avoid importing Node.js libraries in client.
 * Routes to Supabase (<50MB) or Google Drive (≥50MB).
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadToSupabase } from '@/lib/storage/supabase-storage';
import { uploadToGoogleDrive } from '@/lib/storage/google-drive-storage';
import { determineStorageType, generateUniqueFilename } from '@/lib/storage/hybrid-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accessToken = formData.get('accessToken') as string | null;
    const category = formData.get('category') as string | null;
    const projectId = formData.get('projectId') as string | null;
    const briefId = formData.get('briefId') as string | null;

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
      // Supabase upload
      const bucket = category === 'shop_drawings' ? 'shop-drawings' : 'documents';
      const path = `design-documents/${projectId || briefId || 'general'}/${uniqueFilename}`;
      result = await uploadToSupabase(file, path, bucket);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload error:', error);
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
