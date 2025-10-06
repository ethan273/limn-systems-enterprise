'use client';

import React from 'react';

/**
 * LoadingState Component Props
 *
 * @property message - Optional loading message to display
 * @property size - Loading indicator size (sm, md, lg, full-page)
 * @property variant - Loading animation variant (spinner, dots, bars)
 * @property overlay - Show full-page overlay with backdrop
 */
interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'full-page';
  variant?: 'spinner' | 'dots' | 'bars';
  overlay?: boolean;
}

/**
 * LoadingState Component
 *
 * Production-ready loading indicator with multiple variants and sizes.
 * Uses semantic CSS classes from globals.css for consistent styling.
 *
 * Features:
 * - Three animation variants: spinner, dots, bars
 * - Four size options: sm, md, lg, full-page
 * - Optional overlay for full-page loading states
 * - Customizable loading message
 * - Fully accessible with ARIA attributes
 *
 * @example
 * // Simple loading
 * <LoadingState message="Loading data..." size="md" />
 *
 * @example
 * // Full-page loading with overlay
 * <LoadingState
 *   message="Please wait..."
 *   size="full-page"
 *   overlay={true}
 * />
 *
 * @example
 * // Small inline loading with dots
 * <LoadingState size="sm" variant="dots" />
 */
export function LoadingState({
  message,
  size = 'md',
  variant = 'spinner',
  overlay = false,
}: LoadingStateProps): React.ReactElement {
  // Build container class names
  const containerClasses = [
    'loading-state-container',
    `loading-state-${size}`,
  ].join(' ');

  // Build message class names
  const messageClasses = [
    'loading-message',
    size === 'sm' ? 'loading-message-sm' : '',
    size === 'lg' || size === 'full-page' ? 'loading-message-lg' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Render the appropriate loading variant
  const renderLoadingVariant = (): React.ReactElement => {
    switch (variant) {
      case 'dots':
        return (
          <div
            className={`loading-dots-wrapper loading-dots-${size}`}
            role="status"
            aria-label="Loading"
          >
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
        );

      case 'bars':
        return (
          <div
            className={`loading-bars-wrapper loading-bars-${size}`}
            role="status"
            aria-label="Loading"
          >
            <div className="loading-bar" />
            <div className="loading-bar" />
            <div className="loading-bar" />
            <div className="loading-bar" />
            <div className="loading-bar" />
          </div>
        );

      case 'spinner':
      default:
        return (
          <div className="loading-spinner-wrapper" role="status" aria-label="Loading">
            <div className={`loading-spinner-element loading-spinner-${size}`} />
          </div>
        );
    }
  };

  // Build the loading content
  const loadingContent = (
    <div className={containerClasses}>
      {renderLoadingVariant()}
      {message && (
        <p className={messageClasses} aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );

  // Render with overlay if requested
  if (overlay) {
    return (
      <div className="loading-overlay" role="dialog" aria-modal="true" aria-label="Loading">
        {loadingContent}
      </div>
    );
  }

  // Render without overlay
  return loadingContent;
}

/**
 * LoadingSpinner - Shorthand for spinner variant
 */
export function LoadingSpinner({
  message,
  size = 'md',
}: Omit<LoadingStateProps, 'variant' | 'overlay'>): React.ReactElement {
  return <LoadingState message={message} size={size} variant="spinner" />;
}

/**
 * LoadingDots - Shorthand for dots variant
 */
export function LoadingDots({
  message,
  size = 'md',
}: Omit<LoadingStateProps, 'variant' | 'overlay'>): React.ReactElement {
  return <LoadingState message={message} size={size} variant="dots" />;
}

/**
 * LoadingBars - Shorthand for bars variant
 */
export function LoadingBars({
  message,
  size = 'md',
}: Omit<LoadingStateProps, 'variant' | 'overlay'>): React.ReactElement {
  return <LoadingState message={message} size={size} variant="bars" />;
}

/**
 * FullPageLoading - Shorthand for full-page loading with overlay
 */
export function FullPageLoading({
  message = 'Loading...',
  variant = 'spinner',
}: Omit<LoadingStateProps, 'size' | 'overlay'>): React.ReactElement {
  return (
    <LoadingState message={message} size="full-page" variant={variant} overlay={true} />
  );
}

export default LoadingState;
