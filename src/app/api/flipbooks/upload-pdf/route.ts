/**
 * Flipbook PDF Upload API Route
 *
 * Simplified serverless-compatible approach:
 * 1. Validates the PDF file
 * 2. Uploads PDF to storage
 * 3. Returns PDF URL and metadata
 *
 * Note: PDF page extraction is done client-side using PDF.js
 * to avoid serverless limitations with canvas/native dependencies
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PDFDocument } from "pdf-lib";
import {
  uploadToS3,
  generatePdfKey,
  initializeStorage,
} from "@/lib/flipbooks/storage";
import { features } from "@/lib/features";
import { getUser } from "@/lib/auth/server";

const prisma = new PrismaClient();

export const runtime = "nodejs";
export const maxDuration = 60; // 1 minute - just for PDF upload

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to upload flipbooks" },
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

    // Get PDF metadata using pdf-lib
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle();
    const author = pdfDoc.getAuthor();

    console.log(`[PDF Upload] Uploading PDF: ${file.name}, ${pageCount} pages`);

    // Initialize storage bucket (creates if doesn't exist)
    await initializeStorage();

    // Upload original PDF to Supabase Storage
    const pdfKey = generatePdfKey(flipbookId, file.name);
    const pdfUpload = await uploadToS3(buffer, pdfKey, "application/pdf");

    console.log(`[PDF Upload] PDF uploaded successfully: ${pdfUpload.cdnUrl}`);

    // Update flipbook with PDF URL and page count
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
      pdfUrl: pdfUpload.cdnUrl,
      metadata: {
        title,
        author,
        pageCount,
      },
    });
  } catch (error: any) {
    console.error("[PDF Upload] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload PDF" },
      { status: 500 }
    );
  }
}
