import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'compact';
  className?: string;
}

interface PriorityBadgeProps {
  priority: string;
  variant?: 'default' | 'compact';
  className?: string;
}

interface DepartmentBadgeProps {
  department: string;
  variant?: 'default' | 'compact';
  className?: string;
}

// Type for badge variants
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'primary';

// Status value to badge variant mapping (using Map to avoid security warnings)
const STATUS_VARIANTS = new Map<string, BadgeVariant>([
  ['active', 'success'],
  ['inactive', 'secondary'],
  ['pending', 'warning'],
  ['completed', 'success'],
  ['cancelled', 'destructive'],
  ['delivered', 'success'],
  ['shipped', 'primary'],
  ['processing', 'default'],
  ['in-progress', 'info'],
  ['in progress', 'info'],
  ['todo', 'warning'],
  ['done', 'success'],
  ['draft', 'secondary'],
  ['published', 'success'],
  ['archived', 'secondary'],
  ['approved', 'success'],
  ['rejected', 'destructive'],
  ['review', 'warning'],
  ['on-hold', 'warning'],
  ['on hold', 'warning'],
  ['passed', 'success'],
  ['failed', 'destructive'],
]);

// Priority value to badge variant mapping (using Map to avoid security warnings)
const PRIORITY_VARIANTS = new Map<string, BadgeVariant>([
  ['low', 'default'],
  ['medium', 'warning'],
  ['high', 'destructive'],
  ['urgent', 'destructive'],
  ['critical', 'destructive'],
  ['normal', 'default'],
]);

// Department value to badge variant mapping (using Map to avoid security warnings)
const DEPARTMENT_VARIANTS = new Map<string, BadgeVariant>([
  ['sales', 'primary'],
  ['production', 'success'],
  ['design', 'default'],
  ['admin', 'secondary'],
  ['finance', 'default'],
  ['shipping', 'default'],
  ['quality', 'warning'],
  ['operations', 'info'],
  ['marketing', 'primary'],
  ['support', 'info'],
  ['hr', 'secondary'],
  ['human resources', 'secondary'],
  ['it', 'default'],
  ['information technology', 'default'],
  ['warehouse', 'default'],
  ['logistics', 'default'],
]);

/**
 * Normalize input value to lowercase and handle common variations
 */
const normalizeValue = (value: string): string => {
  return value.toLowerCase().trim().replace(/_/g, '-');
};

/**
 * Safely get variant from status mapping
 */
const getStatusVariant = (status: string): BadgeVariant => {
  const normalized = normalizeValue(status);
  return STATUS_VARIANTS.get(normalized) || 'default';
};

/**
 * Safely get variant from priority mapping
 */
const getPriorityVariant = (priority: string): BadgeVariant => {
  const normalized = normalizeValue(priority);
  return PRIORITY_VARIANTS.get(normalized) || 'default';
};

/**
 * Safely get variant from department mapping
 */
const getDepartmentVariant = (department: string): BadgeVariant => {
  const normalized = normalizeValue(department);
  return DEPARTMENT_VARIANTS.get(normalized) || 'default';
};

/**
 * StatusBadge Component
 *
 * Displays a status badge with consistent styling based on status value.
 * Uses global CSS classes for theming and semantic class names.
 *
 * @example
 * <StatusBadge status="active" />
 * <StatusBadge status="pending" variant="compact" />
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'default',
  className
}) => {
  const normalizedStatus = normalizeValue(status);
  const badgeVariant = getStatusVariant(status);

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        'status-badge',
        `status-${normalizedStatus}`,
        {
          'badge-compact': variant === 'compact',
        },
        className
      )}
    >
      {status}
    </Badge>
  );
};

StatusBadge.displayName = 'StatusBadge';

/**
 * PriorityBadge Component
 *
 * Displays a priority badge with consistent styling based on priority value.
 * Uses global CSS classes for theming and semantic class names.
 *
 * @example
 * <PriorityBadge priority="high" />
 * <PriorityBadge priority="low" variant="compact" />
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  variant = 'default',
  className
}) => {
  const normalizedPriority = normalizeValue(priority);
  const badgeVariant = getPriorityVariant(priority);

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        'priority-badge',
        `priority-${normalizedPriority}`,
        {
          'badge-compact': variant === 'compact',
        },
        className
      )}
    >
      {priority}
    </Badge>
  );
};

PriorityBadge.displayName = 'PriorityBadge';

/**
 * DepartmentBadge Component
 *
 * Displays a department badge with consistent styling based on department value.
 * Uses global CSS classes for theming and semantic class names.
 *
 * @example
 * <DepartmentBadge department="sales" />
 * <DepartmentBadge department="production" variant="compact" />
 */
export const DepartmentBadge: React.FC<DepartmentBadgeProps> = ({
  department,
  variant = 'default',
  className
}) => {
  const normalizedDepartment = normalizeValue(department);
  const badgeVariant = getDepartmentVariant(department);

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        'department-badge',
        `department-${normalizedDepartment}`,
        {
          'badge-compact': variant === 'compact',
        },
        className
      )}
    >
      {department}
    </Badge>
  );
};

DepartmentBadge.displayName = 'DepartmentBadge';
