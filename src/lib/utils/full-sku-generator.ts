/**
 * Full SKU Generator Utility (REDESIGNED October 3, 2025)
 *
 * Generates complete Full SKU for ordered items by combining:
 * - Base SKU from catalog item (e.g., "IN-SOFA-001")
 * - TOP 2 material selections by priority (e.g., "FAB-NAV-WOD-OAK")
 * - Unique hex identifier (e.g., "A3F2")
 *
 * Format: {BASE_SKU}-{MAT1_TYPE}-{MAT1_ABBR}-{MAT2_TYPE}-{MAT2_ABBR}-{UNIQUE_HEX}
 * Example: "IN-SOFA-001-FAB-NAV-WOD-OAK-A3F2"
 *
 * CRITICAL: ALL materials stored in specifications JSON, but only top 2 shown in SKU
 * Material Priority: Fabric > Wood > Metal > Stone > Weaving > Carving
 *
 * Architecture: See /docs/IMPLEMENTATION_PLAN_SKU_FIXES.md
 */

import crypto from 'crypto';

/**
 * Material types in priority order (highest to lowest)
 */
type MaterialType = 'fabric' | 'wood' | 'metal' | 'stone' | 'weaving' | 'carving';

/**
 * Material specification structure
 */
export interface MaterialSelection {
  fabric?: {
    type?: string;
    brand?: string;
    collection?: string;
    color?: string;
    color_code?: string;
    sku?: string;
  };
  wood?: {
    type?: string;
    species?: string;
    finish?: string;
    finish_code?: string;
    sku?: string;
  };
  metal?: {
    type?: string;
    material?: string;
    finish?: string;
    finish_code?: string;
    sku?: string;
  };
  stone?: {
    type?: string;
    material?: string;
    finish?: string;
    color?: string;
    sku?: string;
  };
  weaving?: {
    material?: string;
    pattern?: string;
    color?: string;
    sku?: string;
  };
  carving?: {
    style?: string;
    pattern?: string;
    depth?: string;
    sku?: string;
  };
}

/**
 * Full SKU generation result
 */
export interface FullSkuResult {
  fullSku: string;              // Display SKU with top 2 materials + hex
  specifications: MaterialSelection; // ALL materials for database storage
  uniqueHex: string;            // Generated unique identifier
}

/**
 * Material priority order (highest to lowest)
 */
const MATERIAL_PRIORITY: readonly MaterialType[] = [
  'fabric',
  'wood',
  'metal',
  'stone',
  'weaving',
  'carving',
] as const;

/**
 * Material type prefixes for SKU components
 */
const MATERIAL_TYPE_PREFIXES = {
  fabric: 'FAB',
  wood: 'WOD',
  metal: 'MET',
  stone: 'STO',
  weaving: 'WEV',
  carving: 'CAR',
} as const;

/**
 * Abbreviate a material name into a short code using smart extraction
 *
 * Examples:
 * - "Navy Blue" → "NAV"
 * - "White Oak" → "OAK"
 * - "Brushed Nickel" → "BRN"
 * - "Maharam Divina" → "MAHDIV" (brand + collection)
 *
 * @param materialName - Full material name
 * @param context - Additional context (brand, collection)
 * @returns Abbreviated material code (3-6 characters, uppercase)
 */
function abbreviateMaterialName(
  materialName: string,
  context?: { brand?: string; collection?: string }
): string {
  if (!materialName) return '';

  // Special case: If brand + collection provided, use both
  if (context?.brand && context?.collection) {
    const brandAbbr = context.brand.substring(0, 3).toUpperCase();
    const collectionAbbr = context.collection.substring(0, 3).toUpperCase();
    return `${brandAbbr}${collectionAbbr}`;
  }

  // Remove common words using string replacement (no dynamic regex)
  let cleaned = materialName.toLowerCase();

  // Manual replacement for common words (type-safe, no security issues)
  cleaned = cleaned.replace(/\bfinish\b/g, '');
  cleaned = cleaned.replace(/\btype\b/g, '');
  cleaned = cleaned.replace(/\bcolor\b/g, '');
  cleaned = cleaned.replace(/\bmaterial\b/g, '');
  cleaned = cleaned.replace(/\bthe\b/g, '');
  cleaned = cleaned.replace(/\band\b/g, '');
  cleaned = cleaned.replace(/\bwith\b/g, '');
  cleaned = cleaned.replace(/\bgrade\b/g, '');

  // Clean up whitespace
  cleaned = cleaned.trim().replace(/\s+/g, ' ');

  // Split into words
  const words = cleaned.split(' ').filter(w => w.length > 0);

  // Abbreviation logic based on word count
  if (words.length === 0) {
    // Fallback: use first 3 chars of original name
    return materialName.substring(0, 3).toUpperCase();
  }

  if (words.length === 1) {
    // Single word: Take first 3-4 letters
    return words[0].substring(0, Math.min(4, words[0].length)).toUpperCase();
  }

  if (words.length > 2) {
    // Multiple words: Take first letter of each word
    return words.map(w => w.charAt(0)).join('').toUpperCase();
  }

  // Two words: Take first 2-3 letters of first meaningful word
  return words[0].substring(0, 3).toUpperCase();
}

