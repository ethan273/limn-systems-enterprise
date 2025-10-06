'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Type definitions
export interface EntityMetadataItem {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label?: string;
  type?: 'text' | 'email' | 'phone' | 'link';
  href?: string;
}

export type EntityMetadata = EntityMetadataItem;

export interface EntityDetailHeaderAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export interface EntityDetailHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  status?: string;
  statusType?: 'active' | 'inactive' | 'pending' | 'cancelled' | 'completed';
  metadata?: EntityMetadataItem[];
  tags?: string[];
  actions?: EntityDetailHeaderAction[];
}

// Helper function to get status badge class
function getStatusBadgeClass(statusType?: string): string {
  switch (statusType) {
    case 'active':
      return 'badge-success';
    case 'inactive':
      return 'badge-neutral';
    case 'pending':
      return 'badge-warning';
    case 'cancelled':
      return 'badge-error';
    case 'completed':
      return 'badge-success';
    default:
      return 'badge-default';
  }
}

export function EntityDetailHeader({
  icon: Icon,
  title,
  subtitle,
  status,
  statusType,
  metadata = [],
  tags = [],
  actions = [],
}: EntityDetailHeaderProps) {
  // Helper function to render metadata item based on type
  const renderMetadataItem = (item: EntityMetadataItem) => {
    const ItemIcon = item.icon;

    const content = (
      <>
        <ItemIcon className="h-4 w-4" />
        <span>{item.value}</span>
      </>
    );

    switch (item.type) {
      case 'email':
        return (
          <a
            href={item.href || `mailto:${item.value}`}
            className="detail-contact-link"
          >
            {content}
          </a>
        );
      case 'phone':
        return (
          <a
            href={item.href || `tel:${item.value}`}
            className="detail-contact-link"
          >
            {content}
          </a>
        );
      case 'link':
        return (
          <a
            href={item.href || item.value}
            className="detail-contact-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      default:
        return (
          <div className="detail-meta-item">
            {content}
          </div>
        );
    }
  };

  return (
    <div className="detail-header-card">
      <div className="detail-header">
        {/* Avatar/Icon */}
        <div className="detail-avatar">
          <Icon className="detail-avatar-icon" />
        </div>

        {/* Main Info */}
        <div className="detail-info">
          {/* Title */}
          <h1 className="detail-title">{title}</h1>

          {/* Meta Row (Subtitle, Status, etc.) */}
          <div className="detail-meta">
            {subtitle && (
              <span className="detail-meta-item">
                {subtitle}
              </span>
            )}
            {status && (
              <span className={`badge ${getStatusBadgeClass(statusType)}`}>
                {status}
              </span>
            )}
          </div>

          {/* Contact Info / Metadata */}
          {metadata.length > 0 && (
            <div className="detail-contact-info">
              {metadata.map((item, index) => (
                <div key={index}>
                  {renderMetadataItem(item)}
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="tag-list">
              {tags.map((tag, index) => (
                <span key={index} className="badge badge-secondary">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="detail-actions">
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
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
                  {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
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
