/**
 * Base SKU Generator Utility
 *
 * Generates unique base SKUs for catalog items following the format:
 * {COLLECTION_PREFIX}-{ITEM_NAME_ABBR}-{VARIATION}-{SEQ_NUMBER}
 *
 * Examples:
 * - IN-DINI-001 (Inyo Dining Chair, no variation)
 * - IN-SECT-DEEP-001 (Inyo Sectional Deep)
 * - PC-LOUN-WIDE-002 (Pacifica Lounge Wide, 2nd one)
 */

import { prisma } from "@/lib/prisma";

/**
 * Abbreviate item name by taking first 4 letters of first word
 * If word is shorter than 4 letters, use the whole word without padding
 * Example: "Dining Chair" → "DINI", "St Helena" → "ST", "Bar Stool" → "BAR"
 */
function abbreviateItemName(name: string): string {
  const words = name.trim().split(/\s+/);
  const firstWord = words[0] || '';
  // Take first 4 letters, but don't pad if shorter (no underscores)
  return firstWord.substring(0, 4).toUpperCase();
}

/**
 * Generate base SKU for an item
 * Format: {PREFIX}-{NAME_ABBR}-{VARIATION}-{SEQ}
 */
export async function generateBaseSku(
  collectionPrefix: string,
  itemName: string,
  variationType?: string | null
): Promise<string> {
  const nameAbbr = abbreviateItemName(itemName);
  const variation = variationType ? variationType.toUpperCase() : null;

  // Find all existing SKUs matching this pattern to determine next sequence number
  const existingSkus = await prisma.items.findMany({
    where: {
      base_sku: {
        startsWith: variation
          ? `${collectionPrefix}-${nameAbbr}-${variation}-`
          : `${collectionPrefix}-${nameAbbr}-`
      }
    },
    select: { base_sku: true },
    orderBy: { base_sku: 'desc' }
  });

  // Extract sequence numbers and find the highest
  let maxSeq = 0;
  for (const item of existingSkus) {
    if (!item.base_sku) continue;
    const parts = item.base_sku.split('-');
    const seqStr = parts[parts.length - 1];
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  // Generate next sequence number (001, 002, etc.)
  const nextSeq = (maxSeq + 1).toString().padStart(3, '0');

  // Assemble final base SKU
  const baseSku = variation
    ? `${collectionPrefix}-${nameAbbr}-${variation}-${nextSeq}`
    : `${collectionPrefix}-${nameAbbr}-${nextSeq}`;

  return baseSku;
}

/**
 * Validate that a base SKU is unique
 */
export async function isBaseSkuUnique(baseSku: string, excludeItemId?: string): Promise<boolean> {
  // Note: findFirst not supported by wrapper, using findMany
  const existingArray = await prisma.items.findMany({
    where: {
      base_sku: baseSku,
      ...(excludeItemId && { id: { not: excludeItemId } })
    },
    take: 1,
  });
  const existing = existingArray.length > 0 ? existingArray[0] : null;

  return !existing;
}

/**
 * Regenerate base SKU if name, collection, or variation changes
 */
export async function regenerateBaseSku(
  itemId: string,
  collectionId: string,
  itemName: string,
  variationType?: string | null
): Promise<string> {
  // Get collection prefix
  const collection = await prisma.collections.findUnique({
    where: { id: collectionId },
    select: { prefix: true }
  });

  if (!collection?.prefix) {
    throw new Error('Collection prefix not found');
  }

  // Generate new base SKU
  return generateBaseSku(collection.prefix, itemName, variationType);
}
