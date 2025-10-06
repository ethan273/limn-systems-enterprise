"use client";

/**
 * EmptyState Component - Production-Ready
 *
 * A consistent, reusable empty state component for displaying:
 * - No data states
 * - Search results with no matches
 * - Error states
 * - Coming soon features
 *
 * CRITICAL REQUIREMENTS:
 * - Uses ONLY global CSS classes (no inline Tailwind)
 * - Fully type-safe with TypeScript
 * - Zero ESLint errors/warnings
 * - Semantic class names from /src/app/globals.css
 *
 * @module EmptyState
 */

import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Empty State Component Props
 */
export interface EmptyStateProps {
  /**
   * Icon component to display (from lucide-react)
   * @example FileX, Search, AlertTriangle, Clock
   */
  icon: LucideIcon;

  /**
   * Primary heading text
   * @example "No customers found"
   */
  title: string;

  /**
   * Optional description text or React element
   * @example "Get started by adding your first customer"
   */
  description?: string | React.ReactNode;

  /**
   * Optional action button configuration
   */
  action?: {
    /**
     * Button label text
     * @example "Add Customer"
     */
    label: string;

    /**
     * Button click handler
     */
    onClick: () => void;

    /**
     * Optional icon for the button
     */
    icon?: LucideIcon;

    /**
     * Button variant
     * @default "default"
     */
    variant?: 'default' | 'secondary' | 'outline';
  };

  /**
   * Visual variant for different states
   * @default "default"
   */
  variant?: 'default' | 'no-results' | 'error' | 'coming-soon';
}

/**
 * EmptyState Component
 *
 * Displays a centered empty state with icon, title, description, and optional action button.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={FileX}
 *   title="No customers found"
 *   description="Get started by adding your first customer"
 *   action={{
 *     label: 'Add Customer',
 *     onClick: () => setIsDialogOpen(true),
 *     icon: Plus,
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  // Build variant class name
  const variantClassName = `empty-state empty-state-${variant}`;

  return (
    <div className={variantClassName}>
      {/* Icon */}
      <Icon className="empty-state-icon" aria-hidden="true" />

      {/* Title */}
      <h3 className="empty-state-text">{title}</h3>

      {/* Description (optional) */}
      {description && (
        <p className="empty-state-subtext">{description}</p>
      )}

      {/* Action Button (optional) */}
      {action && (
        <div className="empty-state-action">
          <Button
            variant={action.variant || 'default'}
            onClick={action.onClick}
          >
            {action.icon && <action.icon aria-hidden="true" />}
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
