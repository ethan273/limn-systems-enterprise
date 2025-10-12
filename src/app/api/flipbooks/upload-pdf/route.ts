/**
 * Flipbook PDF Upload API Route
 *
 * Handles PDF uploads for flipbooks:
 * 1. Validates the PDF file
 * 2. Processes PDF and extracts pages
 * 3. Uploads pages to S3
 * 4. Creates flipbook_pages records
 * 5. Updates flipbook metadata
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { processPdf, extractCover, createThumbnail } from "@/lib/flipbooks/pdf-processor";
import {
  uploadToS3,
  generatePdfKey,
  generatePageImageKey,
  generateCoverKey,
  generateThumbnailKey,
} from "@/lib/flipbooks/storage";
import { features } from "@/lib/features";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large PDFs

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
    const file = formData.get("file") as File;
    const flipbookId = formData.get("flipbookId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!flipbookId) {
      return NextResponse.json({ error: "No flipbookId provided" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload original PDF to S3
    const pdfKey = generatePdfKey(flipbookId, file.name);
    const pdfUpload = await uploadToS3(buffer, pdfKey, "application/pdf");

    // Process PDF and extract pages
    const processResult = await processPdf(buffer);

    // Extract and upload cover image
    const coverBuffer = await extractCover(buffer);
    const coverKey = generateCoverKey(flipbookId);
    const coverUpload = await uploadToS3(coverBuffer, coverKey, "image/jpeg");

    // Create and upload thumbnail
    const thumbnailBuffer = await createThumbnail(coverBuffer);
    const thumbnailKey = generateThumbnailKey(flipbookId);
    const thumbnailUpload = await uploadToS3(thumbnailBuffer, thumbnailKey, "image/jpeg");

    // Upload page images to S3 and create database records
    const supabase = getSupabaseAdmin();
    const pageRecords = [];

    for (let i = 0; i < processResult.pages.length; i++) {
      const pageBuffer = processResult.pages[i]!;
      const pageKey = generatePageImageKey(flipbookId, i + 1);
      const pageUpload = await uploadToS3(pageBuffer, pageKey, "image/jpeg");

      // Create thumbnail for page
      const pageThumbnailBuffer = await createThumbnail(pageBuffer);
      const pageThumbnailKey = `${pageKey.replace(".jpg", "")}-thumb.jpg`;
      const pageThumbnailUpload = await uploadToS3(pageThumbnailBuffer, pageThumbnailKey, "image/jpeg");

      // Prepare page record
      pageRecords.push({
        flipbook_id: flipbookId,
        page_number: i + 1,
        image_url: pageUpload.cdnUrl,
        thumbnail_url: pageThumbnailUpload.cdnUrl,
        transition_type: "PAGE_TURN",
      });
    }

    // Insert page records into database
    const { data: pages, error: pagesError } = await supabase
      .from("flipbook_pages")
      .insert(pageRecords)
      .select();

    if (pagesError) {
      console.error("Error creating pages:", pagesError);
      return NextResponse.json(
        { error: "Failed to create pages" },
        { status: 500 }
      );
    }

    // Update flipbook with metadata
    const { error: updateError } = await supabase
      .from("flipbooks")
      .update({
        pdf_source_url: pdfUpload.cdnUrl,
        cover_image_url: coverUpload.cdnUrl,
        thumbnail_url: thumbnailUpload.cdnUrl,
        page_count: processResult.pageCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", flipbookId);

    if (updateError) {
      console.error("Error updating flipbook:", updateError);
      return NextResponse.json(
        { error: "Failed to update flipbook" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flipbookId,
      pageCount: processResult.pageCount,
      pages,
      coverUrl: coverUpload.cdnUrl,
      thumbnailUrl: thumbnailUpload.cdnUrl,
    });
  } catch (error: any) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process PDF" },
      { status: 500 }
    );
  }
}
