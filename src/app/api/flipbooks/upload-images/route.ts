/**
 * Flipbook Images Upload API Route
 *
 * Handles image uploads for flipbook pages:
 * 1. Validates image files
 * 2. Optimizes images
 * 3. Uploads to S3
 * 4. Creates flipbook_pages records
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { optimizePageImage, createThumbnail } from "@/lib/flipbooks/pdf-processor";
import {
  uploadToS3,
  generatePageImageKey,
} from "@/lib/flipbooks/storage";
import { features } from "@/lib/features";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
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

    const supabase = getSupabaseAdmin();

    // Get current max page number
    const { data: existingPages } = await supabase
      .from("flipbook_pages")
      .select("page_number")
      .eq("flipbook_id", flipbookId)
      .order("page_number", { ascending: false })
      .limit(1);

    let currentPageNumber = (existingPages as any)?.[0]?.page_number || 0;

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

      // Prepare page record
      pageRecords.push({
        flipbook_id: flipbookId,
        page_number: currentPageNumber,
        image_url: pageUpload.cdnUrl,
        thumbnail_url: thumbnailUpload.cdnUrl,
        transition_type: "PAGE_TURN",
      } as any);
    }

    // Insert page records
    const insertResult = (await supabase
      .from("flipbook_pages")
      .insert(pageRecords as any)
      .select()) as any;
    const { data: pages, error: pagesError } = insertResult;

    if (pagesError) {
      console.error("Error creating pages:", pagesError);
      return NextResponse.json(
        { error: "Failed to create pages" },
        { status: 500 }
      );
    }

    // Update flipbook page count
    const updateResult = (await (supabase
      .from("flipbooks") as any)
      .update({
        page_count: currentPageNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", flipbookId)) as any;
    const { error: updateError } = updateResult;

    if (updateError) {
      console.error("Error updating flipbook:", updateError);
    }

    return NextResponse.json({
      success: true,
      flipbookId,
      pagesAdded: files.length,
      pages,
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload images" },
      { status: 500 }
    );
  }
}
