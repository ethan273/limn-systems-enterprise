/**
 * Dimension validation utilities for furniture types
 */

export type FurnitureType =
  | 'chair'
  | 'bench'
  | 'table'
  | 'sofa/loveseat'
  | 'sectional'
  | 'lounge'
  | 'chaise_lounge'
  | 'ottoman';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DimensionRules {
  required: string[];
  optional: string[];
  relationships: Array<{
    primary: string;
    dependent: string;
    rule: (_primary: number, _dependent: number) => boolean;
    message: string;
  }>;
}

/**
 * Define required and optional dimensions for each furniture type
 */
export const FURNITURE_DIMENSION_RULES: Record<FurnitureType, DimensionRules> = {
  table: {
    required: ['height_inches', 'length_inches', 'width_inches'],
    optional: ['apron_height_inches', 'leg_clearance_inches', 'overhang_inches', 'leaf_width_inches', 'leaf_length_inches'],
    relationships: [
      {
        primary: 'height_inches',
        dependent: 'apron_height_inches',
        rule: (height, apron) => apron < height,
        message: 'Apron height must be less than table height'
      }
    ]
  },
  chair: {
    required: ['height_inches', 'width_inches', 'depth_inches', 'seat_height_inches'],
    optional: ['seat_width_inches', 'seat_depth_inches', 'arm_height_inches', 'backrest_height_inches', 'width_across_arms_inches'],
    relationships: [
      {
        primary: 'height_inches',
        dependent: 'seat_height_inches',
        rule: (height, seat) => seat < height,
        message: 'Seat height must be less than overall height'
      },
      {
        primary: 'height_inches',
        dependent: 'backrest_height_inches',
        rule: (height, backrest) => backrest <= height,
        message: 'Backrest height cannot exceed overall height'
      }
    ]
  },
  bench: {
    required: ['height_inches', 'length_inches', 'depth_inches'],
    optional: ['backrest_height_inches', 'weight_capacity'],
    relationships: [
      {
        primary: 'height_inches',
        dependent: 'backrest_height_inches',
        rule: (height, backrest) => backrest <= height,
        message: 'Backrest height cannot exceed overall height'
      }
    ]
  },
  'sofa/loveseat': {
    required: ['height_inches', 'width_inches', 'depth_inches', 'seat_height_inches'],
    optional: ['seat_depth_inches', 'arm_height_inches', 'backrest_height_inches'],
    relationships: [
      {
        primary: 'height_inches',
        dependent: 'seat_height_inches',
        rule: (height, seat) => seat < height,
        message: 'Seat height must be less than overall height'
      }
    ]
  },
  sectional: {
    required: ['height_inches', 'width_inches', 'depth_inches'],
    optional: ['overall_assembled_width_inches', 'overall_assembled_depth_inches', 'corner_width_inches', 'corner_depth_inches', 'chaise_length_inches'],
    relationships: []
  },
  lounge: {
    required: ['height_inches', 'width_inches', 'depth_inches', 'seat_height_inches'],
    optional: ['reclined_depth_inches', 'footrest_length_inches', 'zero_wall_clearance_inches', 'swivel_range', 'rock_glide_depth_inches'],
    relationships: [
      {
        primary: 'depth_inches',
        dependent: 'reclined_depth_inches',
        rule: (depth, reclined) => reclined >= depth,
        message: 'Reclined depth should be greater than or equal to normal depth'
      }
    ]
  },
  chaise_lounge: {
    required: ['height_inches', 'width_inches', 'depth_inches', 'seat_height_inches'],
    optional: ['backrest_height_inches', 'backrest_angle', 'adjustable_positions', 'cushion_thickness_compressed_inches'],
    relationships: []
  },
  ottoman: {
    required: ['ottoman_height_inches', 'ottoman_length_inches', 'ottoman_width_inches'],
    optional: ['weight_capacity'],
    relationships: []
  }
};

/**
 * Validate dimensions for a specific furniture type
 */