/**
 * Get material from specifications (type-safe accessor to avoid object injection)
 *
 * @param materialType - Type of material to retrieve
 * @param materials - Material selections object
 * @returns Material specification or undefined
 */
function getMaterial(
  materialType: MaterialType,
  materials: MaterialSelection
): Record<string, any> | undefined {
  switch (materialType) {
    case 'fabric':
      return materials.fabric;
    case 'wood':
      return materials.wood;
    case 'metal':
      return materials.metal;
    case 'stone':
      return materials.stone;
    case 'weaving':
      return materials.weaving;
    case 'carving':
      return materials.carving;
    default:
      return undefined;
  }
}

/**
 * Get material type prefix (type-safe accessor)
 *
 * @param materialType - Type of material
 * @returns Material prefix (e.g., "FAB", "WOD")
 */
function getMaterialPrefix(materialType: MaterialType): string {
  switch (materialType) {
    case 'fabric':
      return MATERIAL_TYPE_PREFIXES.fabric;
    case 'wood':
      return MATERIAL_TYPE_PREFIXES.wood;
    case 'metal':
      return MATERIAL_TYPE_PREFIXES.metal;
    case 'stone':
      return MATERIAL_TYPE_PREFIXES.stone;
    case 'weaving':
      return MATERIAL_TYPE_PREFIXES.weaving;
    case 'carving':
      return MATERIAL_TYPE_PREFIXES.carving;
    default:
      return '';
  }
}

/**
 * Generate material SKU component from material specification
 *
 * @param materialType - Type of material
 * @param material - Material specification object
 * @returns SKU component (e.g., "FAB-NAV", "WOD-OAK") or null
 */
function generateMaterialComponent(
  materialType: MaterialType,
  material: Record<string, any>
): string | null {
  if (!material) return null;

  const prefix = getMaterialPrefix(materialType);
  if (!prefix) return null;

  // If material has explicit SKU, use it
  if (material.sku && typeof material.sku === 'string') {
    return material.sku;
  }

  // Generate abbreviation from material name/color/finish
  let materialName = '';
  let context: { brand?: string; collection?: string } = {};

  // Type-safe material name extraction (no bracket notation)
  switch (materialType) {
    case 'fabric':
      materialName = material.color || material.collection || '';
      context = {
        brand: material.brand,
        collection: material.collection,
      };
      break;
    case 'wood':
      materialName = material.species || material.finish || '';
      break;
    case 'metal':
      materialName = material.material || material.finish || '';
      break;
    case 'stone':
      materialName = material.material || material.color || '';
      break;
    case 'weaving':
      materialName = material.material || material.pattern || '';
      break;
    case 'carving':
      materialName = material.style || material.pattern || '';
      break;
  }

  if (!materialName) return null;

  const abbr = abbreviateMaterialName(materialName, context);
  return `${prefix}-${abbr}`;
}

/**
 * Generate unique hex identifier
 *
 * Creates a cryptographically random 6-character hex string
 * to differentiate orders with identical material selections
 *
 * @returns Unique hex code (e.g., "A3F2B7")
 */
