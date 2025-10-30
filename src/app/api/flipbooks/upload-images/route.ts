import { log } from '@/lib/logger';
/**
 * Flipbook Images Upload API Route
 *
 * Handles image uploads for flipbook pages using Prisma for database operations:
 * 1. Validates image files
 * 2. Optimizes images
 * 3. Uploads to S3
 * 4. Creates flipbook_pages records via Prisma
 * 5. Updates flipbook page_count
 *
 * CRITICAL: Uses Prisma instead of Supabase for database consistency
 * All flipbook queries use Prisma to ensure proper data visibility
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { optimizePageImage, createThumbnail } from "@/lib/flipbooks/pdf-processor";
import {
  uploadToS3,
  generatePageImageKey,
} from "@/lib/flipbooks/storage";
import { features } from "@/lib/features";
import { getUser } from "@/lib/auth/server";

export const runtime = "nodejs";
export const maxDuration = 300;

// Increase body size limit for image uploads (50MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

// Next.js 13+ App Router: Use experimental config for body size
export const experimental_bodySizeLimit = '50mb';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to upload images" },
        { status: 401 }
      );
    }

    // Feature flag check
    if (!features.flipbooks) {
      return NextResponse.json(
        { error: "Flipbooks feature is not enabled" },
        { status: 403 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const flipbookId = formData.get("flipbookId") as string;
    const files = formData.getAll("files") as File[];

    if (!flipbookId) {
      return NextResponse.json({ error: "No flipbookId provided" }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Extract dimensions from formData (sent as width_N and height_N)
    const dimensions = new Map<number, { width: number; height: number }>();
    for (const [key, value] of formData.entries()) {
      const widthMatch = key.match(/^width_(\d+)$/);
      const heightMatch = key.match(/^height_(\d+)$/);
      if (widthMatch) {
        const pageNum = parseInt(widthMatch[1] as string, 10);
        if (!dimensions.has(pageNum)) dimensions.set(pageNum, { width: 0, height: 0 });
        dimensions.get(pageNum)!.width = parseInt(value as string, 10);
      }
      if (heightMatch) {
        const pageNum = parseInt(heightMatch[1] as string, 10);
        if (!dimensions.has(pageNum)) dimensions.set(pageNum, { width: 0, height: 0 });
        dimensions.get(pageNum)!.height = parseInt(value as string, 10);
      }
    }

    // Validate file types
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Must be JPEG, PNG, or WebP` },
          { status: 400 }
        );
      }
    }

    // Get current max page number using Prisma
    const existingPages = await prisma.flipbook_pages.findMany({
      where: { flipbook_id: flipbookId },
      orderBy: { page_number: 'desc' },
      take: 1,
      select: { page_number: true },
    });

    let currentPageNumber = existingPages[0]?.page_number || 0;

    // Process and upload each image
    const pageRecords: any[] = [];

    for (const file of files) {
      currentPageNumber++;

      // Convert to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Optimize image
      const optimizedBuffer = await optimizePageImage(buffer);

      // Generate keys
      const pageKey = generatePageImageKey(flipbookId, currentPageNumber);
      const thumbnailKey = `${pageKey.replace(".jpg", "")}-thumb.jpg`;

      // Upload to S3
      const pageUpload = await uploadToS3(optimizedBuffer, pageKey, "image/jpeg");

      // Create and upload thumbnail
      const thumbnailBuffer = await createThumbnail(optimizedBuffer);
      const thumbnailUpload = await uploadToS3(thumbnailBuffer, thumbnailKey, "image/jpeg");

      // Get dimensions for this page
      const pageDims = dimensions.get(currentPageNumber);

      // Prepare page record with dimensions
      pageRecords.push({
        flipbook_id: flipbookId,
        page_number: currentPageNumber,
        image_url: pageUpload.cdnUrl,
        thumbnail_url: thumbnailUpload.cdnUrl,
        width: pageDims?.width || null,
        height: pageDims?.height || null,
        // page_type has default value 'CONTENT' in database
      } as any);
    }

    // Insert page records using Prisma createMany
    log.info(`[Upload Images] Inserting ${pageRecords.length} pages for flipbook ${flipbookId}`);

    try {
      const result = await prisma.flipbook_pages.createMany({
        data: pageRecords,
      });

      log.info(`[Upload Images] Successfully inserted ${result.count} pages`);

      // Fetch the created pages to return them (createMany doesn't return data)
      const pages = await prisma.flipbook_pages.findMany({
        where: { flipbook_id: flipbookId },
        orderBy: { page_number: 'asc' },
      });

      log.info(`[Upload Images] Retrieved ${pages.length} total pages for flipbook`);

    } catch (pagesError: any) {
      log.error("[Upload Images] Error creating pages:", pagesError);
      return NextResponse.json(
        { error: "Failed to create pages: " + pagesError.message },
        { status: 500 }
      );
    }

    // Update flipbook page count using Prisma
    try {
      await prisma.flipbooks.update({
        where: { id: flipbookId },
        data: {
          page_count: currentPageNumber,
          updated_at: new Date(),
        },
      });

      log.info(`[Upload Images] Updated flipbook page_count to ${currentPageNumber}`);

    } catch (updateError: any) {
      log.error("[Upload Images] Error updating flipbook:", updateError);
      // Don't fail the request, pages are already created
    }

    // Fetch all pages to return
    const pages = await prisma.flipbook_pages.findMany({
      where: { flipbook_id: flipbookId },
      orderBy: { page_number: 'asc' },
    });

    return NextResponse.json({
      success: true,
      flipbookId,
      pagesAdded: files.length,
      totalPages: pages.length,
      pages,
    });
  } catch (error: any) {
    log.error("Image upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload images" },
      { status: 500 }
    );
  }
}
