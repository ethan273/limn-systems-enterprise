'use client';

import React, { useState } from 'react';
import {
  LoadingState,
  LoadingSpinner,
  LoadingDots,
  LoadingBars,
  FullPageLoading,
} from './LoadingState';

/**
 * LoadingStateDemo Component
 *
 * Comprehensive demo showcasing all LoadingState variants, sizes, and features.
 * This component is for testing and documentation purposes.
 *
 * Features demonstrated:
 * - All three variants (spinner, dots, bars)
 * - All four sizes (sm, md, lg, full-page)
 * - With and without messages
 * - Full-page overlay mode
 * - Shorthand helper components
 */
export function LoadingStateDemo(): React.ReactElement {
  const [showFullPageLoading, setShowFullPageLoading] = useState(false);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">LoadingState Component Demo</h1>
        <p className="page-description">
          Production-ready loading indicators with multiple variants and sizes
        </p>
      </div>

      <div className="page-content">
        {/* Size Variants Section */}
        <section className="section">
          <h2 className="section-title">Size Variants - Spinner</h2>
          <div className="demo-grid">
            <div className="demo-card">
              <h3 className="demo-card-title">Small (sm)</h3>
              <LoadingState size="sm" variant="spinner" message="Small loading..." />
            </div>

            <div className="demo-card">
              <h3 className="demo-card-title">Medium (md) - Default</h3>
              <LoadingState size="md" variant="spinner" message="Medium loading..." />
            </div>

            <div className="demo-card">
              <h3 className="demo-card-title">Large (lg)</h3>
              <LoadingState size="lg" variant="spinner" message="Large loading..." />
            </div>
          </div>
        </section>

        {/* Variant Types Section */}
        <section className="section">
          <h2 className="section-title">Animation Variants - Medium Size</h2>
          <div className="demo-grid">
            <div className="demo-card">
              <h3 className="demo-card-title">Spinner</h3>
              <LoadingState size="md" variant="spinner" message="Loading data..." />
            </div>

            <div className="demo-card">
              <h3 className="demo-card-title">Dots</h3>
              <LoadingState size="md" variant="dots" message="Processing..." />
            </div>

            <div className="demo-card">
              <h3 className="demo-card-title">Bars</h3>
              <LoadingState size="md" variant="bars" message="Please wait..." />
            </div>
          </div>
        </section>

        {/* Without Messages Section */}
        <section className="section">
          <h2 className="section-title">Without Messages</h2>
          <div className="demo-grid">
            <div className="demo-card">
              <h3 className="demo-card-title">Spinner Only</h3>
              <LoadingState size="md" variant="spinner" />
            </div>

            <div className="demo-card">
              <h3 className="demo-card-title">Dots Only</h3>
              <LoadingState size="md" variant="dots" />
            </div>

            <div className="demo-card">
              <h3 className="demo-card-title">Bars Only</h3>
              <LoadingState size="md" variant="bars" />
            </div>
          </div>
        </section>

        {/* Shorthand Helpers Section */}
        <section className="section">
          <h2 className="section-title">Shorthand Helper Components</h2>
          <div className="demo-grid">
            <div className="demo-card">
              <h3 className="demo-card-title">LoadingSpinner</h3>
              <LoadingSpinner size="md" message="Using LoadingSpinner helper" />
            </div>

            <div className="demo-card">
              <h3 className="demo-card-title">LoadingDots</h3>
              <LoadingDots size="md" message="Using LoadingDots helper" />
            </div>

            <div className="demo-card">
              <h3 className="demo-card-title">LoadingBars</h3>
              <LoadingBars size="md" message="Using LoadingBars helper" />
            </div>
          </div>
        </section>

        {/* Full-Page Overlay Section */}
        <section className="section">
          <h2 className="section-title">Full-Page Overlay</h2>
          <div className="demo-card">
            <p className="demo-card-description">
              Click the button below to see a full-page loading overlay with backdrop blur
            </p>
            <button className="btn-primary" onClick={() => setShowFullPageLoading(true)}>
              Show Full-Page Loading
            </button>

            <div className="code-block">
              <code>{`<FullPageLoading message="Loading application..." variant="spinner" />`}</code>
            </div>
          </div>
        </section>

        {/* Usage Examples Section */}
        <section className="section">
          <h2 className="section-title">Usage Examples</h2>

          <div className="demo-card">
            <h3 className="demo-card-title">Basic Usage</h3>
            <div className="code-block">
              <pre>{`import { LoadingState } from '@/components/common/LoadingState';

// Simple loading
<LoadingState message="Loading data..." size="md" />

// Loading with dots
<LoadingState message="Processing..." size="md" variant="dots" />

// Loading with bars
<LoadingState message="Please wait..." size="lg" variant="bars" />`}</pre>
            </div>
          </div>

          <div className="demo-card">
            <h3 className="demo-card-title">Full-Page Overlay</h3>
            <div className="code-block">
              <pre>{`import { FullPageLoading } from '@/components/common/LoadingState';

// Full-page loading with overlay
<FullPageLoading message="Loading application..." variant="spinner" />`}</pre>
            </div>
          </div>

          <div className="demo-card">
            <h3 className="demo-card-title">Shorthand Helpers</h3>
            <div className="code-block">
              <pre>{`import {
  LoadingSpinner,
  LoadingDots,
  LoadingBars
} from '@/components/common/LoadingState';

<LoadingSpinner size="sm" message="Loading..." />
<LoadingDots size="md" />
<LoadingBars size="lg" message="Processing..." />`}</pre>
            </div>
          </div>
        </section>
      </div>

      {/* Full-Page Loading Overlay (shown when button is clicked) */}
      {showFullPageLoading && (
        <FullPageLoading message="This is a full-page loading overlay..." variant="spinner" />
      )}

      {/* Auto-hide the overlay after 3 seconds */}
      {showFullPageLoading &&
        setTimeout(() => {
          setShowFullPageLoading(false);
        }, 3000) &&
        null}
    </div>
  );
}

export default LoadingStateDemo;
