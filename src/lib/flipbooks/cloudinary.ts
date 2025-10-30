import { log } from '@/lib/logger';
/**
 * Cloudinary Integration for Flipbook PDF Processing
 *
 * Replaces Puppeteer-based PDF extraction with Cloudinary's cloud-based service
 * Benefits:
 * - No serverless limitations (no Chromium/Puppeteer dependencies)
 * - Built-in CDN for fast global delivery
 * - Automatic image optimization (WebP, AVIF)
 * - No cold starts or timeout issues
 * - Pay-per-use pricing
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  resourceType: string;
  pages?: number; // For PDFs
}

export interface CloudinaryPageExtractionResult {
  pageNumber: number;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

/**
 * Upload PDF to Cloudinary
 *
 * @param buffer - PDF file buffer
 * @param flipbookId - Unique flipbook identifier
 * @param filename - Original filename
 * @returns Upload result with page count and URL
 */
export async function uploadPdfToCloudinary(
  buffer: Buffer,
  flipbookId: string,
  filename: string
): Promise<CloudinaryUploadResult> {
  try {
    log.info(`[Cloudinary] Uploading PDF: ${filename} for flipbook ${flipbookId}`);

    // Upload as base64 string
    const base64Pdf = `data:application/pdf;base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64Pdf, {
      public_id: `flipbooks/${flipbookId}/source`,
      resource_type: 'image', // Cloudinary treats PDFs as images
      folder: 'flipbooks',
      overwrite: true,
      invalidate: true, // Clear CDN cache
      // PDF-specific options
      pages: true, // Extract page count
    });

    log.info(`[Cloudinary] PDF uploaded successfully: ${result.secure_url}`);
    log.info(`[Cloudinary] Pages detected: ${result.pages || 'unknown'}`);

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
      pages: result.pages,
    };
  } catch (error: any) {
    log.error('[Cloudinary] PDF upload failed:', error);
    throw new Error(`Cloudinary PDF upload failed: ${error.message}`);
  }
}

/**
 * Upload image to Cloudinary
 *
 * @param buffer - Image file buffer
 * @param flipbookId - Unique flipbook identifier
 * @param pageNumber - Page number for this image
 * @returns Upload result with URL
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  flipbookId: string,
  pageNumber: number
): Promise<CloudinaryUploadResult> {
  try {
    log.info(`[Cloudinary] Uploading image for flipbook ${flipbookId}, page ${pageNumber}`);

    // Upload as base64 string
    const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64Image, {
      public_id: `flipbooks/${flipbookId}/pages/page-${pageNumber}`,
      resource_type: 'image',
      folder: 'flipbooks',
      overwrite: true,
      invalidate: true,
      // Image optimization
      quality: 'auto:good',
      fetch_format: 'auto', // Serve WebP/AVIF to supported browsers
    });

    log.info(`[Cloudinary] Image uploaded successfully: ${result.secure_url}`);

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
    };
  } catch (error: any) {
    log.error('[Cloudinary] Image upload failed:', error);
    throw new Error(`Cloudinary image upload failed: ${error.message}`);
  }
}

/**
 * Extract pages from PDF as images using Cloudinary transformations
 *
 * Instead of downloading and rendering, we use Cloudinary's transformation API
 * to generate page URLs on-the-fly. Pages are generated as needed via CDN.
 *
 * @param pdfPublicId - Cloudinary public ID of uploaded PDF
 * @param pageCount - Total number of pages in PDF
 * @param flipbookId - Unique flipbook identifier
 * @returns Array of page extraction results
 */
export async function extractPdfPages(
  pdfPublicId: string,
  pageCount: number,
  _flipbookId: string
): Promise<CloudinaryPageExtractionResult[]> {
  try {
    log.info(`[Cloudinary] Extracting ${pageCount} pages from PDF: ${pdfPublicId}`);

    const pages: CloudinaryPageExtractionResult[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      // Generate transformation URL for this page
      // Cloudinary PDF transformation format: .../image/upload/pg_{page}/...
      const pageUrl = cloudinary.url(pdfPublicId, {
        resource_type: 'image',
        format: 'jpg',
        page: pageNum,
        quality: 'auto:good',
        fetch_format: 'auto',
        width: 1200,
        crop: 'limit', // Don't upscale, only downscale if needed
      });

      // Generate thumbnail URL - preserve aspect ratio
      const thumbnailUrl = cloudinary.url(pdfPublicId, {
        resource_type: 'image',
        format: 'jpg',
        page: pageNum,
        width: 200,
        crop: 'limit', // Don't upscale or distort, preserve aspect ratio
        quality: 'auto:low',
      });

      pages.push({
        pageNumber: pageNum,
        url: pageUrl,
        thumbnailUrl: thumbnailUrl,
        width: 1200,
        height: 1600, // Approximate, Cloudinary will maintain aspect ratio
      });

      log.info(`[Cloudinary] Page ${pageNum} URL generated: ${pageUrl}`);
    }

    log.info(`[Cloudinary] ✅ Extracted ${pages.length} pages from PDF`);

    return pages;
  } catch (error: any) {
    log.error('[Cloudinary] Page extraction failed:', error);
    throw new Error(`Cloudinary page extraction failed: ${error.message}`);
  }
}

/**
 * Delete flipbook resources from Cloudinary
 *
 * @param flipbookId - Unique flipbook identifier
 */
export async function deleteFlipbookResources(flipbookId: string): Promise<void> {
  try {
    log.info(`[Cloudinary] Deleting resources for flipbook: ${flipbookId}`);

    // Delete all resources in the flipbook folder
    await cloudinary.api.delete_resources_by_prefix(`flipbooks/${flipbookId}`, {
      resource_type: 'image',
      invalidate: true,
    });

    // Delete the folder
    await cloudinary.api.delete_folder(`flipbooks/${flipbookId}`);

    log.info(`[Cloudinary] ✅ Deleted resources for flipbook: ${flipbookId}`);
  } catch (error: any) {
    log.error('[Cloudinary] Resource deletion failed:', error);
    throw new Error(`Cloudinary resource deletion failed: ${error.message}`);
  }
}

/**
 * Get metadata for uploaded PDF
 *
 * @param publicId - Cloudinary public ID
 * @returns Resource metadata including page count
 */
export async function getPdfMetadata(publicId: string): Promise<{
  pages: number;
  width: number;
  height: number;
  format: string;
  bytes: number;
}> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'image',
      pages: true,
    });

    return {
      pages: result.pages || 0,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: any) {
    log.error('[Cloudinary] Get metadata failed:', error);
    throw new Error(`Cloudinary get metadata failed: ${error.message}`);
  }
}

export default cloudinary;