export function validateFurnitureDimensions(
  furnitureType: FurnitureType,
  dimensions: Record<string, number | undefined>
): ValidationResult {
  const rules = FURNITURE_DIMENSION_RULES[furnitureType as keyof typeof FURNITURE_DIMENSION_RULES];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Return early if no rules found for this furniture type
  if (!rules) {
    errors.push(`Unknown furniture type: ${furnitureType}`);
    return {
      valid: false,
      errors,
      warnings
    };
  }

  // Check required dimensions
  for (const required of rules.required) {
    const value = dimensions[required as keyof typeof dimensions];
    if (value === undefined || value === null || isNaN(value)) {
      errors.push(`${formatFieldName(required)} is required for ${furnitureType}`);
    } else if (value <= 0) {
      errors.push(`${formatFieldName(required)} must be greater than 0`);
    }
  }

  // Check dimension relationships
  for (const relationship of rules.relationships) {
    const primaryValue = dimensions[relationship.primary as keyof typeof dimensions];
    const dependentValue = dimensions[relationship.dependent as keyof typeof dimensions];

    if (primaryValue && dependentValue) {
      if (!relationship.rule(primaryValue, dependentValue)) {
        warnings.push(relationship.message);
      }
    }
  }

  // Check for unreasonable values
  for (const [field, value] of Object.entries(dimensions)) {
    if (value !== undefined && value !== null && !isNaN(value)) {
      if (value > 200) { // 200 inches = ~16 feet
        warnings.push(`${formatFieldName(field)} seems unusually large (${value}")`);
      }
      if (value < 0.1) {
        warnings.push(`${formatFieldName(field)} seems unusually small (${value}")`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get required fields for a furniture type
 */
export function getRequiredFields(furnitureType: FurnitureType): string[] {
  return FURNITURE_DIMENSION_RULES[furnitureType as keyof typeof FURNITURE_DIMENSION_RULES]?.required || [];
}

/**
 * Get optional fields for a furniture type
 */
export function getOptionalFields(furnitureType: FurnitureType): string[] {
  return FURNITURE_DIMENSION_RULES[furnitureType as keyof typeof FURNITURE_DIMENSION_RULES]?.optional || [];
}

/**
 * Get all fields for a furniture type
 */
export function getAllFields(furnitureType: FurnitureType): string[] {
  const rules = FURNITURE_DIMENSION_RULES[furnitureType as keyof typeof FURNITURE_DIMENSION_RULES];
  return [...(rules?.required || []), ...(rules?.optional || [])];
}

/**
 * Format field name for display
 */
function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/_inches$|_cm$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Check if a field is relevant for the furniture type
 */
export function isFieldRelevant(furnitureType: FurnitureType, fieldName: string): boolean {
  const allFields = getAllFields(furnitureType);
  return allFields.includes(fieldName) || allFields.includes(fieldName.replace('_cm', '_inches'));
}

/**
 * Get dimension groups for UI organization
 */
export function getDimensionGroups(furnitureType: FurnitureType): Record<string, string[]> {
  // Define base groups in the order requested by user
  const baseGroups: Record<string, string[]> = {
    'Overall Dimensions': ['height_inches', 'width_inches', 'depth_inches', 'length_inches'],
    'Furniture Specific': [], // Will be populated based on furniture type
    'Specialized Dimensions': [],
    'Universal Measurements': [
      'weight_lbs_new', 'weight_kg',
      'clearance_required_new_inches', 'clearance_required_new_cm',
      'doorway_clearance_new_inches', 'doorway_clearance_new_cm',
      'diagonal_depth_new_inches', 'diagonal_depth_new_cm',
      'material_thickness_new_inches', 'material_thickness_new_cm'
    ]
  };

  // Define furniture-specific dimensions
  const furnitureSpecific: Record<FurnitureType, string[]> = {
    'table': ['apron_height_inches', 'leg_clearance_inches', 'overhang_inches', 'leaf_width_inches', 'leaf_length_inches', 'table_top_thickness_inches', 'leg_height_inches', 'clearance_height_inches', 'leg_section_length_inches'],
    'chair': ['seat_height_inches', 'seat_width_inches', 'seat_depth_inches', 'arm_height_inches', 'backrest_height_inches', 'width_across_arms_inches', 'back_height_inches'],
    'bench': ['seat_height_inches', 'seat_width_inches', 'seat_depth_inches', 'backrest_height_inches'],
    'sofa/loveseat': ['seat_height_inches', 'seat_width_inches', 'seat_depth_inches', 'arm_height_inches', 'backrest_height_inches', 'width_across_arms_inches', 'cushion_thickness_compressed_inches', 'cushion_thickness_uncompressed_inches'],
    'sectional': ['seat_height_inches', 'seat_width_inches', 'seat_depth_inches', 'arm_height_inches', 'backrest_height_inches', 'overall_assembled_width_inches', 'overall_assembled_depth_inches', 'corner_width_inches', 'corner_depth_inches', 'chaise_length_inches', 'min_configuration_width_inches', 'max_configuration_width_inches'],
    'lounge': ['seat_height_inches', 'seat_width_inches', 'seat_depth_inches', 'arm_height_inches', 'backrest_height_inches', 'reclined_depth_inches', 'footrest_length_inches', 'zero_wall_clearance_inches', 'rock_glide_depth_inches', 'swivel_range'],
    'chaise_lounge': ['seat_height_inches', 'seat_width_inches', 'seat_depth_inches', 'backrest_height_inches', 'backrest_angle', 'adjustable_positions', 'cushion_thickness_compressed_inches', 'cushion_thickness_uncompressed_inches', 'chaise_orientation'],
    'ottoman': ['ottoman_height_inches', 'ottoman_length_inches', 'ottoman_width_inches', 'weight_capacity']
  };

  // Set furniture-specific dimensions
  // eslint-disable-next-line security/detect-object-injection
  baseGroups['Furniture Specific'] = furnitureSpecific[furnitureType] || [];

  // Get all available fields from database
  const allAvailableFields = [
    // Core dimensions
    'height_inches', 'width_inches', 'depth_inches', 'length_inches',
    'height_cm', 'width_cm', 'depth_cm', 'length_cm',

    // Universal measurements
    'weight_lbs_new', 'weight_kg',
    'clearance_required_new_inches', 'clearance_required_new_cm',
    'doorway_clearance_new_inches', 'doorway_clearance_new_cm',
    'diagonal_depth_new_inches', 'diagonal_depth_new_cm',
    'material_thickness_new_inches', 'material_thickness_new_cm',

    // Seating
    'seat_height_inches', 'seat_height_cm',
    'seat_width_inches', 'seat_width_cm',
    'seat_depth_inches', 'seat_depth_cm',
    'arm_height_inches', 'arm_height_cm',
    'backrest_height_inches', 'backrest_height_cm',
    'width_across_arms_inches', 'width_across_arms_cm',
    'back_height_inches', 'back_height_cm',

    // Table specific
    'apron_height_inches', 'apron_height_cm',
    'leg_clearance_inches', 'leg_clearance_cm',
    'overhang_inches', 'overhang_cm',
    'leaf_width_inches', 'leaf_width_cm',
    'leaf_length_inches', 'leaf_length_cm',
    'table_top_thickness_inches', 'table_top_thickness_cm',
    'leg_height_inches', 'leg_height_cm',
    'clearance_height_inches', 'clearance_height_cm',
    'leg_section_length_inches', 'leg_section_length_cm',

    // Sectional & modular
    'overall_assembled_width_inches', 'overall_assembled_width_cm',
    'overall_assembled_depth_inches', 'overall_assembled_depth_cm',
    'corner_width_inches', 'corner_width_cm',
    'corner_depth_inches', 'corner_depth_cm',
    'chaise_length_inches', 'chaise_length_cm',
    'min_configuration_width_inches', 'min_configuration_width_cm',
    'max_configuration_width_inches', 'max_configuration_width_cm',

    // Lounge & reclining
    'reclined_depth_inches', 'reclined_depth_cm',
    'footrest_length_inches', 'footrest_length_cm',
    'zero_wall_clearance_inches', 'zero_wall_clearance_cm',
    'rock_glide_depth_inches', 'rock_glide_depth_cm',

    // Cushioning
    'cushion_thickness_compressed_inches', 'cushion_thickness_compressed_cm',
    'cushion_thickness_uncompressed_inches', 'cushion_thickness_uncompressed_cm',
    'backrest_angle', 'adjustable_positions',

    // Storage
    'interior_width_inches', 'interior_width_cm',
    'interior_depth_inches', 'interior_depth_cm',
    'interior_height_inches', 'interior_height_cm',

    // Ottoman
    'ottoman_height_inches', 'ottoman_height_cm',
    'ottoman_length_inches', 'ottoman_length_cm',
    'ottoman_width_inches', 'ottoman_width_cm',

    // Other measurements
    'weight_capacity', 'swivel_range', 'chaise_orientation'
  ];

  const usedFields = new Set<string>();

  // Process each group, ensuring no field appears twice
  const finalGroups: Record<string, string[]> = {};

  for (const [groupName, groupFields] of Object.entries(baseGroups)) {
    const validFields = groupFields.filter(field => {
      if (usedFields.has(field)) {
        return false; // Skip if already used
      }
      if (allAvailableFields.includes(field as never)) {
        usedFields.add(field);
        return true;
      }
      return false;
    });

    if (validFields.length > 0) {
      // eslint-disable-next-line security/detect-object-injection
      finalGroups[groupName] = validFields;
    }
  }

  // Add remaining fields to specialized dimensions
  const remainingFields = allAvailableFields.filter(field => !usedFields.has(field));
  if (remainingFields.length > 0) {
    finalGroups['Specialized Dimensions'] = remainingFields;
  }

  return finalGroups;
}