/**
 * Feature Flag System
 *
 * Centralized feature flag management for the application.
 * Feature flags allow code to exist in the codebase but remain
 * disabled until explicitly enabled via environment variables.
 *
 * CRITICAL: All new features should be behind feature flags to
 * ensure production safety during development.
 */

/**
 * Feature flags configuration
 *
 * Add new features here with their corresponding environment variables.
 * Default to false for maximum safety.
 */
export const features = {
  /**
   * Flipbooks Feature
   *
   * Interactive 3D flipbook system with WebGL rendering, AI generation,
   * and deep product catalog integration.
   *
   * @default false (disabled in production)
   * @env NEXT_PUBLIC_ENABLE_FLIPBOOKS
   *
   * Development: Set to 'true' in .env.local
   * Production: Remains 'false' until feature is approved
   */
  flipbooks: process.env.NEXT_PUBLIC_ENABLE_FLIPBOOKS === 'true',

  /**
   * Add future features here following the same pattern:
   *
   * featureName: process.env.NEXT_PUBLIC_ENABLE_FEATURE_NAME === 'true',
   */
} as const;

/**
 * Type-safe feature flag checker
 *
 * @example
 * if (isFeatureEnabled('flipbooks')) {
 *   // Flipbooks code
 * }
 */
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  // eslint-disable-next-line security/detect-object-injection
  return features[feature]; // Type-safe: feature is constrained to keyof typeof features
}

/**
 * Get all enabled features
 *
 * Useful for debugging and admin dashboards
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * Feature flag React hook (optional utility)
 *
 * @example
 * const hasFlipbooks = useFeature('flipbooks');
 * if (!hasFlipbooks) return null;
 * return <FlipbooksNav />;
 */
export function useFeature(feature: keyof typeof features): boolean {
  // eslint-disable-next-line security/detect-object-injection
  return features[feature]; // Type-safe: feature is constrained to keyof typeof features
}

// Export feature names as constants for type safety
export const FEATURE_FLIPBOOKS = 'flipbooks' as const;
