"use client";

/**
 * Status Badge Component
 *
 * Standardized status badge with consistent colors across the application
 * Ensures proper color mapping and accessibility
 *
 * @module StatusBadge
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type StatusType =
 | 'pending'
 | 'in_progress'
 | 'completed'
 | 'cancelled'
 | 'error'
 | 'success'
 | 'warning'
 | 'info'
 | 'draft'
 | 'approved'
 | 'rejected'
 | 'shipped'
 | 'delivered';

interface StatusBadgeProps {
 /**
 * Status type
 */
 status: StatusType | string;

 /**
 * Optional custom label (defaults to status with proper formatting)
 */
 label?: string;

 /**
 * Additional CSS classes
 */
 className?: string;
}

const STATUS_CONFIG: Record<string, { variant: string; className: string }> = {
 // General statuses
 pending: {
 variant: 'outline',
 className: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
 },
 in_progress: {
 variant: 'outline',
 className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
 },
 completed: {
 variant: 'outline',
 className: 'bg-green-500/20 text-green-300 border-green-500/30',
 },
 cancelled: {
 variant: 'outline',
 className: 'card text-tertiary border/30',
 },
 error: {
 variant: 'outline',
 className: 'bg-red-500/20 text-red-300 border-red-500/30',
 },

 // Semantic statuses
 success: {
 variant: 'outline',
 className: 'bg-green-500/20 text-green-300 border-green-500/30',
 },
 warning: {
 variant: 'outline',
 className: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
 },
 info: {
 variant: 'outline',
 className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
 },

 // Approval workflow
 draft: {
 variant: 'outline',
 className: 'card text-tertiary border/30',
 },
 approved: {
 variant: 'outline',
 className: 'bg-green-500/20 text-green-300 border-green-500/30',
 },
 rejected: {
 variant: 'outline',
 className: 'bg-red-500/20 text-red-300 border-red-500/30',
 },

 // Shipping statuses
 shipped: {
 variant: 'outline',
 className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
 },
 delivered: {
 variant: 'outline',
 className: 'bg-green-500/20 text-green-300 border-green-500/30',
 },
};

/**
 * Format status string for display
 * @example "in_progress" -> "In Progress"
 */
function formatStatus(status: string): string {
 return status
 .split('_')
 .map(word => word.charAt(0).toUpperCase() + word.slice(1))
 .join(' ');
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
 const normalizedStatus = status.toLowerCase();
 // eslint-disable-next-line security/detect-object-injection
 const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.info;
 const displayLabel = label || formatStatus(status);

 return (
 <Badge
 variant={config.variant as any}
 className={cn(config.className, className)}
 >
 {displayLabel}
 </Badge>
 );
}
