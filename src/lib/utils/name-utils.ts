/**
 * Utility functions for handling name fields in CRM entities
 * Supports both legacy single name field and new first_name/last_name structure
 */

export interface NameFields {
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

/**
 * Get the full name from an entity with first_name/last_name or legacy name field
 * @param entity - Entity with name fields
 * @param fallback - Fallback text if no name is available
 * @returns Full name string
 */
export function getFullName(entity: NameFields, fallback: string = '—'): string {
  if (entity.first_name || entity.last_name) {
    return [entity.first_name, entity.last_name].filter(Boolean).join(' ').trim();
  }
  return entity.name || fallback;
}

/**
 * Create a full name from first and last name parts
 * @param first_name - First name
 * @param last_name - Last name (optional)
 * @returns Full name string
 */
export function createFullName(first_name: string, last_name?: string): string {
  return [first_name, last_name].filter(Boolean).join(' ').trim();
}

/**
 * Split a full name into first and last name (basic implementation)
 * @param fullName - Full name string
 * @returns Object with first_name and last_name
 */
export function splitFullName(fullName: string): { first_name: string; last_name?: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) {
    return { first_name: '' };
  }
  if (parts.length === 1) {
    return { first_name: parts[0]! };
  }
  const first_name = parts[0]!;
  const last_name = parts.slice(1).join(' ');
  return { first_name, last_name };
}
