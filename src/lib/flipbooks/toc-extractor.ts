/**
 * TOC Extraction Utility
 *
 * Extracts table of contents from PDF files using PDF.js
 * Phase 1: TOC & Thumbnails Enhancement
 */

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type {
  TOCItem,
  TOCData,
  PDFOutlineItem,
  PDFTOCExtractionResult,
} from '@/types/flipbook-navigation';

// Configure PDF.js - disable worker for Node.js, enable for browser
if (typeof window === 'undefined') {
  // Node.js environment: disable worker
  pdfjs.GlobalWorkerOptions.workerPort = null;
} else {
  // Browser environment: use worker
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
}

/**
 * Extract TOC from PDF file
 */
export async function extractTOCFromPDF(
  pdfUrl: string
): Promise<PDFTOCExtractionResult> {
  try {
    // Load PDF document
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    // Get outline (bookmarks)
    const outline = await pdf.getOutline();

    if (!outline || outline.length === 0) {
      return {
        items: [],
        success: true,
        itemCount: 0,
        warnings: ['PDF has no embedded table of contents (bookmarks)'],
      };
    }

    // Convert PDF outline to our TOC format
    const items = await convertOutlineToTOC(outline as any, pdf);

    return {
      items,
      success: true,
      itemCount: countTOCItems(items),
    };
  } catch (error) {
    return {
      items: [],
      success: false,
      itemCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Convert PDF outline items to TOC items
 */
async function convertOutlineToTOC(
  outline: PDFOutlineItem[],
  pdf: pdfjs.PDFDocumentProxy,
  level: 1 | 2 | 3 | 4 = 1,
  parentSortOrder: number = 0
): Promise<TOCItem[]> {
  const items: TOCItem[] = [];

  for (let i = 0; i < outline.length; i++) {
    const outlineItem = outline[i];

    if (!outlineItem) continue;

    try {
      // Get page number from destination
      const pageNumber = await getPageNumberFromDest(outlineItem.dest, pdf);

      if (pageNumber === null) {
        console.warn(
          `Could not determine page number for TOC item: ${outlineItem.title}`
        );
        continue;
      }

      // Convert children recursively
      const children =
        outlineItem.items && level < 4
          ? await convertOutlineToTOC(
              outlineItem.items,
              pdf,
              (level + 1) as 2 | 3 | 4,
              i
            )
          : [];

      const tocItem: TOCItem = {
        id: generateTOCItemId(),
        title: sanitizeTitle(outlineItem.title),
        pageNumber,
        level,
        sortOrder: parentSortOrder * 1000 + i,
        children,
      };

      items.push(tocItem);
    } catch (error) {
      console.error(`Error processing TOC item: ${outlineItem.title}`, error);
    }
  }

  return items;
}

/**
 * Get page number from PDF destination
 */
async function getPageNumberFromDest(
  dest: string | unknown[] | undefined | null,
  pdf: pdfjs.PDFDocumentProxy
): Promise<number | null> {
  if (!dest) return null;

  try {
    // If dest is a string, it's a named destination
    let destination: unknown[];
    if (typeof dest === 'string') {
      const namedDest = await pdf.getDestination(dest);
      if (!namedDest) return null;
      destination = namedDest;
    } else if (Array.isArray(dest)) {
      destination = dest;
    } else {
      return null;
    }

    // First element is the page reference
    const pageRef = destination[0];
    if (!pageRef) return null;

    // Get page index from reference
    const pageIndex = await pdf.getPageIndex(pageRef as any);

    // Return 1-indexed page number
    return pageIndex + 1;
  } catch (error) {
    console.error('Error getting page number from destination:', error);
    return null;
  }
}

/**
 * Sanitize TOC title
 */
function sanitizeTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 500); // Enforce max length
}

/**
 * Generate unique TOC item ID
 */
function generateTOCItemId(): string {
  return `toc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Count total TOC items (including children)
 */
function countTOCItems(items: TOCItem[]): number {
  return items.reduce((count, item) => {
    return count + 1 + countTOCItems(item.children);
  }, 0);
}

/**
 * Flatten TOC tree to array
 */
export function flattenTOC(items: TOCItem[]): TOCItem[] {
  const flattened: TOCItem[] = [];

  function flatten(item: TOCItem) {
    flattened.push(item);
    item.children.forEach(flatten);
  }

  items.forEach(flatten);
  return flattened;
}

/**
 * Find TOC item by ID
 */
export function findTOCItem(items: TOCItem[], id: string): TOCItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    const found = findTOCItem(item.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Find TOC item by page number
 */
export function findTOCItemByPage(
  items: TOCItem[],
  pageNumber: number
): TOCItem | null {
  // Find exact match first
  for (const item of items) {
    if (item.pageNumber === pageNumber) return item;
    const found = findTOCItemByPage(item.children, pageNumber);
    if (found) return found;
  }

  // If no exact match, find the closest item before this page
  const flattened = flattenTOC(items);
  const itemsBeforePage = flattened.filter((item) => item.pageNumber <= pageNumber);
  if (itemsBeforePage.length === 0) return null;

  // Return the item with the highest page number that's still <= target
  return itemsBeforePage.reduce((closest, item) =>
    item.pageNumber > closest.pageNumber ? item : closest
  );
}

/**
 * Validate TOC structure
 */
export function validateTOCStructure(data: TOCData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.items || !Array.isArray(data.items)) {
    errors.push('TOC data must have an "items" array');
    return { valid: false, errors };
  }

  function validateItem(item: TOCItem, path: string = 'root') {
    if (!item.id) {
      errors.push(`${path}: Missing ID`);
    }

    if (!item.title || item.title.length < 1 || item.title.length > 500) {
      errors.push(`${path}: Invalid title length`);
    }

    if (item.pageNumber < 1) {
      errors.push(`${path}: Page number must be >= 1`);
    }

    if (item.level < 1 || item.level > 4) {
      errors.push(`${path}: Level must be between 1 and 4`);
    }

    if (item.icon && item.icon.length > 10) {
      errors.push(`${path}: Icon too long (max 10 characters)`);
    }

    if (item.children && Array.isArray(item.children)) {
      item.children.forEach((child, index) => {
        validateItem(child, `${path}.children[${index}]`);
      });
    }
  }

  data.items.forEach((item, index) => {
    validateItem(item, `items[${index}]`);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create empty TOC data structure
 */
export function createEmptyTOC(): TOCData {
  return {
    items: [],
    autoGenerated: false,
    lastModified: new Date().toISOString(),
    version: '1.0',
  };
}

/**
 * Export TOC to CSV format
 */
export function exportTOCToCSV(data: TOCData): string {
  const flattened = flattenTOC(data.items);
  const rows = [['Title', 'Page', 'Level', 'Icon']];

  flattened.forEach((item) => {
    rows.push([
      `"${item.title.replace(/"/g, '""')}"`, // Escape quotes
      item.pageNumber.toString(),
      item.level.toString(),
      item.icon || '',
    ]);
  });

  return rows.map((row) => row.join(',')).join('\n');
}

/**
 * Import TOC from CSV format
 */
export function importTOCFromCSV(csv: string): TOCData {
  const lines = csv.trim().split('\n');
  const items: TOCItem[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Simple CSV parsing (handles quoted fields)
    const matches = line.match(/("(?:[^"]|"")*"|[^,]*),([^,]*),([^,]*),([^,]*)/);
    if (!matches) continue;

    const [, title, page, level, icon] = matches;

    const item: TOCItem = {
      id: generateTOCItemId(),
      title: title?.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
      pageNumber: parseInt(page || '1', 10),
      level: (parseInt(level || '1', 10) as 1 | 2 | 3 | 4),
      sortOrder: i - 1,
      icon: icon?.trim() || undefined,
      children: [],
    };

    items.push(item);
  }

  return {
    items,
    autoGenerated: false,
    lastModified: new Date().toISOString(),
    version: '1.0',
  };
}
