/**
 * API Management Module - Core Utilities
 *
 * Central export for all API management functionality including:
 * - Service templates (Phase 1)
 * - Security features (Phase 2)
 * - Operational features (Phase 3)
 * - Helper functions
 * - Type definitions
 *
 * @module api-management
 */

// Service Templates (Phase 1)
export * from './service-templates';

// Security Features (Phase 2)
export * from './audit-logger';
export * from './access-control';
export * from './rate-limiter';
export * from './emergency-access';

// Operational Features (Phase 3)
export * from './health-monitor';
export * from './credential-rotation';
export * from './background-jobs';
export * from './notifications';
