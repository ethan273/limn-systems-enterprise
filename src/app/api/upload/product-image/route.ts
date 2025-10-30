import { log } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in to upload images' },
        { status: 401 }
      );
    }

    log.info('Upload API called');
    const formData = await request.formData();
    log.info('FormData entries:', Array.from(formData.entries()).map(([k, v]) => [k, typeof v]));
    const file = formData.get('file') as File;

    if (!file) {
      log.error('No file in formData');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    log.info('File received:', { name: file.name, type: file.type, size: file.size });

    // Validate file size (10MB limit for images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Image size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type - images only
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed. Please upload an image (JPEG, PNG, GIF, or WebP).' },
        { status: 400 }
      );
    }

    const itemId = formData.get('itemId') as string || 'temp';

    // Create server-side Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      log.error('Missing Supabase environment variables');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `products/${itemId}/${fileName}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    log.info('Uploading to Supabase:', { filePath, size: buffer.length, contentType: file.type });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      log.error('Storage upload error:', { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    log.info('Upload successful:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      data: {
        publicUrl: urlData.publicUrl,
        path: filePath,
        fullPath: data.path,
      }
    });
  } catch (error) {
    log.error('Upload API error:', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
