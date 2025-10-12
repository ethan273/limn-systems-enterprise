/**
 * PDF Processing Utilities
 *
 * Handles PDF parsing and conversion to images for flipbook pages
 * Uses pdf-lib for PDF manipulation and sharp for image processing
 */

import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

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
  // Load PDF document
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();

  // Extract metadata
  const title = pdfDoc.getTitle();
  const author = pdfDoc.getAuthor();

  // Note: Actual PDF to image conversion would require additional libraries
  // like pdf2pic or node-canvas. For now, we'll return a placeholder
  // In production, you would:
  // 1. Use pdf2pic to convert each page to an image
  // 2. Use sharp to optimize and resize images
  // 3. Return the processed image buffers

  const pages: Buffer[] = [];

  // Placeholder: In real implementation, convert each page to image
  for (let i = 0; i < pageCount; i++) {
    // This would be the actual page image buffer
    // For now, create a placeholder
    const placeholderImage = await createPlaceholderPageImage(i + 1);
    pages.push(placeholderImage);
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
