/**
 * Cloudinary Upload Signature API Route
 *
 * Generates signed upload parameters for secure client-side PDF uploads to Cloudinary
 * This bypasses Vercel's body size limits by enabling direct browser-to-Cloudinary uploads
 *
 * Security: Uses server-side signature generation to prevent unauthorized uploads
 */

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { getUser } from "@/lib/auth/server";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const runtime = "nodejs";
export const maxDuration = 10; // Quick signature generation

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

    // Generate upload parameters
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `flipbooks/${flipbookId}/source`;

    // Parameters for upload (must match what client sends)
    const uploadParams = {
      timestamp: timestamp,
      public_id: publicId,
      folder: 'flipbooks',
      resource_type: 'image', // Cloudinary treats PDFs as images
      overwrite: true,
      invalidate: true,
      pages: true, // Extract page count
    };

    // Generate signature using Cloudinary SDK
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET!
    );

    console.log(`[Upload Signature] Generated for flipbook: ${flipbookId}`);

    // Return upload configuration for client
    return NextResponse.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      signature,
      timestamp,
      publicId,
      folder: 'flipbooks',
      uploadPreset: undefined, // Not using unsigned upload
    });

  } catch (error: any) {
    console.error("[Upload Signature] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
