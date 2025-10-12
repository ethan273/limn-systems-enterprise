/**
 * S3 Storage Utilities for Flipbooks
 *
 * Handles file uploads to S3 for flipbook assets (PDFs, images, etc.)
 * Uses AWS SDK v3 with CloudFront CDN for delivery
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "limn-flipbooks";
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";

export interface UploadResult {
  key: string;
  url: string;
  cdnUrl: string;
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000", // 1 year
  });

  await s3Client.send(command);

  const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  const cdnUrl = CDN_URL ? `${CDN_URL}/${key}` : url;

  return { key, url, cdnUrl };
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a presigned URL for temporary access
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate S3 key for flipbook PDF
 */
export function generatePdfKey(flipbookId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `flipbooks/${flipbookId}/pdfs/${timestamp}-${sanitized}`;
}

/**
 * Generate S3 key for flipbook page image
 */
export function generatePageImageKey(flipbookId: string, pageNumber: number): string {
  return `flipbooks/${flipbookId}/pages/page-${pageNumber}.jpg`;
}

/**
 * Generate S3 key for flipbook thumbnail
 */
export function generateThumbnailKey(flipbookId: string): string {
  return `flipbooks/${flipbookId}/thumbnail.jpg`;
}

/**
 * Generate S3 key for flipbook cover
 */
export function generateCoverKey(flipbookId: string): string {
  return `flipbooks/${flipbookId}/cover.jpg`;
}
