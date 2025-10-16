/**
 * User utility functions for handling name fields during migration
 * from single 'name' field to 'first_name' + 'last_name' fields
 */

interface UserWithNames {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  name?: string | null; // Legacy field
  email?: string | null;
}

/**
 * Get the full name of a user, intelligently handling the migration
 * from legacy 'name' field to 'first_name' + 'last_name' fields
 */
export function getUserFullName(user: UserWithNames | null | undefined): string {
  if (!user) return 'Unknown User';

  // Priority 1: Construct from first_name and last_name
  if (user.first_name || user.last_name) {
    const parts = [user.first_name, user.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  }

  // Priority 2: Use full_name (generated column in DB)
  if (user.full_name) return user.full_name;

  // Priority 3: Fall back to legacy name field
  if (user.name) return user.name;

  // Priority 4: Use email username
  if (user.email) {
    const emailUsername = user.email.split('@')[0];
    if (emailUsername) return emailUsername;
  }

  // Last resort
  return 'Unknown User';
}

/**
 * Get the initials of a user for avatar display
 */
export function getUserInitials(user: UserWithNames | null | undefined): string {
  if (!user) return 'U';

  // Priority 1: From first_name and last_name
  if (user.first_name || user.last_name) {
    const initials = [
      user.first_name?.[0],
      user.last_name?.[0]
    ].filter(Boolean).join('').toUpperCase();
    if (initials) return initials;
  }

  // Priority 2: From full_name
  if (user.full_name) {
    return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // Priority 3: From legacy name field
  if (user.name) {
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // Priority 4: From email
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }

  return 'U';
}

/**
 * Get the first name of a user
 */
export function getUserFirstName(user: UserWithNames | null | undefined): string {
  if (!user) return '';

  // Priority 1: Use first_name field
  if (user.first_name) return user.first_name;

  // Priority 2: Extract from full_name
  if (user.full_name) {
    return user.full_name.split(' ')[0] || '';
  }

  // Priority 3: Extract from legacy name field
  if (user.name) {
    return user.name.split(' ')[0] || '';
  }

  return '';
}

/**
 * Get the last name of a user
 */
export function getUserLastName(user: UserWithNames | null | undefined): string {
  if (!user) return '';

  // Priority 1: Use last_name field
  if (user.last_name) return user.last_name;

  // Priority 2: Extract from full_name
  if (user.full_name) {
    const parts = user.full_name.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

  // Priority 3: Extract from legacy name field
  if (user.name) {
    const parts = user.name.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

  return '';
}
