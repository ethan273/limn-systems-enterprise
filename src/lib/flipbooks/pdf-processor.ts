/**
 * PDF Processing Utilities
 *
 * Handles PDF parsing and conversion to images for flipbook pages
 * Uses pdfjs-dist for PDF rendering and sharp for image processing
 */

import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

// Dynamic import for canvas (server-side only, uses DOMMatrix)
let canvasLib: any = null;

async function getCanvasLib() {
  if (!canvasLib && typeof window === "undefined") {
    canvasLib = await import("canvas");
  }
  return canvasLib;
}

// Dynamic import for pdfjs-dist (server-side only)
// Note: pdfjs-dist will be imported dynamically in functions to avoid build issues
let pdfjsLib: any = null;

async function getPdfjsLib() {
  if (!pdfjsLib && typeof window === "undefined") {
    // Dynamically import pdfjs-dist legacy build for Node.js compatibility
    try {
      pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // Disable worker for Node.js environment
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerPort = null;
      }
    } catch (error) {
      console.error("Failed to load pdfjs-dist:", error);
      throw new Error("PDF processing not available");
    }
  }
  return pdfjsLib;
}

export interface PdfProcessResult {
  pageCount: number;
  pages: Buffer[];
  metadata: {
    title?: string;
    author?: string;
    pageCount: number;
  };
}

/**
 * Process a PDF file and extract pages as images
 */
export async function processPdf(pdfBuffer: Buffer): Promise<PdfProcessResult> {
  // Load PDF document with pdf-lib for metadata
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const title = pdfDoc.getTitle();
  const author = pdfDoc.getAuthor();

  // Get pdfjs-dist dynamically
  const pdfjs = await getPdfjsLib();

  // Load PDF with pdfjs-dist for rendering (disable worker for Node.js)
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    isEvalSupported: false,
    useWorkerFetch: false,
    worker: null as any, // Explicitly disable worker
  });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  const pages: Buffer[] = [];

  // Get canvas library dynamically
  const canvas = await getCanvasLib();
  if (!canvas) {
    throw new Error("Canvas library not available");
  }

  // Render each page to image
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for quality

    // Create canvas using node-canvas
    const canvasInstance = canvas.createCanvas(viewport.width, viewport.height);
    const context = canvasInstance.getContext("2d");

    // Render PDF page to canvas
    await page.render({
      canvasContext: context as any,
      viewport: viewport,
    }).promise;

    // Convert canvas to buffer
    const imageBuffer = canvasInstance.toBuffer("image/png");

    // Convert to JPEG with sharp for better compression
    const jpegBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();

    pages.push(jpegBuffer);
  }

  return {
    pageCount,
    pages,
    metadata: {
      title,
      author,
      pageCount,
    },
  };
}

/**
 * Create a placeholder page image
 * In production, this would be replaced by actual PDF page rendering
 */
// eslint-disable-next-line no-unused-vars
async function createPlaceholderPageImage(pageNumber: number): Promise<Buffer> {
  // Create a simple placeholder image with page number
  const width = 800;
  const height = 1000;

  const svg = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#f5f5f5"/>
      <text x="50%" y="50%"
            text-anchor="middle"
            font-family="Arial"
            font-size="48"
            fill="#999">
        Page ${pageNumber}
      </text>
    </svg>
  `;

  return await sharp(Buffer.from(svg))
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Optimize image for flipbook page
 */
export async function optimizePageImage(imageBuffer: Buffer): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(1200, 1600, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 85,
      progressive: true,
    })
    .toBuffer();
}

/**
 * Create thumbnail from page image
 */
export async function createThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(300, 400, {
      fit: "cover",
    })
    .jpeg({
      quality: 80,
    })
    .toBuffer();
}

/**
 * Extract first page as cover image
 */
export async function extractCover(pdfBuffer: Buffer): Promise<Buffer> {
  const result = await processPdf(pdfBuffer);
  return result.pages[0] || Buffer.from("");
}

/**
 * Validate PDF file
 */
export async function validatePdf(buffer: Buffer): Promise<boolean> {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    return pdfDoc.getPageCount() > 0;
  } catch {
    return false;
  }
}

/**
 * Get PDF page count without full processing
 */
export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(buffer);
  return pdfDoc.getPageCount();
}
