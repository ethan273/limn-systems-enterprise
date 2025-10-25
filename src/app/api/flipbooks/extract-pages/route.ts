/**
 * Flipbook PDF Page Extraction API Route (Background Job)
 *
 * Background job for extracting pages from uploaded PDFs
 * Uses Cloudinary's PDF transformation API for cloud-based rendering
 *
 * Flow:
 * 1. Fetch PDF from storage
 * 2. Upload PDF to Cloudinary
 * 3. Use Cloudinary's transformation API to generate page URLs
 * 4. Create flipbook_pages records with Cloudinary URLs
 * 5. Extract and save Table of Contents
 *
 * Benefits over Puppeteer:
 * - No serverless limitations (no Chromium/Puppeteer dependencies)
 * - Built-in CDN for fast global delivery
 * - Automatic image optimization (WebP, AVIF)
 * - No cold starts or timeout issues
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PDFDocument } from "pdf-lib";
import {
  uploadPdfToCloudinary,
  extractPdfPages,
} from "@/lib/flipbooks/cloudinary";
import { getUser } from "@/lib/auth/server";

const prisma = new PrismaClient();

export const runtime = "nodejs";
export const maxDuration = 60; // 1 minute - much faster with Cloudinary

interface PageExtractionResult {
  success: boolean;
  pagesExtracted: number;
  tocEntries: number;
  error?: string;
}

/**
 * Extract Table of Contents from PDF using pdf-lib
 */
async function extractTocFromPdf(pdfDoc: PDFDocument): Promise<any[]> {
  try {
    // pdf-lib doesn't natively support outline extraction
    // This would require parsing the PDF catalog's Outlines dictionary
    // For now, return empty array - full implementation would use pdf.js or similar
    return [];
  } catch (error) {
    console.error("[ToC Extraction] Error:", error);
    return [];
  }
}

/**
 * Main background job: Extract all pages from PDF using Cloudinary
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Get parameters
    const body = await request.json();
    const { flipbookId } = body;

    if (!flipbookId) {
      return NextResponse.json(
        { error: "No flipbookId provided" },
        { status: 400 }
      );
    }

    console.log(`[PDF Extraction] Starting Cloudinary extraction for flipbook: ${flipbookId}`);

    // Get flipbook with PDF URL
    const flipbook = await prisma.flipbooks.findUnique({
      where: { id: flipbookId },
      select: {
        id: true,
        pdf_source_url: true,
        page_count: true,
        created_by_id: true,
      },
    });

    if (!flipbook) {
      return NextResponse.json(
        { error: "Flipbook not found" },
        { status: 404 }
      );
    }

    if (!flipbook.pdf_source_url) {
      return NextResponse.json(
        { error: "No PDF uploaded for this flipbook" },
        { status: 400 }
      );
    }

    // Verify user owns this flipbook
    if (flipbook.created_by_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You don't own this flipbook" },
        { status: 403 }
      );
    }

    // Fetch PDF from storage
    console.log(`[PDF Extraction] Fetching PDF from: ${flipbook.pdf_source_url}`);
    const pdfResponse = await fetch(flipbook.pdf_source_url);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    console.log(`[PDF Extraction] PDF fetched successfully (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Load PDF with pdf-lib to get page count and metadata
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`[PDF Extraction] PDF has ${pageCount} pages`);

    // Extract ToC
    const tocEntries = await extractTocFromPdf(pdfDoc);
    console.log(`[PDF Extraction] Extracted ${tocEntries.length} ToC entries`);

    // Upload PDF to Cloudinary
    console.log(`[PDF Extraction] Uploading PDF to Cloudinary...`);
    const cloudinaryUpload = await uploadPdfToCloudinary(
      pdfBuffer,
      flipbookId,
      `flipbook-${flipbookId}.pdf`
    );

    console.log(`[PDF Extraction] PDF uploaded to Cloudinary: ${cloudinaryUpload.secureUrl}`);
    console.log(`[PDF Extraction] Cloudinary detected ${cloudinaryUpload.pages || pageCount} pages`);

    // Use Cloudinary page count if available, otherwise use pdf-lib
    const finalPageCount = cloudinaryUpload.pages || pageCount;

    // Extract pages using Cloudinary transformations
    console.log(`[PDF Extraction] Generating Cloudinary page URLs for ${finalPageCount} pages...`);
    const cloudinaryPages = await extractPdfPages(
      cloudinaryUpload.publicId,
      finalPageCount,
      flipbookId
    );

    // Create flipbook_pages records with Cloudinary URLs
    const extractedPages: any[] = [];

    for (const cloudinaryPage of cloudinaryPages) {
      try {
        const pageRecord = await prisma.flipbook_pages.create({
          data: {
            flipbook_id: flipbookId,
            page_number: cloudinaryPage.pageNumber,
            image_url: cloudinaryPage.url,
            thumbnail_url: cloudinaryPage.thumbnailUrl,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        extractedPages.push(pageRecord);
        console.log(`[PDF Extraction] Created page record ${cloudinaryPage.pageNumber}: ${cloudinaryPage.url}`);

      } catch (pageError: any) {
        console.error(`[PDF Extraction] Error creating page ${cloudinaryPage.pageNumber}:`, pageError);
        // Continue with next page even if one fails
      }
    }

    // Update flipbook with extraction completion
    await prisma.flipbooks.update({
      where: { id: flipbookId },
      data: {
        page_count: extractedPages.length,
        toc_auto_generated: tocEntries.length > 0,
        toc_data: tocEntries.length > 0 ? (tocEntries as any) : undefined,
        toc_last_updated: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`[PDF Extraction] ✅ Cloudinary extraction complete: ${extractedPages.length} pages extracted`);

    return NextResponse.json({
      success: true,
      pagesExtracted: extractedPages.length,
      tocEntries: tocEntries.length,
      flipbookId,
      cloudinaryPublicId: cloudinaryUpload.publicId,
    } as PageExtractionResult & { cloudinaryPublicId: string });

  } catch (error: any) {
    console.error("[PDF Extraction] Error:", error);
    return NextResponse.json(
      {
        success: false,
        pagesExtracted: 0,
        tocEntries: 0,
        error: error.message || "Failed to extract PDF pages",
      } as PageExtractionResult,
      { status: 500 }
    );
  }
}
