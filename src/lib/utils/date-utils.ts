/**
 * Safe date parsing utilities
 * Prevents crashes from null/undefined/invalid dates
 */

import { parseISO, format as dateFnsFormat, isValid } from 'date-fns';

/**
 * Safely parse a date value that might be null/undefined/invalid
 * @param value - Date string, Date object, or null/undefined
 * @returns Date object or null if invalid
 */
export function safeParseDatecol(value: string | Date | null | undefined): Date | null {
  if (!value) return null;

  try {
    const date = value instanceof Date ? value : parseISO(value);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Safely format a date value
 * @param value - Date string, Date object, or null/undefined
 * @param formatStr - date-fns format string (default: 'MMM dd, yyyy')
 * @param fallback - Fallback string if date is invalid (default: '—')
 * @returns Formatted date string or fallback
 */
export function safeFormatDate(
  value: string | Date | null | undefined,
  formatStr: string = 'MMM dd, yyyy',
  fallback: string = '—'
): string {
  const date = safeParseDate(value);
  if (!date) return fallback;

  try {
    return dateFnsFormat(date, formatStr);
  } catch {
    return fallback;
  }
}

/**
 * Safely create a Date for form inputs (YYYY-MM-DD format)
 * @param value - Date string, Date object, or null/undefined
 * @returns ISO date string or empty string
 */
export function safeDateToInput(value: string | Date | null | undefined): string {
  const date = safeParseDate(value);
  if (!date) return '';

  try {
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Check if a date value is valid
 * @param value - Date string, Date object, or null/undefined
 * @returns true if valid date, false otherwise
 */
export function isValidDate(value: string | Date | null | undefined): boolean {
  return safeParseDate(value) !== null;
}

// Fix typo in function name for backward compatibility
export const safeParseDate = safeParseDatecol;
