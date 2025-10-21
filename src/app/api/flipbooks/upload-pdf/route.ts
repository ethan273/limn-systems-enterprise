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
import { processPdf } from "@/lib/flipbooks/pdf-processor";
import {
  uploadToS3,
  generatePdfKey,
  generatePageImageKey,
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

    // Process PDF and render pages to images
    console.log(`Processing PDF: ${file.name} for flipbook ${flipbookId}`);
    const pdfResult = await processPdf(buffer);
    const { pageCount, pages: pageImages } = pdfResult;

    console.log(`PDF processed: ${pageCount} pages rendered`);

    // Upload each page image to S3 and create page records
    const pages: any[] = [];
    for (let i = 0; i < pageCount; i++) {
      const pageNumber = i + 1;
      // eslint-disable-next-line security/detect-object-injection
      const pageBuffer = pageImages[i];

      // Upload page image to S3
      const pageKey = generatePageImageKey(flipbookId, pageNumber);
      const pageUpload = await uploadToS3(pageBuffer!, pageKey, "image/jpeg");

      // Create page record with actual image URL
      const page = await prisma.flipbook_pages.create({
        data: {
          flipbook_id: flipbookId,
          page_number: pageNumber,
          image_url: pageUpload.cdnUrl,
          page_type: "CONTENT",
        },
      });

      pages.push(page as any);
      console.log(`Uploaded page ${pageNumber}/${pageCount}`);
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
