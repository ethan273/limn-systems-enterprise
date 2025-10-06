/**
 * EmptyState Component - Usage Examples
 *
 * This file demonstrates how to use the EmptyState component
 * for different scenarios in the application.
 */

import { EmptyState } from './EmptyState';
import { FileX, Search, AlertTriangle, Clock, Plus, UserPlus, PackagePlus } from 'lucide-react';

/**
 * Example 1: No Data - Default Variant
 *
 * Use this when a list or table has no data yet.
 */
export function NoDataExample() {
  return (
    <EmptyState
      icon={FileX}
      title="No customers found"
      description="Get started by adding your first customer"
      action={{
        label: 'Add Customer',
        onClick: () => console.log('Add customer clicked'),
        icon: Plus,
        variant: 'default',
      }}
      variant="default"
    />
  );
}

/**
 * Example 2: No Search Results
 *
 * Use this when search/filter returns no results.
 */
export function NoSearchResultsExample() {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description="Try adjusting your search or filter criteria"
      variant="no-results"
    />
  );
}

/**
 * Example 3: Error State
 *
 * Use this when an error occurs loading data.
 */
export function ErrorStateExample() {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Failed to load data"
      description="An error occurred while loading the data. Please try again."
      action={{
        label: 'Retry',
        onClick: () => window.location.reload(),
        variant: 'outline',
      }}
      variant="error"
    />
  );
}

/**
 * Example 4: Coming Soon
 *
 * Use this for features not yet implemented.
 */
export function ComingSoonExample() {
  return (
    <EmptyState
      icon={Clock}
      title="Coming Soon"
      description="This feature is currently under development and will be available soon."
      variant="coming-soon"
    />
  );
}

/**
 * Example 5: With Icon Button
 *
 * Demonstrates adding an icon to the action button.
 */
export function WithIconButtonExample() {
  return (
    <EmptyState
      icon={FileX}
      title="No orders yet"
      description="Orders will appear here once they're created"
      action={{
        label: 'Create Order',
        onClick: () => console.log('Create order clicked'),
        icon: PackagePlus,
      }}
    />
  );
}

/**
 * Example 6: Secondary Button Variant
 *
 * Use secondary variant for less prominent actions.
 */
export function SecondaryButtonExample() {
  return (
    <EmptyState
      icon={FileX}
      title="No contacts in this company"
      description="Add contacts to keep track of key people"
      action={{
        label: 'Add Contact',
        onClick: () => console.log('Add contact clicked'),
        icon: UserPlus,
        variant: 'secondary',
      }}
    />
  );
}

/**
 * Example 7: Without Action Button
 *
 * Sometimes you just need to show a message without an action.
 */
export function WithoutActionExample() {
  return (
    <EmptyState
      icon={FileX}
      title="No archived items"
      description="Archived items will appear here"
    />
  );
}

/**
 * Example 8: Minimal (Title Only)
 *
 * Simplest form - just icon and title.
 */
export function MinimalExample() {
  return (
    <EmptyState
      icon={FileX}
      title="No data available"
    />
  );
}
