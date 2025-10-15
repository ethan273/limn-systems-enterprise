/**
 * AI Flipbook Generation Utilities
 *
 * Uses OpenAI to generate flipbook layouts from product catalogs
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface ProductInfo {
  id: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
}

export interface PageLayout {
  pageNumber: number;
  products: Array<{
    productId: string;
    xPercent: number;
    yPercent: number;
    width: number;
    height: number;
  }>;
  layout: "single" | "grid-2" | "grid-3" | "grid-4" | "featured";
}

export interface GenerationResult {
  title: string;
  description: string;
  pages: PageLayout[];
  totalPages: number;
}

/**
 * Generate flipbook layout from product catalog
 */
export async function generateFlipbookLayout(
  products: ProductInfo[],
  options: {
    style?: "modern" | "classic" | "minimal";
    maxProductsPerPage?: number;
  } = {}
): Promise<GenerationResult> {
  const { style = "modern", maxProductsPerPage = 4 } = options;

  // Create prompt for OpenAI
  const prompt = `Generate a professional flipbook catalog layout for the following products:

${products.map((p, i) => `${i + 1}. ${p.name}${p.category ? ` (${p.category})` : ""}`).join("\n")}

Style: ${style}
Max products per page: ${maxProductsPerPage}

Generate a JSON response with:
1. A catchy title for the flipbook
2. A brief description
3. Page layouts with product placement (x%, y%, width%, height%)
4. Group related products together
5. Use appropriate layouts (single, grid-2, grid-3, grid-4, featured)

Respond with JSON only, no additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert catalog designer. Generate optimal layouts for product flipbooks in JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content) as GenerationResult;
    return result;
  } catch (error) {
    console.error("AI generation error:", error);

    // Fallback: Generate simple layout automatically
    return generateFallbackLayout(products, maxProductsPerPage);
  }
}

/**
 * Fallback layout generator (no AI required)
 */
function generateFallbackLayout(
  products: ProductInfo[],
  maxPerPage: number
): GenerationResult {
  const pages: PageLayout[] = [];
  let currentPage = 1;

  for (let i = 0; i < products.length; i += maxPerPage) {
    const pageProducts = products.slice(i, i + maxPerPage);
    const layout = getLayoutType(pageProducts.length);

    pages.push({
      pageNumber: currentPage++,
      products: pageProducts.map((product, index) => {
        const position = getProductPosition(index, layout);
        return {
          productId: product.id,
          ...position,
        };
      }),
      layout,
    });
  }

  return {
    title: "Product Catalog",
    description: "A collection of our finest products",
    pages,
    totalPages: pages.length,
  };
}

/**
 * Determine layout type based on product count
 */
function getLayoutType(count: number): PageLayout["layout"] {
  if (count === 1) return "single";
  if (count === 2) return "grid-2";
  if (count === 3) return "grid-3";
  return "grid-4";
}

/**
 * Calculate product position based on layout and index
 */
function getProductPosition(
  index: number,
  layout: PageLayout["layout"]
): { xPercent: number; yPercent: number; width: number; height: number } {
  const positions: Record<string, Array<any>> = {
    single: [{ xPercent: 25, yPercent: 25, width: 50, height: 50 }],
    "grid-2": [
      { xPercent: 15, yPercent: 25, width: 35, height: 50 },
      { xPercent: 55, yPercent: 25, width: 35, height: 50 },
    ],
    "grid-3": [
      { xPercent: 10, yPercent: 20, width: 30, height: 60 },
      { xPercent: 40, yPercent: 20, width: 30, height: 60 },
      { xPercent: 70, yPercent: 20, width: 30, height: 60 },
    ],
    "grid-4": [
      { xPercent: 10, yPercent: 10, width: 40, height: 40 },
      { xPercent: 55, yPercent: 10, width: 40, height: 40 },
      { xPercent: 10, yPercent: 55, width: 40, height: 40 },
      { xPercent: 55, yPercent: 55, width: 40, height: 40 },
    ],
    featured: [{ xPercent: 20, yPercent: 20, width: 60, height: 60 }],
  };

  // eslint-disable-next-line security/detect-object-injection
  return positions[layout]?.[index] || positions.single[0]!; // Safe: layout is validated type, index is controlled loop variable
}

/**
 * Parse catalog from text/CSV
 */
export function parseCatalogText(text: string): ProductInfo[] {
  const lines = text.split("\n").filter((line) => line.trim());
  const products: ProductInfo[] = [];

  for (const line of lines) {
    // Try to parse as CSV: name,price,category
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length >= 1) {
      products.push({
        id: `temp-${products.length}`,
        name: parts[0]!,
        price: parts[1] ? parseFloat(parts[1]) : undefined,
        category: parts[2],
      });
    }
  }

  return products;
}
