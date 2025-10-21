/**
 * Image Compression Utility
 * Client-side image compression for QC PWA photo capture
 * Optimized for noisy factory environments with limited bandwidth
 */

export interface CompressionOptions {
  maxWidth?: number; // Max width in pixels (default: 1920)
  maxHeight?: number; // Max height in pixels (default: 1080)
  quality?: number; // JPEG quality 0-1 (default: 0.8)
  targetSizeKB?: number; // Target file size in KB (optional)
  format?: 'jpeg' | 'webp' | 'png'; // Output format (default: 'jpeg')
}

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number; // Original size in bytes
  compressedSize: number; // Compressed size in bytes
  compressionRatio: number; // Ratio (0-1)
  width: number; // Final width
  height: number; // Final height
}

/**
 * Compress image file or blob
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    targetSizeKB,
    format = 'jpeg',
  } = options;

  // Load image
  const img = await loadImage(file);
  const originalSize = file.size;

  // Calculate new dimensions (maintain aspect ratio)
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight
  );

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw image on canvas (resized)
  ctx.drawImage(img, 0, 0, width, height);

  // Determine MIME type
  const mimeType = getMimeType(format);

  // Compress image
  let compressedBlob = await canvasToBlob(canvas, mimeType, quality);

  // If target size specified, iteratively compress until target met
  if (targetSizeKB) {
    let currentQuality = quality;
    const targetBytes = targetSizeKB * 1024;
    const maxIterations = 5;
    let iteration = 0;

    while (compressedBlob.size > targetBytes && iteration < maxIterations && currentQuality > 0.1) {
      currentQuality *= 0.9; // Reduce quality by 10%
      compressedBlob = await canvasToBlob(canvas, mimeType, currentQuality);
      iteration++;
    }
  }

  // Convert to data URL for preview
  const dataUrl = await blobToDataUrl(compressedBlob);

  return {
    blob: compressedBlob,
    dataUrl,
    originalSize,
    compressedSize: compressedBlob.size,
    compressionRatio: compressedBlob.size / originalSize,
    width,
    height,
  };
}

/**
 * Load image from file/blob
 */
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.floor(width), height: Math.floor(height) };
}

/**
 * Convert canvas to blob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
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
}

/**
 * Convert blob to data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get MIME type from format
 */
function getMimeType(format: 'jpeg' | 'webp' | 'png'): string {
  const mimeTypes = {
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    png: 'image/png',
  };
  // eslint-disable-next-line security/detect-object-injection
  return mimeTypes[format];
}

/**
 * Batch compress multiple images
 */
export async function compressImages(
  files: (File | Blob)[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Check if browser supports image compression
 */
export function isCompressionSupported(): boolean {
  return typeof HTMLCanvasElement !== 'undefined' && typeof FileReader !== 'undefined';
}

/**
 * Get recommended compression settings based on network conditions
 */
export function getRecommendedSettings(effectiveType?: string): CompressionOptions {
  // Network-aware compression settings
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.6,
        targetSizeKB: 200,
        format: 'jpeg',
      };
    case '3g':
      return {
        maxWidth: 1600,
        maxHeight: 900,
        quality: 0.7,
        targetSizeKB: 400,
        format: 'jpeg',
      };
    case '4g':
    default:
      return {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: 'jpeg',
      };
  }
}
