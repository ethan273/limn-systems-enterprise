'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Type definitions
export interface PageHeaderAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export interface PageHeaderBreadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: PageHeaderAction[];
  breadcrumbs?: PageHeaderBreadcrumb[];
}

export function PageHeader({
  title,
  subtitle,
  actions = [],
  breadcrumbs = [],
}: PageHeaderProps) {
  return (
    <div className="page-header">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 mb-4">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-sm text-foreground font-medium">
                  {crumb.label}
                </span>
              )}
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Header Content */}
      <div className="flex items-start justify-between gap-4">
        {/* Title and Subtitle */}
        <div className="flex-1">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant || 'default'}
                  className={
                    action.variant === 'default' || !action.variant
                      ? 'btn-primary'
                      : action.variant === 'secondary'
                      ? 'btn-secondary'
                      : action.variant === 'outline'
                      ? 'btn-outline'
                      : 'btn-destructive'
                  }
                >
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
