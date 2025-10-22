/**
 * Client-Side PDF Processing Utilities
 *
 * Shared PDF.js processing for client-side PDF rendering.
 * Used by Design Boards and Flipbooks for consistent PDF handling.
 *
 * IMPORTANT: This runs in the browser only (client-side).
 * For server-side PDF operations, see pdf-processor.ts
 */

export interface PdfPageRenderOptions {
  scale?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

export interface PdfPageResult {
  pageNumber: number;
  width: number;
  height: number;
  dataUrl: string;
  blob: Blob;
}

/**
 * Initialize PDF.js worker
 * Must be called before using any PDF.js functions
 */
export async function initializePdfWorker() {
  const pdfjsLib = await import('pdfjs-dist');

  // Use local worker file to avoid CSP issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  return pdfjsLib;
}

/**
 * Render a single PDF page to canvas and return as data URL and blob
 *
 * @example
 * ```ts
 * const pdfjsLib = await initializePdfWorker();
 * const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
 * const result = await renderPdfPage(pdf, 1, { scale: 2.0, format: 'jpeg' });
 * ```
 */
export async function renderPdfPage(
  pdf: any,
  pageNumber: number,
  options: PdfPageRenderOptions = {}
): Promise<PdfPageResult> {
  const {
    scale = 1.5,
    format = 'jpeg',
    quality = 0.9,
  } = options;

  // Get the page
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  // Create canvas element
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to get canvas 2D context');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Render page to canvas
  await page.render({
    canvasContext: context as any,
    viewport: viewport,
  } as any).promise;

  // Convert canvas to data URL
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, quality);

  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      quality
    );
  });

  return {
    pageNumber,
    width: viewport.width,
    height: viewport.height,
    dataUrl,
    blob,
  };
}

/**
 * Render all pages of a PDF to images
 *
 * @example
 * ```ts
 * const results = await renderAllPdfPages(
 *   file,
 *   { scale: 2.0, format: 'jpeg' },
 *   (current, total) => console.log(`Progress: ${current}/${total}`)
 * );
 * ```
 */
export async function renderAllPdfPages(
  file: File,
  options: PdfPageRenderOptions = {},
  onProgress?: (_current: number, _total: number) => void
): Promise<PdfPageResult[]> {
  // Initialize PDF.js
  const pdfjsLib = await initializePdfWorker();

  // Load PDF
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;

  // Render all pages
  const results: PdfPageResult[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const result = await renderPdfPage(pdf, i, options);
    results.push(result);

    if (onProgress) {
      onProgress(i, pageCount);
    }
  }

  return results;
}

/**
 * Get PDF metadata without rendering
 */
export async function getPdfMetadata(file: File) {
  const pdfjsLib = await initializePdfWorker();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const metadata = await pdf.getMetadata();

  return {
    numPages: pdf.numPages,
    info: metadata.info,
    metadata: metadata.metadata,
  };
}

/**
 * Render first page of PDF (useful for thumbnails/previews)
 */
export async function renderPdfFirstPage(
  file: File,
  options: PdfPageRenderOptions = {}
): Promise<PdfPageResult> {
  const pdfjsLib = await initializePdfWorker();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  return renderPdfPage(pdf, 1, options);
}
