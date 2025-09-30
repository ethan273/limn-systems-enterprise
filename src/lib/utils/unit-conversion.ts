/**
 * Unit conversion utilities for furniture dimensions
 * Handles conversion between inches and centimeters
 */

export type DimensionUnit = 'inches' | 'cm';

export interface DualDimension {
  inches?: number;
  cm?: number;
  originalUnit: DimensionUnit;
}

/**
 * Conversion constants
 */
const INCHES_TO_CM = 2.54;
const CM_TO_INCHES = 1 / INCHES_TO_CM;

/**
 * Convert inches to centimeters
 */
export function inchesToCm(inches: number): number {
  return Math.round((inches * INCHES_TO_CM) * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert centimeters to inches
 */
export function cmToInches(cm: number): number {
  return Math.round((cm * CM_TO_INCHES) * 100) / 100; // Round to 2 decimal places
}

/**
 * Create dual dimension object from a single value and unit
 */
export function createDualDimension(value: number, unit: DimensionUnit): DualDimension {
  if (unit === 'inches') {
    return {
      inches: value,
      cm: inchesToCm(value),
      originalUnit: 'inches'
    };
  } else {
    return {
      inches: cmToInches(value),
      cm: value,
      originalUnit: 'cm'
    };
  }
}

/**
 * Update dual dimension when one unit changes
 */
export function updateDualDimension(
  currentDimension: DualDimension,
  newValue: number,
  changedUnit: DimensionUnit
): DualDimension {
  return createDualDimension(newValue, changedUnit);
}

/**
 * Format dimension for display
 */
export function formatDimension(value: number | undefined, unit: DimensionUnit): string {
  if (value === undefined || value === null) return '-';
  return `${value}${unit === 'inches' ? '"' : ' cm'}`;
}

/**
 * Get display value based on user preference
 */
export function getDisplayValue(dimension: DualDimension, preferredUnit: DimensionUnit): number | undefined {
  if (preferredUnit === 'inches') {
    return dimension.inches;
  } else {
    return dimension.cm;
  }
}

/**
 * Validate dimension value
 */
export function validateDimension(value: number): { valid: boolean; error?: string } {
  if (isNaN(value) || value < 0) {
    return { valid: false, error: 'Dimension must be a positive number' };
  }
  if (value > 10000) { // Reasonable max dimension
    return { valid: false, error: 'Dimension seems too large' };
  }
  return { valid: true };
}

/**
 * Convert database fields to dual dimensions
 */
export function dbToDualDimensions(
  inchesValue?: number,
  cmValue?: number,
  _preferredUnit: DimensionUnit = 'inches'
): DualDimension | null {
  if (inchesValue !== undefined && inchesValue !== null) {
    return {
      inches: inchesValue,
      cm: cmValue || inchesToCm(inchesValue),
      originalUnit: 'inches'
    };
  } else if (cmValue !== undefined && cmValue !== null) {
    return {
      inches: inchesValue || cmToInches(cmValue),
      cm: cmValue,
      originalUnit: 'cm'
    };
  }
  return null;
}

/**
 * Convert dual dimension to database fields
 */
export function dualDimensionToDb(dimension: DualDimension | null): {
  inches: number | null;
  cm: number | null;
} {
  if (!dimension) {
    return { inches: null, cm: null };
  }
  return {
    inches: dimension.inches || null,
    cm: dimension.cm || null
  };
}