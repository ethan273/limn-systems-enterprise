/**
 * Breadcrumbs Component - Usage Examples
 *
 * This file demonstrates various usage patterns for the Breadcrumbs component.
 * Import this pattern in your pages to implement breadcrumb navigation.
 */

import { Breadcrumbs } from '@/components/common';
import { Users, User, Building2, Package, Settings, FileText } from 'lucide-react';

/**
 * Example 1: Basic breadcrumbs without home link
 */
export function BasicBreadcrumbsExample() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings' }, // current page
      ]}
      showHome={false}
    />
  );
}

/**
 * Example 2: Breadcrumbs with home link (default)
 */
export function WithHomeBreadcrumbsExample() {
  return (
    <Breadcrumbs
      items={[
        { label: 'CRM', href: '/crm' },
        { label: 'Customers', href: '/crm/customers' },
        { label: 'John Doe' }, // current page
      ]}
    />
  );
}

/**
 * Example 3: Breadcrumbs with custom icons
 */
export function WithIconsBreadcrumbsExample() {
  return (
    <Breadcrumbs
      items={[
        { label: 'CRM', href: '/crm', icon: Building2 },
        { label: 'Customers', href: '/crm/customers', icon: Users },
        { label: 'John Doe', icon: User }, // current page
      ]}
    />
  );
}

/**
 * Example 4: Deep nested breadcrumbs
 */
export function DeepNestedBreadcrumbsExample() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Production', href: '/production', icon: Package },
        { label: 'Orders', href: '/production/orders' },
        { label: 'Order #12345', href: '/production/orders/12345' },
        { label: 'Details' }, // current page
      ]}
    />
  );
}

/**
 * Example 5: Custom separator
 */
export function CustomSeparatorBreadcrumbsExample() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Settings', href: '/settings', icon: Settings },
        { label: 'Account', href: '/settings/account' },
        { label: 'Profile' }, // current page
      ]}
      separator={<span style={{ margin: '0 0.5rem' }}>/</span>}
    />
  );
}

/**
 * Example 6: Single item breadcrumb
 */
export function SingleItemBreadcrumbsExample() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Current Page', icon: FileText }, // only item, treated as current
      ]}
    />
  );
}

/**
 * Example 7: Real-world CRM usage
 */
export function CRMCustomerDetailBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'CRM', href: '/crm' },
        { label: 'Customers', href: '/crm/customers', icon: Users },
        { label: 'Acme Corporation' }, // current customer detail page
      ]}
    />
  );
}

/**
 * Example 8: Real-world Production usage
 */
export function ProductionOrderDetailBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Production', href: '/production' },
        { label: 'Orders', href: '/production/orders', icon: Package },
        { label: 'Order #SO-2024-001' }, // current order detail page
      ]}
    />
  );
}

/**
 * Example 9: Conditional breadcrumbs based on data
 */
export function ConditionalBreadcrumbsExample({ customerId, customerName }: { customerId: string; customerName: string }) {
  return (
    <Breadcrumbs
      items={[
        { label: 'CRM', href: '/crm' },
        { label: 'Customers', href: '/crm/customers', icon: Users },
        { label: customerName, href: `/crm/customers/${customerId}` },
        { label: 'Edit' }, // current page
      ]}
    />
  );
}

/**
 * Example 10: Module homepage breadcrumb (no home link)
 */
export function ModuleHomeBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'CRM Dashboard', icon: Building2 }, // module home, no parent
      ]}
      showHome={false}
    />
  );
}
