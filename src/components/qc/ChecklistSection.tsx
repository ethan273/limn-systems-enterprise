'use client';

/**
 * Checklist Section Component
 * Displays a section with its checkpoints and handles result capture
 * QC PWA Enhancement - Phase 4
 */

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { CheckpointResult } from './CheckpointResult';
import { trackBatchPass } from '@/lib/analytics/qcMetrics';

export interface ChecklistSectionProps {
  section: any; // qc_section_results with nested qc_checkpoint_results
  inspectionId: string;
  onSectionComplete?: () => void; // Callback when section status changes
}

export function ChecklistSection({
  section,
  inspectionId,
  onSectionComplete,
}: ChecklistSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Batch pass section mutation
  const batchPassMutation = api.qcPwa.batchPassSection.useMutation({
    onSuccess: () => {
      onSectionComplete?.();
    },
    onError: (error) => {
      alert(`Failed to pass section: ${error.message}`);
    },
  });

  const checkpoints = section.qc_checkpoint_results || [];
  const completedCount = checkpoints.filter((cp: any) => cp.status !== 'pending').length;
  const passedCount = checkpoints.filter((cp: any) => cp.status === 'pass').length;
  const failedCount = checkpoints.filter((cp: any) => cp.status === 'fail').length;
  const naCount = checkpoints.filter((cp: any) => cp.status === 'na').length;

  const allComplete = completedCount === checkpoints.length;
  const allPassed = passedCount === checkpoints.length;

  /**
   * Handle "Pass All" button
   */
  const handlePassAll = async () => {
    const confirm = window.confirm(
      `Mark all checkpoints in "${section.section_name}" as passed?`
    );
    if (!confirm) return;

    try {
      await batchPassMutation.mutateAsync({
        inspection_id: inspectionId,
        section_id: section.id,
      });

      // Track batch pass analytics
      trackBatchPass({
        inspection_id: inspectionId,
        section_id: section.id,
        checkpoint_count: checkpoints.length,
      });
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  return (
    <div className="checklist-section">
      {/* Section Header */}
      <div className="checklist-section-header">
        <button
          className="checklist-section-header-button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={`section-${section.id}-content`}
        >
          <div className="checklist-section-header-left">
            <div className="checklist-section-expand-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`icon ${isExpanded ? 'expanded' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <div className="checklist-section-title">
              <h2>{section.section_name}</h2>
              {section.description && (
                <p className="checklist-section-description">{section.description}</p>
              )}
            </div>
          </div>

          <div className="checklist-section-header-right">
            <div className="checklist-section-stats">
              <span className="stat stat-complete">
                {completedCount}/{checkpoints.length}
              </span>
              {failedCount > 0 && <span className="stat stat-failed">{failedCount} failed</span>}
            </div>

            {allComplete && (
              <div
                className={`checklist-section-status ${section.status}`}
                aria-label={`Section status: ${section.status}`}
              >
                {section.status === 'pass' ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="icon"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="icon"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
            )}
          </div>
        </button>

        {/* Pass All Button */}
        {isExpanded && !allPassed && checkpoints.length > 0 && (
          <button
            className="btn btn-sm btn-secondary btn-pass-all"
            onClick={handlePassAll}
            disabled={batchPassMutation.isPending}
            aria-label="Pass all checkpoints in this section"
          >
            {batchPassMutation.isPending ? (
              <>
                <div className="spinner spinner-small" />
                <span>Passing All...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon-small"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Pass All</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Section Content (Checkpoints) */}
      {isExpanded && (
        <div
          id={`section-${section.id}-content`}
          className="checklist-section-content"
          role="region"
          aria-label={`${section.section_name} checkpoints`}
        >
          {checkpoints.length === 0 ? (
            <div className="empty-state empty-state-compact">
              <p>No checkpoints in this section.</p>
            </div>
          ) : (
            <div className="checkpoint-list">
              {checkpoints.map((checkpoint: any, index: number) => (
                <CheckpointResult
                  key={checkpoint.id}
                  checkpoint={checkpoint}
                  inspectionId={inspectionId}
                  checkpointNumber={index + 1}
                  onResultChange={onSectionComplete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
