"use client";

/**
 * Breadcrumb Navigation Component
 *
 * Provides hierarchical navigation breadcrumbs for improved UX.
 *
 * Features:
 * - Automatic breadcrumb generation from route path
 * - Custom breadcrumb overrides
 * - Mobile responsive (collapsible on small screens)
 * - Semantic HTML with proper ARIA labels
 * - Touch-friendly (48px minimum touch targets)
 *
 * Usage:
 * ```tsx
 * <Breadcrumb />
 * // Auto-generates from current path
 *
 * <Breadcrumb items={[
 *   { label: 'Home', href: '/' },
 *   { label: 'Products', href: '/products' },
 *   { label: 'Widget XYZ' }
 * ]} />
 * ```
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  maxItems?: number; // Collapse to ... if more items
}

/**
 * Module name mappings for better labels
 */
const MODULE_NAMES: Record<string, string> = {
  // Main modules
  dashboard: 'Dashboard',
  crm: 'CRM',
  production: 'Production',
  shipping: 'Shipping',
  design: 'Design',
  marketing: 'Marketing',
  products: 'Products',
  finance: 'Finance',
  partners: 'Partners',
  tasks: 'Tasks',
  documents: 'Documents',
  admin: 'Admin',

  // CRM
  contacts: 'Contacts',
  customers: 'Customers',
  leads: 'Leads',
  orders: 'Orders',
  projects: 'Projects',
  activities: 'Activities',

  // Production
  'production-orders': 'Production Orders',
  'ordered-items': 'Ordered Items',
  'shop-drawings': 'Shop Drawings',
  qc: 'Quality Control',
  inspections: 'Inspections',

  // Products
  catalog: 'Catalog',
  materials: 'Materials',
  prototypes: 'Prototypes',
  collections: 'Collections',

  // Design
  briefs: 'Design Briefs',
  boards: 'Design Boards',
  concepts: 'Concepts',

  // Shipping
  shipments: 'Shipments',
  carriers: 'Carriers',
  tracking: 'Tracking',

  // Finance
  invoices: 'Invoices',
  payments: 'Payments',
  expenses: 'Expenses',

  // Partners
  designers: 'Designers',
  manufacturers: 'Manufacturers',
  sourcing: 'Sourcing Agents',

  // Marketing
  flipbooks: 'Flipbooks',
  analytics: 'Analytics',
  builder: 'Builder',
  library: 'Library',

  // Portal
  portal: 'Portal',
  customer: 'Customer Portal',
  designer: 'Designer Portal',
  factory: 'Factory Portal',

  // Admin
  users: 'Users',
  roles: 'Roles',
  permissions: 'Permissions',
  settings: 'Settings',
  'api-management': 'API Management',
  credentials: 'Credentials',
  'email-campaigns': 'Email Campaigns',
};

/**
 * Convert path segment to readable label
 */
function segmentToLabel(segment: string): string {
  // Check if we have a custom name for this segment
  if (MODULE_NAMES[segment]) {
    return MODULE_NAMES[segment];
  }

  // Remove hyphens and capitalize
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate breadcrumbs from current pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip UUID segments (they look like: 123e4567-e89b-12d3-a456-426614174000)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    if (isUUID) {
      // For UUIDs, use "Details" or "Edit" based on context
      breadcrumbs.push({
        label: i === segments.length - 1 ? 'Details' : 'Item',
        href: currentPath,
      });
      continue;
    }

    // For last segment, don't make it a link
    breadcrumbs.push({
      label: segmentToLabel(segment),
      href: i === segments.length - 1 ? undefined : currentPath,
    });
  }

  return breadcrumbs;
}

export function Breadcrumb({
  items,
  className,
  showHome = true,
  maxItems,
}: BreadcrumbProps) {
  const pathname = usePathname();

  // Use provided items or generate from pathname
  const breadcrumbItems = items || generateBreadcrumbs(pathname);

  // Add home if requested
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Home', href: '/dashboard', icon: <Home className="w-4 h-4" /> }, ...breadcrumbItems]
    : breadcrumbItems;

  // Handle maxItems collapse
  let displayItems = allItems;
  if (maxItems && allItems.length > maxItems) {
    // Keep first item, last item, and one before last
    displayItems = [
      allItems[0],
      { label: '...', href: undefined },
      ...allItems.slice(-2),
    ];
  }

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center text-sm text-muted-foreground',
        className
      )}
    >
      <ol className="flex items-center space-x-2">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === '...';

          return (
            <li key={index} className="flex items-center space-x-2">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" aria-hidden="true" />
              )}
              {isEllipsis ? (
                <span className="px-2 py-1">...</span>
              ) : item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5',
                    'px-2 py-1 rounded',
                    'min-h-[44px] min-w-[44px]', // Mobile touch target
                    'hover:text-foreground hover:bg-accent',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    'transition-colors'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1',
                    isLast && 'text-foreground font-medium'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Breadcrumb wrapper for page headers
 */
export function PageBreadcrumb({
  items,
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <div className={cn('mb-6', className)}>
      <Breadcrumb items={items} {...props} />
    </div>
  );
}
