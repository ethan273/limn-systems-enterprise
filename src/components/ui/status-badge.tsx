"use client";

/**
 * Status Badge Component
 *
 * Standardized status badge with consistent colors, icons, and spacing across the application
 * Ensures proper color mapping, accessibility, and icon consistency
 *
 * CRITICAL: All status badges MUST have icons for visual consistency
 *
 * @module StatusBadge
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  TruckIcon,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Package,
  PackageCheck,
  Loader2,
  Info,
  CheckCircle,
  FileText,
} from 'lucide-react';

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
 | 'in_transit'
 | 'delivered'
 | 'delayed'
 | 'preparing'
 | 'ready'
 | 'on_hold'
 | 'processing'
 | 'production';

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
 * Show icon (default: true)
 */
 showIcon?: boolean;

 /**
 * Additional CSS classes
 */
 className?: string;
}

const STATUS_CONFIG: Record<string, {
  variant: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
 // General statuses
 pending: {
 variant: 'outline',
 className: 'bg-warning text-warning border-warning',
 icon: Clock,
 },
 in_progress: {
 variant: 'outline',
 className: 'bg-info text-info border-info',
 icon: Loader2,
 },
 completed: {
 variant: 'outline',
 className: 'bg-success text-success border-success',
 icon: CheckCircle2,
 },
 cancelled: {
 variant: 'outline',
 className: 'bg-destructive text-destructive border-destructive',
 icon: XCircle,
 },
 error: {
 variant: 'outline',
 className: 'bg-destructive text-destructive border-destructive',
 icon: AlertCircle,
 },

 // Semantic statuses
 success: {
 variant: 'outline',
 className: 'bg-success text-success border-success',
 icon: CheckCircle,
 },
 warning: {
 variant: 'outline',
 className: 'bg-warning text-warning border-warning',
 icon: AlertTriangle,
 },
 info: {
 variant: 'outline',
 className: 'bg-info text-info border-info',
 icon: Info,
 },

 // Approval workflow
 draft: {
 variant: 'outline',
 className: 'bg-muted text-muted border-muted',
 icon: FileText,
 },
 approved: {
 variant: 'outline',
 className: 'bg-success text-success border-success',
 icon: CheckCircle2,
 },
 rejected: {
 variant: 'outline',
 className: 'bg-destructive text-destructive border-destructive',
 icon: XCircle,
 },

 // Shipping statuses
 preparing: {
 variant: 'outline',
 className: 'bg-info text-info border-info',
 icon: Package,
 },
 ready: {
 variant: 'outline',
 className: 'bg-success text-success border-success',
 icon: PackageCheck,
 },
 shipped: {
 variant: 'outline',
 className: 'bg-info text-info border-info',
 icon: TruckIcon,
 },
 in_transit: {
 variant: 'outline',
 className: 'bg-info text-info border-info',
 icon: TruckIcon,
 },
 delivered: {
 variant: 'outline',
 className: 'bg-success text-success border-success',
 icon: CheckCircle2,
 },
 delayed: {
 variant: 'outline',
 className: 'bg-warning text-warning border-warning',
 icon: AlertCircle,
 },
 on_hold: {
 variant: 'outline',
 className: 'bg-warning text-warning border-warning',
 icon: AlertCircle,
 },
 processing: {
 variant: 'outline',
 className: 'bg-info text-info border-info',
 icon: Loader2,
 },
 production: {
 variant: 'outline',
 className: 'bg-primary text-primary border-primary',
 icon: Package,
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

export function StatusBadge({ status, label, showIcon = true, className }: StatusBadgeProps) {
 const normalizedStatus = status.toLowerCase();
 // eslint-disable-next-line security/detect-object-injection
 const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.info;
 const displayLabel = label || formatStatus(status);
 const Icon = config.icon;

 return (
 <Badge
 variant={config.variant as any}
 className={cn('badge-with-icon', config.className, className)}
 >
 {showIcon && <Icon className="badge-icon" aria-hidden="true" />}
 {displayLabel}
 </Badge>
 );
}

// Specialized Badge Components for common use cases
export function ShippingStatusBadge({
  status,
  showIcon = true,
  className
}: {
  status: string;
  showIcon?: boolean;
  className?: string;
}) {
  return <StatusBadge status={status} showIcon={showIcon} className={className} />;
}

export function OrderStatusBadge({
  status,
  showIcon = true,
  className
}: {
  status: string;
  showIcon?: boolean;
  className?: string;
}) {
  return <StatusBadge status={status} showIcon={showIcon} className={className} />;
}
