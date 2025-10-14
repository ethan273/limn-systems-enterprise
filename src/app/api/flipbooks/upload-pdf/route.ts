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
import { PrismaClient } from "@prisma/client";
// Unused for now - kept for future PDF rendering implementation
// import { processPdf, extractCover, createThumbnail } from "@/lib/flipbooks/pdf-processor";
import {
  uploadToS3,
  generatePdfKey,
  // Unused for now - will be used when PDF rendering is implemented
  // generatePageImageKey,
  // generateCoverKey,
  // generateThumbnailKey,
  initializeStorage,
} from "@/lib/flipbooks/storage";
import { features } from "@/lib/features";

const prisma = new PrismaClient();

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

    // Initialize storage bucket (creates if doesn't exist)
    await initializeStorage();

    // Upload original PDF to Supabase Storage
    const pdfKey = generatePdfKey(flipbookId, file.name);
    const pdfUpload = await uploadToS3(buffer, pdfKey, "application/pdf");

    // Get page count using pdf-lib (doesn't require rendering)
    const { getPdfPageCount } = await import("@/lib/flipbooks/pdf-processor");
    const pageCount = await getPdfPageCount(buffer);

    // TODO: Implement PDF page rendering with a different solution (ImageMagick, Ghostscript, or pdf2pic)
    // For now, we'll just store the PDF and create placeholder page records

    // Create placeholder page records (actual rendering will be added later)
    const pages: any[] = [];
    for (let i = 1; i <= pageCount; i++) {
      const page = await prisma.flipbook_pages.create({
        data: {
          flipbook_id: flipbookId,
          page_number: i,
          image_url: pdfUpload.cdnUrl, // Temporarily use PDF URL
          page_type: "CONTENT",
        },
      });
      pages.push(page as any);
    }

    // Update flipbook with metadata
    await prisma.flipbooks.update({
      where: { id: flipbookId },
      data: {
        pdf_source_url: pdfUpload.cdnUrl,
        page_count: pageCount,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      flipbookId,
      pageCount,
      pages,
      pdfUrl: pdfUpload.cdnUrl,
    });
  } catch (error: any) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process PDF" },
      { status: 500 }
    );
  }
}
