/**
 * Full SKU Generator Utility
 *
 * Generates complete Full SKU for ordered items by combining:
 * - Base SKU from catalog item (e.g., "CC-CHA-001")
 * - Material selections (e.g., "FAB-NAV-WOD-OAK-MET-BRN")
 *
 * Format: {BASE_SKU}-{MATERIAL_COMPONENTS}
 * Example: "CC-CHA-001-FAB-NAV-WOD-OAK-MET-BRN"
 *
 * Created: October 2, 2025
 * Architecture: See /docs/catalog-detail-page/FULL_SKU_ARCHITECTURE.md
 */

/**
 * Material specification structure (subset from specifications JSON)
 */
export interface MaterialSpecifications {
  materials?: {
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
  };
}

/**
 * Material type prefixes for SKU components
 */
const MATERIAL_TYPE_PREFIXES: Record<string, string> = {
  fabric: 'FAB',
  wood: 'WOD',
  metal: 'MET',
  stone: 'STO',
  weaving: 'WEV',
  carving: 'CAR',
};

/**
 * Words to remove when abbreviating material names
 */
const COMMON_WORDS_TO_REMOVE = [
  'finish',
  'type',
  'color',
  'material',
  'the',
  'and',
  'with',
  'grade',
];

/**
 * Abbreviate a material name into a short code
 *
 * Examples:
 * - "Navy Blue" → "NAV"
 * - "White Oak" → "OAK"
 * - "Brushed Nickel" → "BRN"
 * - "Maharam Divina" → "MAHDIV" (brand + collection special case)
 *
 * @param materialName - Full material name (e.g., "Navy Blue Fabric")
 * @param context - Additional context for special cases (e.g., brand name)
 * @returns Abbreviated material code (e.g., "NAV")
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

  // Remove common words
  let cleaned = materialName;
  COMMON_WORDS_TO_REMOVE.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  // Clean up whitespace
  cleaned = cleaned.trim().replace(/\s+/g, ' ');

  // Split into words
  const words = cleaned.split(' ').filter(w => w.length > 0);

  // Abbreviation logic based on word count
  if (words.length === 0) {
    // Fallback: use first 3 chars of original name
    return materialName.substring(0, 3).toUpperCase();
  } else if (words.length === 1) {
    // Single word: Take first 3-4 letters
    return words[0].substring(0, Math.min(4, words[0].length)).toUpperCase();
  } else {
    // Multiple words: Take first 3 letters of first word
    // Or first letter of each word if very long
    if (words.length > 2) {
      // Take first letter of each word (e.g., "Brushed Nickel Steel" → "BNS")
      return words.map(w => w[0]).join('').toUpperCase();
    } else {
      // Take first 2-3 letters of first meaningful word
      return words[0].substring(0, 3).toUpperCase();
    }
  }
}

/**
 * Generate material SKU component from material specification
 *
 * @param materialType - Type of material ("fabric", "wood", "metal", etc.)
 * @param material - Material specification object
 * @returns SKU component (e.g., "FAB-NAV", "WOD-OAK")
 */
function generateMaterialComponent(
  materialType: string,
  material: any
): string | null {
  if (!material) return null;

  const prefix = MATERIAL_TYPE_PREFIXES[materialType];
  if (!prefix) return null;

  // If material has explicit SKU, use it
  if (material.sku) {
    return material.sku;
  }

  // Otherwise, generate abbreviation from material name/color/finish
  let materialName = '';
  let context: { brand?: string; collection?: string } = {};

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
    default:
      return null;
  }

  if (!materialName) return null;

  const abbr = abbreviateMaterialName(materialName, context);
  return `${prefix}-${abbr}`;
}

/**
 * Generate Full SKU from base SKU and material specifications
 *
 * @param baseSku - Base SKU from catalog item (e.g., "CC-CHA-001")
 * @param specifications - Material selections from order item
 * @returns Full SKU (e.g., "CC-CHA-001-FAB-NAV-WOD-OAK-MET-BRN")
 *
 * @example
 * const fullSku = generateFullSku("CC-CHA-001", {
 *   materials: {
 *     fabric: { color: "Navy" },
 *     wood: { species: "Oak" },
 *     metal: { finish: "Brushed Nickel" }
 *   }
 * });
 * // Returns: "CC-CHA-001-FAB-NAV-WOD-OAK-MET-BRN"
 */
export function generateFullSku(
  baseSku: string,
  specifications: MaterialSpecifications | null | undefined
): string {
  if (!baseSku) {
    throw new Error('Base SKU is required for Full SKU generation');
  }

  // Start with base SKU
  const components: string[] = [baseSku];

  // Add material components if specifications exist
  if (specifications?.materials) {
    const materialTypes = [
      'fabric',
      'wood',
      'metal',
      'stone',
      'weaving',
      'carving',
    ] as const;

    for (const materialType of materialTypes) {
      const material = specifications.materials[materialType];
      if (material) {
        const component = generateMaterialComponent(materialType, material);
        if (component) {
          components.push(component);
        }
      }
    }
  }

  // Join all components with hyphens
  return components.join('-');
}

/**
 * Parse Full SKU into components
 *
 * Useful for analytics and display purposes
 *
 * @param fullSku - Complete Full SKU (e.g., "CC-CHA-001-FAB-NAV-WOD-OAK")
 * @returns Object with parsed components
 *
 * @example
 * const parsed = parseFullSku("CC-CHA-001-FAB-NAV-WOD-OAK");
 * // Returns:
 * // {
 * //   baseSku: "CC-CHA-001",
 * //   materials: ["FAB-NAV", "WOD-OAK"]
 * // }
 */
export function parseFullSku(fullSku: string): {
  baseSku: string;
  materials: string[];
} {
  if (!fullSku) {
    return { baseSku: '', materials: [] };
  }

  const parts = fullSku.split('-');

  // First 3 parts are typically the base SKU (e.g., "CC-CHA-001")
  // Remaining parts are material components (e.g., "FAB", "NAV", "WOD", "OAK")

  // Try to identify base SKU (usually in format: PREFIX-NAME-SEQ)
  let baseSkuParts = 3;

  // Handle variations (e.g., "CC-CHA-DEEP-001" = 4 parts)
  // Look for the first material type prefix to determine where base SKU ends
  for (let i = 3; i < parts.length; i++) {
    const part = parts[i];
    if (Object.values(MATERIAL_TYPE_PREFIXES).includes(part.toUpperCase())) {
      baseSkuParts = i;
      break;
    }
  }

  const baseSku = parts.slice(0, baseSkuParts).join('-');

  // Group remaining parts into material components (pairs: PREFIX-ABBR)
  const materialParts = parts.slice(baseSkuParts);
  const materials: string[] = [];

  for (let i = 0; i < materialParts.length; i += 2) {
    if (i + 1 < materialParts.length) {
      materials.push(`${materialParts[i]}-${materialParts[i + 1]}`);
    }
  }

  return { baseSku, materials };
}

/**
 * Validate Full SKU format
 *
 * @param fullSku - Full SKU to validate
 * @returns true if valid format, false otherwise
 */
export function isValidFullSku(fullSku: string): boolean {
  if (!fullSku || typeof fullSku !== 'string') return false;

  // Full SKU should have at least base SKU (3+ parts)
  const parts = fullSku.split('-');
  if (parts.length < 3) return false;

  // Each part should be non-empty and alphanumeric
  return parts.every(part => /^[A-Z0-9]+$/i.test(part));
}
