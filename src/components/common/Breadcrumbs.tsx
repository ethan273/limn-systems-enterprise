/**
 * Breadcrumbs Component
 *
 * Production-ready navigation breadcrumb trail for hierarchical page navigation.
 *
 * Features:
 * - Clickable breadcrumb links for navigation
 * - Current page indicator (non-clickable, visually distinct)
 * - Customizable separator icons between items
 * - Support for custom icons on breadcrumb items
 * - Responsive layout (smaller fonts on mobile)
 * - Automatic home/root link
 * - Full accessibility support (ARIA labels, keyboard navigation)
 *
 * Usage:
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Clients', href: '/crm/customers', icon: Users },
 *     { label: 'John Doe' }, // current page, no href
 *   ]}
 * />
 * ```
 */

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Represents a single breadcrumb item in the trail
 */
export interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string;
  /** URL to navigate to (undefined for current page) */
  href?: string;
  /** Optional icon to display alongside the label */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Props for the Breadcrumbs component
 */
export interface BreadcrumbsProps {
  /** Array of breadcrumb items to display */
  items: BreadcrumbItem[];
  /** Custom separator element (defaults to ChevronRight icon) */
  separator?: React.ReactNode;
  /** Whether to show the home icon at the start (defaults to true) */
  showHome?: boolean;
}

/**
 * Breadcrumbs Component
 *
 * Displays a hierarchical navigation breadcrumb trail using semantic CSS classes
 * from global CSS for consistent styling and easy maintenance.
 */
export function Breadcrumbs({
  items,
  separator,
  showHome = true,
}: BreadcrumbsProps): JSX.Element {
  // Default separator is ChevronRight icon
  const defaultSeparator = <ChevronRight className="breadcrumb-separator" />;
  const separatorElement = separator ?? defaultSeparator;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        {/* Home Link (optional) */}
        {showHome && (
          <>
            <li className="breadcrumb-item">
              <Link href="/" className="breadcrumb-link" aria-label="Home">
                <Home className="breadcrumb-home-icon" />
              </Link>
            </li>
            {items.length > 0 && (
              <li className="breadcrumb-item" aria-hidden="true">
                {separatorElement}
              </li>
            )}
          </>
        )}

        {/* Breadcrumb Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const IconComponent = item.icon;

          return (
            <React.Fragment key={`breadcrumb-${index}-${item.label}`}>
              <li className="breadcrumb-item">
                {/* Current Page (non-clickable) */}
                {isLast || !item.href ? (
                  <span className="breadcrumb-current" aria-current="page">
                    {IconComponent && <IconComponent className="breadcrumb-icon" />}
                    {item.label}
                  </span>
                ) : (
                  /* Clickable Link */
                  <Link href={item.href} className="breadcrumb-link">
                    {IconComponent && <IconComponent className="breadcrumb-icon" />}
                    {item.label}
                  </Link>
                )}
              </li>

              {/* Separator (not shown after last item) */}
              {!isLast && (
                <li className="breadcrumb-item" aria-hidden="true">
                  {separatorElement}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
