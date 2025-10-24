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

// Increase body size limit for PDF uploads (100MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

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

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `PDF file is too large. Maximum size is 100MB, your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`
      }, { status: 413 });
    }

    console.log(`[PDF Upload] Uploading PDF: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

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

    // Trigger background page extraction job
    console.log(`[PDF Upload] Triggering background page extraction...`);
    try {
      // Call extraction API in background (don't await, fire-and-forget)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/flipbooks/extract-pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flipbookId }),
      }).catch(err => {
        console.error('[PDF Upload] Failed to trigger extraction:', err);
      });

      console.log(`[PDF Upload] Background extraction job triggered`);
    } catch (triggerError) {
      console.error('[PDF Upload] Error triggering extraction:', triggerError);
      // Don't fail the upload if background job trigger fails
    }

    return NextResponse.json({
      success: true,
      flipbookId,
      pageCount,
      pdfUrl: pdfUpload.cdnUrl,
      extractionTriggered: true, // Signal to frontend that extraction is in progress
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
