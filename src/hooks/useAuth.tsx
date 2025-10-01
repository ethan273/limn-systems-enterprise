/**
 * DEPRECATED: This file is kept for backwards compatibility only.
 * All auth functionality has been consolidated to @/lib/auth/AuthProvider
 *
 * Please import from @/lib/auth/AuthProvider instead:
 * import { useAuthContext } from "@/lib/auth/AuthProvider";
 */

// Re-export from the canonical auth provider location
export { useAuthContext as useAuth, AuthProvider } from "@/lib/auth/AuthProvider";