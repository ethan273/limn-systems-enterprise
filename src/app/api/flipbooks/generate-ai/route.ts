/**
 * AI Flipbook Generation API Route
 *
 * Generates flipbook layouts from product catalogs using AI
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateFlipbookLayout } from "@/lib/flipbooks/ai-generator";
import { features } from "@/lib/features";

export const runtime = "nodejs";
export const maxDuration = 60; // 1 minute for AI generation

interface GenerateRequest {
  productIds: string[];
  style?: "modern" | "classic" | "minimal";
  maxProductsPerPage?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Feature flag check
    if (!features.flipbooks) {
      return NextResponse.json(
        { error: "Flipbooks feature is not enabled" },
        { status: 403 }
      );
    }

    const body: GenerateRequest = await request.json();
    const { productIds, style = "modern", maxProductsPerPage = 4 } = body;

    if (!productIds || productIds.length === 0) {
      return NextResponse.json(
        { error: "No products provided" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch product data from public schema
    const { data: products, error: productsError } = await supabase
      .schema("public")
      .from("products")
      .select("id, name, description, category, base_price")
      .in("id", productIds);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No products found" },
        { status: 404 }
      );
    }

    // Transform products for AI generation
    const productInfo = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || undefined,
      price: p.base_price ? parseFloat(p.base_price) : undefined,
      category: p.category || undefined,
    }));

    // Generate layout using AI
    const layout = await generateFlipbookLayout(productInfo, {
      style,
      maxProductsPerPage,
    });

    // Create flipbook record in flipbook schema
    const { data: flipbook, error: flipbookError } = await supabase
      .schema("flipbook")
      .from("flipbooks")
      .insert({
        title: layout.title,
        description: layout.description,
        status: "DRAFT",
        page_count: layout.totalPages,
      })
      .select()
      .single();

    if (flipbookError) {
      console.error("Error creating flipbook:", flipbookError);
      return NextResponse.json(
        { error: "Failed to create flipbook" },
        { status: 500 }
      );
    }

    // For each page in the layout, we would:
    // 1. Generate a page image (combining product images)
    // 2. Upload to S3
    // 3. Create flipbook_page record
    // 4. Create hotspot records
    //
    // This is a simplified version that just returns the layout
    // In production, you would generate actual page images

    return NextResponse.json({
      success: true,
      flipbookId: flipbook.id,
      layout,
      message: "Flipbook layout generated successfully. Next step: generate page images.",
    });
  } catch (error: any) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate flipbook" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch generation status
 */
export async function GET(request: NextRequest) {
  try {
    if (!features.flipbooks) {
      return NextResponse.json(
        { error: "Flipbooks feature is not enabled" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const flipbookId = searchParams.get("flipbookId");

    if (!flipbookId) {
      return NextResponse.json(
        { error: "flipbookId required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: flipbook, error } = await supabase
      .schema("flipbook")
      .from("flipbooks")
      .select("id, title, description, status, page_count, created_at")
      .eq("id", flipbookId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Flipbook not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      flipbook,
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}
