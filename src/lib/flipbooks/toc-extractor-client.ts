/**
 * Client-Side TOC Extraction
 *
 * Wrapper around toc-extractor that only runs in browser environment.
 * PDF.js requires browser APIs (Canvas, DOMMatrix, etc.) so we run extraction
 * client-side and send the results to the server.
 *
 * Phase 1: TOC & Thumbnails Enhancement
 */

import { extractTOCFromPDF } from './toc-extractor';
import type { PDFTOCExtractionResult } from '@/types/flipbook-navigation';

/**
 * Extract TOC from PDF in browser
 * This function MUST only be called from client components
 */
export async function extractTOCFromPDFInBrowser(
  pdfUrl: string
): Promise<PDFTOCExtractionResult> {
  // Verify we're in browser environment
  if (typeof window === 'undefined') {
    throw new Error(
      'extractTOCFromPDFInBrowser must only be called from browser environment'
    );
  }

  // Call the main extractor (which will use browser worker)
  return extractTOCFromPDF(pdfUrl);
}
