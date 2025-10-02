"use client";

/**
 * Empty State Component
 *
 * Standardized empty state for lists and data tables
 * Provides consistent UX when no data is available
 *
 * @module EmptyState
 */

import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
 /**
 * Icon to display
 */
 icon: LucideIcon;

 /**
 * Primary heading
 * @example "No orders yet"
 */
 title: string;

 /**
 * Descriptive text explaining the empty state
 * @example "Orders will appear here once they're created"
 */
 description: string;

 /**
 * Optional action button
 */
 action?: {
 /**
 * Button label
 * @example "Create Order"
 */
 label: string;

 /**
 * Link href or onClick handler
 */
 href?: string;
 onClick?: () => void;
 };
}

export function EmptyState({
 icon: Icon,
 title,
 description,
 action,
}: EmptyStateProps) {
 return (
 <div className="flex flex-col items-center justify-center p-12 text-center">
 <div className="flex h-16 w-16 items-center justify-center rounded-full card mb-6">
 <Icon className="h-8 w-8 text-secondary" aria-hidden="true" />
 </div>

 <h3 className="text-xl font-semibold mb-2">
 {title}
 </h3>

 <p className="text-tertiary max-w-md mb-6">
 {description}
 </p>

 {action && (
 <>
 {action.href ? (
 <Link href={action.href}>
 <Button variant="default">
 {action.label}
 </Button>
 </Link>
 ) : (
 <Button variant="default" onClick={action.onClick}>
 {action.label}
 </Button>
 )}
 </>
 )}
 </div>
 );
}
