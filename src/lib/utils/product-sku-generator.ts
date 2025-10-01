/**
 * Product SKU Generator Utility
 *
 * Generates shortened manufacturing SKUs following the format:
 * {COLLECTION_PREFIX}-{ITEM_NAME_ABBR}-{SEQ_NUMBER}-{MATERIAL1}-{MATERIAL2}
 *
 * Examples:
 * - UK-DINI-001-HER-OAK (Ukiah Dining Chair, Herringbone fabric, Oak wood)
 * - SH-CHAI-001-NAV-WALN (St Helena Chaise, Navy fabric, Walnut wood)
 * - PC-LOUN-002-TEAK (Pacifica Lounge, Teak wood only)
 */

/**
 * Material priority order for selecting top 2 materials
 */
const MATERIAL_PRIORITY = [
  'fabric',
  'wood',
  'metal',
  'stone',
  'weaving',
  'carving',
] as const;

/**
 * Abbreviate material name to 3-4 characters
 * Examples: "Herringbone" → "HER", "Oak" → "OAK", "Navy Blue" → "NAVY"
 */
function abbreviateMaterial(materialName: string): string {
  if (!materialName) return '';

  // Remove common words
  const cleaned = materialName
    .replace(/\b(fabric|wood|metal|stone|finish|color)\b/gi, '')
    .trim();

  // Take first 4 characters of first word
  const firstWord = cleaned.split(/\s+/)[0] || materialName.split(/\s+/)[0] || '';
  return firstWord.substring(0, 4).toUpperCase();
}

/**
 * Extract top 2 materials based on priority order
 *
 * @param materials Object with material selections (e.g., { fabric_brand: "Maharam", wood_type: "Oak" })
 * @returns Array of top 2 material abbreviations
 */
function extractTopMaterials(materials: Record<string, string | null | undefined>): string[] {
  const selectedMaterials: { priority: number; abbr: string }[] = [];

  // Check each material type in priority order
  for (const [index, materialType] of MATERIAL_PRIORITY.entries()) {
    // Look for any field containing this material type
    for (const [key, value] of Object.entries(materials)) {
      if (
        key.toLowerCase().includes(materialType) &&
        value &&
        typeof value === 'string' &&
        value.trim() !== ''
      ) {
        const abbr = abbreviateMaterial(value);
        if (abbr) {
          selectedMaterials.push({ priority: index, abbr });
          break; // Only take first match for each material type
        }
      }
    }
  }

  // Sort by priority and take top 2
  return selectedMaterials
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 2)
    .map((m) => m.abbr);
}

/**
 * Generate product SKU for manufacturing/inventory tracking
 *
 * Format: {PREFIX}-{NAME_ABBR}-{SEQ}-{MAT1}-{MAT2}
 *
 * @param baseSku Base SKU from catalog (e.g., "UK-DINI-001")
 * @param materials Object with selected materials
 * @returns Product SKU (e.g., "UK-DINI-001-HER-OAK")
 */
export function generateProductSku(
  baseSku: string,
  materials: Record<string, string | null | undefined>
): string {
  if (!baseSku) {
    throw new Error('Base SKU is required to generate Product SKU');
  }

  // Extract top 2 materials
  const topMaterials = extractTopMaterials(materials);

  // Build product SKU
  if (topMaterials.length === 0) {
    // No materials selected - just use base SKU
    return baseSku;
  }

  // Add materials to base SKU
  return `${baseSku}-${topMaterials.join('-')}`;
}

/**
 * Parse material selections from order item specifications
 *
 * @param specifications JSONB specifications from order_items table
 * @returns Normalized materials object
 */
export function parseMaterialSelections(
  specifications: Record<string, unknown> | null | undefined
): Record<string, string | null | undefined> {
  if (!specifications || typeof specifications !== 'object') {
    return {};
  }

  const materials: Record<string, string | null | undefined> = {};

  // Extract material fields from specifications
  for (const [key, value] of Object.entries(specifications)) {
    if (
      key.toLowerCase().includes('fabric') ||
      key.toLowerCase().includes('wood') ||
      key.toLowerCase().includes('metal') ||
      key.toLowerCase().includes('stone') ||
      key.toLowerCase().includes('weaving') ||
      key.toLowerCase().includes('carving')
    ) {
      // Safe object assignment - key is validated as string from Object.entries()
      // eslint-disable-next-line security/detect-object-injection
      materials[key] = typeof value === 'string' ? value : null;
    }
  }

  return materials;
}

/**
 * Validate product SKU format
 *
 * @param sku Product SKU to validate
 * @returns True if valid, false otherwise
 */
export function isValidProductSku(sku: string): boolean {
  if (!sku || typeof sku !== 'string') return false;

  // Format: PREFIX-NAME-###-MAT1-MAT2 or PREFIX-NAME-###-MAT1 or PREFIX-NAME-###
  const parts = sku.split('-');

  // Minimum: PREFIX-NAME-### (3 parts)
  if (parts.length < 3) return false;

  // Third part should be a number (sequence)
  const seqPart = parts[2];
  if (!/^\d+$/.test(seqPart)) return false;

  return true;
}