export function generateUniqueHex(): string {
  // Generate 3 random bytes = 6 hex characters
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

/**
 * Generate Full SKU from base SKU and material specifications
 *
 * CRITICAL BEHAVIOR:
 * - Includes ONLY top 2 materials by priority in SKU
 * - Stores ALL materials in specifications for database
 * - Adds unique hex code to differentiate identical material combinations
 *
 * @param baseSku - Base SKU from catalog item (e.g., "IN-SOFA-001")
 * @param materials - Material selections (ALL materials)
 * @returns FullSkuResult with display SKU, full specifications, and unique hex
 *
 * @example
 * const result = generateFullSku("IN-SOFA-001", {
 *   fabric: { color: "Navy Blue" },
 *   wood: { species: "White Oak" },
 *   metal: { finish: "Brushed Nickel" }
 * });
 * // Returns:
 * // {
 * //   fullSku: "IN-SOFA-001-FAB-NAV-WOD-OAK-A3F2B7",
 * //   specifications: { fabric: {...}, wood: {...}, metal: {...} },
 * //   uniqueHex: "A3F2B7"
 * // }
 */
export function generateFullSku(
  baseSku: string,
  materials: MaterialSelection | null | undefined
): FullSkuResult {
  if (!baseSku) {
    throw new Error('Base SKU is required for Full SKU generation');
  }

  // Generate unique hex identifier
  const uniqueHex = generateUniqueHex();

  // Start with base SKU
  const components: string[] = [baseSku];

  // If no materials provided, return base SKU + unique hex only
  if (!materials) {
    return {
      fullSku: `${baseSku}-${uniqueHex}`,
      specifications: {},
      uniqueHex,
    };
  }

  // Find top 2 materials by priority
  const selectedMaterials: Array<{ type: MaterialType; component: string }> = [];

  for (const materialType of MATERIAL_PRIORITY) {
    const material = getMaterial(materialType, materials);
    if (material) {
      const component = generateMaterialComponent(materialType, material);
      if (component) {
        selectedMaterials.push({ type: materialType, component });

        // Stop after finding top 2
        if (selectedMaterials.length === 2) {
          break;
        }
      }
    }
  }

  // Add top 2 material components to SKU
  for (const selected of selectedMaterials) {
    components.push(selected.component);
  }

  // Add unique hex at the end
  components.push(uniqueHex);

  // Join all components with hyphens
  const fullSku = components.join('-');

  return {
    fullSku,
    specifications: materials, // Store ALL materials (not just top 2)
    uniqueHex,
  };
}

/**
 * Parse Full SKU into components
 *
 * Useful for analytics and display purposes
 *
 * @param fullSku - Complete Full SKU (e.g., "IN-SOFA-001-FAB-NAV-WOD-OAK-A3F2B7")
 * @returns Object with parsed components
 *
 * @example
 * const parsed = parseFullSku("IN-SOFA-001-FAB-NAV-WOD-OAK-A3F2B7");
 * // Returns:
 * // {
 * //   baseSku: "IN-SOFA-001",
 * //   materials: ["FAB-NAV", "WOD-OAK"],
 * //   uniqueHex: "A3F2B7"
 * // }
 */
export function parseFullSku(fullSku: string): {
  baseSku: string;
  materials: string[];
  uniqueHex: string;
} {
  if (!fullSku) {
    return { baseSku: '', materials: [], uniqueHex: '' };
  }

  const parts = fullSku.split('-');

  // Last part is always the unique hex (6 hex characters)
  const uniqueHex = parts[parts.length - 1] || '';

  // Remove hex from parts for further processing
  const partsWithoutHex = parts.slice(0, -1);

  // First 3 parts are typically the base SKU (e.g., "IN-SOFA-001")
  // Look for first material type prefix to determine where base SKU ends
  let baseSkuParts = Math.min(3, partsWithoutHex.length);

  for (let i = 3; i < partsWithoutHex.length; i++) {
    const part = partsWithoutHex.at(i);
    if (!part) continue;

    // Check if this part matches any material prefix
    const isPrefix = MATERIAL_PRIORITY.some(type =>
      getMaterialPrefix(type) === part.toUpperCase()
    );
    if (isPrefix) {
      baseSkuParts = i;
      break;
    }
  }

  const baseSku = partsWithoutHex.slice(0, baseSkuParts).join('-');

  // Group remaining parts into material components (pairs: PREFIX-ABBR)
  const materialParts = partsWithoutHex.slice(baseSkuParts);
  const materials: string[] = [];

  for (let i = 0; i < materialParts.length; i += 2) {
    const prefix = materialParts.at(i);
    const abbr = materialParts.at(i + 1);

    if (prefix && abbr) {
      materials.push(`${prefix}-${abbr}`);
    }
  }

  return { baseSku, materials, uniqueHex };
}

/**
 * Validate Full SKU format
 *
 * @param fullSku - Full SKU to validate
 * @returns true if valid format, false otherwise
 */
export function isValidFullSku(fullSku: string): boolean {
  if (!fullSku || typeof fullSku !== 'string') return false;

  // Full SKU should have at least base SKU (3+ parts) + unique hex
  const parts = fullSku.split('-');
  if (parts.length < 4) return false;

  // Each part should be non-empty and alphanumeric
  return parts.every(part => /^[A-Z0-9]+$/i.test(part));
}
