import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * InfoCard Item Type Definitions
 */
export interface InfoCardItem {
  label: string;
  value: string | number | React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  type?: 'text' | 'email' | 'phone' | 'link' | 'badge';
  href?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'destructive';
}

/**
 * InfoCard Action Type Definitions
 */
export interface InfoCardAction {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

/**
 * InfoCard Component Props
 */
export interface InfoCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: InfoCardItem[];
  actions?: InfoCardAction[];
  footer?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  className?: string;
}

/**
 * InfoCard Component
 *
 * A standardized card component for displaying information with key-value pairs.
 * Supports multiple item types, actions, and customization options.
 *
 * @example
 * ```tsx
 * <InfoCard
 *   title="Client Information"
 *   subtitle="Contact details and status"
 *   icon={User}
 *   items={[
 *     { label: 'Name', value: 'John Doe' },
 *     { label: 'Email', value: 'john@example.com', type: 'email' },
 *     { label: 'Phone', value: '555-0100', type: 'phone' },
 *     { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success' },
 *   ]}
 *   actions={[
 *     { label: 'Edit', onClick: handleEdit, icon: Edit },
 *     { label: 'Delete', onClick: handleDelete, variant: 'destructive' },
 *   ]}
 * />
 * ```
 */
export const InfoCard = React.forwardRef<HTMLDivElement, InfoCardProps>(
  (
    {
      title,
      subtitle,
      icon: Icon,
      items,
      actions,
      footer,
      variant = 'default',
      className,
    },
    ref
  ) => {
    /**
     * Renders the appropriate value based on item type
     */
    const renderValue = (item: InfoCardItem): React.ReactNode => {
      const { value, type, href, badgeVariant, icon: ItemIcon } = item;

      // Badge type
      if (type === 'badge' && typeof value === 'string') {
        const mappedVariant = badgeVariant === 'success' ? 'default' :
                             badgeVariant === 'warning' ? 'secondary' :
                             badgeVariant;
        return <Badge variant={mappedVariant}>{value}</Badge>;
      }

      // Email type
      if (type === 'email' && typeof value === 'string') {
        return (
          <a href={`mailto:${value}`} className="info-card-link">
            {value}
          </a>
        );
      }

      // Phone type
      if (type === 'phone' && typeof value === 'string') {
        return (
          <a href={`tel:${value}`} className="info-card-link">
            {value}
          </a>
        );
      }

      // Link type
      if (type === 'link' && typeof value === 'string' && href) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="info-card-link"
          >
            {value}
          </a>
        );
      }

      // Icon with value
      if (ItemIcon) {
        return (
          <span className="info-card-value-with-icon">
            <ItemIcon className="info-card-value-icon" />
            {value}
          </span>
        );
      }

      // Default text
      return value;
    };

    return (
      <Card
        ref={ref}
        className={cn('info-card', `info-card-${variant}`, className)}
      >
        <CardHeader className="info-card-header">
          <div className="info-card-header-content">
            {Icon && <Icon className="info-card-icon" />}
            <div className="info-card-header-text">
              <CardTitle className="info-card-title">{title}</CardTitle>
              {subtitle && <p className="info-card-subtitle">{subtitle}</p>}
            </div>
          </div>
        </CardHeader>

        <CardContent className="info-card-content">
          <div className="info-card-items">
            {items.map((item, index) => (
              <div key={`${item.label}-${index}`} className="info-card-item">
                <dt className="info-card-label">{item.label}</dt>
                <dd className="info-card-value">{renderValue(item)}</dd>
              </div>
            ))}
          </div>
        </CardContent>

        {(actions || footer) && (
          <CardFooter className="info-card-footer">
            {actions && actions.length > 0 && (
              <div className="info-card-actions">
                {actions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={`${action.label}-${index}`}
                      onClick={action.onClick}
                      variant={action.variant || 'default'}
                      size="sm"
                    >
                      {ActionIcon && <ActionIcon />}
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            )}
            {footer && <div className="info-card-footer-content">{footer}</div>}
          </CardFooter>
        )}
      </Card>
    );
  }
);

InfoCard.displayName = 'InfoCard';
