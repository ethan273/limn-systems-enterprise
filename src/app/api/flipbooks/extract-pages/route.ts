/**
 * Flipbook PDF Page Extraction API Route (Background Job)
 *
 * Background job for extracting pages from uploaded PDFs
 * Uses Puppeteer + PDF.js for server-side PDF rendering
 *
 * Flow:
 * 1. Fetch PDF from storage
 * 2. Use Puppeteer to load PDF with PDF.js
 * 3. Render each page to canvas and capture as PNG
 * 4. Upload page images to storage
 * 5. Create flipbook_pages records in database
 * 6. Extract and save Table of Contents
 *
 * This runs as a long-running background job (5min max on Vercel Pro)
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";
import {
  uploadToS3,
  generatePageImageKey,
  initializeStorage,
} from "@/lib/flipbooks/storage";
import { getUser } from "@/lib/auth/server";

const prisma = new PrismaClient();

export const runtime = "nodejs"; // Required for Puppeteer
export const maxDuration = 300; // 5 minutes for background processing

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
 * Main background job: Extract all pages from PDF using Puppeteer + PDF.js
 */
export async function POST(request: NextRequest) {
  let browser: any = null;

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

    console.log(`[PDF Extraction] Starting extraction for flipbook: ${flipbookId}`);

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

    // Initialize storage
    await initializeStorage();

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

    // Launch Puppeteer browser
    console.log(`[PDF Extraction] Launching Puppeteer browser...`);
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // Required for Vercel
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set viewport to standard page size
    await page.setViewport({ width: 1200, height: 1600 });

    // Convert PDF to base64 for embedding
    const pdfBase64 = pdfBuffer.toString('base64');

    // Create HTML page with PDF.js to render each page
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #renderCanvas { display: block; }
  </style>
</head>
<body>
  <canvas id="renderCanvas"></canvas>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

    const pdfData = atob('${pdfBase64}');
    const loadingTask = pdfjsLib.getDocument({data: pdfData});

    window.renderPage = async function(pageNum) {
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNum);

      const canvas = document.getElementById('renderCanvas');
      const context = canvas.getContext('2d');

      // Scale to 2x for high quality
      const viewport = page.getViewport({scale: 2.0});
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      return { width: viewport.width, height: viewport.height };
    };

    window.getPageCount = async function() {
      const pdf = await loadingTask.promise;
      return pdf.numPages;
    };
  </script>
</body>
</html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Extract each page
    const extractedPages: any[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        console.log(`[PDF Extraction] Processing page ${pageNum}/${pageCount}...`);

        // Render page using PDF.js
        const dimensions = await page.evaluate((num) => {
          return (window as any).renderPage(num);
        }, pageNum);

        // Wait for rendering to complete
        await page.waitForTimeout(500);

        // Take screenshot of canvas
        const canvas = await page.$('#renderCanvas');
        if (!canvas) {
          throw new Error('Canvas element not found');
        }

        const screenshot = await canvas.screenshot({ type: 'jpeg', quality: 90 });

        // Upload page image
        const imageKey = generatePageImageKey(flipbookId, pageNum);
        const imageUpload = await uploadToS3(
          screenshot,
          imageKey,
          'image/jpeg'
        );

        console.log(`[PDF Extraction] Uploaded page ${pageNum}: ${imageUpload.cdnUrl}`);

        // Create flipbook_page record
        const pageRecord = await prisma.flipbook_pages.create({
          data: {
            flipbook_id: flipbookId,
            page_number: pageNum,
            image_url: imageUpload.cdnUrl,
            thumbnail_url: imageUpload.cdnUrl, // Same for now, generate thumbnails later
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        extractedPages.push(pageRecord);

      } catch (pageError: any) {
        console.error(`[PDF Extraction] Error extracting page ${pageNum}:`, pageError);
        // Continue with next page even if one fails
      }
    }

    // Update flipbook with extraction completion
    await prisma.flipbooks.update({
      where: { id: flipbookId },
      data: {
        page_count: extractedPages.length,
        toc_auto_generated: tocEntries.length > 0,
        toc_data: tocEntries.length > 0 ? tocEntries : null,
        toc_last_updated: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`[PDF Extraction] ✅ Extraction complete: ${extractedPages.length} pages extracted`);

    return NextResponse.json({
      success: true,
      pagesExtracted: extractedPages.length,
      tocEntries: tocEntries.length,
      flipbookId,
    } as PageExtractionResult);

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
  } finally {
    // Always close browser
    if (browser) {
      try {
        await browser.close();
        console.log(`[PDF Extraction] Browser closed`);
      } catch (closeError) {
        console.error(`[PDF Extraction] Error closing browser:`, closeError);
      }
    }
  }
}
