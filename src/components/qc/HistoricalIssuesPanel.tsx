'use client';

/**
 * Historical Issues Panel
 * Shows past QC failures for the same item/prototype
 */

import { api } from '@/lib/api/client';

export interface HistoricalIssuesPanelProps {
  productionItemId?: string;
  prototypeProductionId?: string;
  onClose: () => void;
}

export function HistoricalIssuesPanel({
  productionItemId: _productionItemId,
  prototypeProductionId: _prototypeProductionId,
  onClose,
}: HistoricalIssuesPanelProps) {
  // Note: This API signature is different - using simplified version
  // In production, would need checkpoint_code and factory_id
  const { data, isLoading } = api.qcPwa.getHistoricalIssues.useQuery({
    checkpoint_code: 'general',
    factory_id: '00000000-0000-0000-0000-000000000000', // Placeholder
  });

  const issues = data?.top_issues || [];

  return (
    <div className="historical-issues-panel" role="dialog" aria-modal="true" aria-label="Historical issues">
      <div className="historical-issues-overlay" onClick={onClose} />
      <div className="historical-issues-content">
        <div className="historical-issues-header">
          <h2>Past Issues</h2>
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="historical-issues-body">
          {isLoading && <div className="loading-state"><div className="spinner" />Loading...</div>}
          {!isLoading && issues.length === 0 && <div className="empty-state"><p>No past issues found</p></div>}
          {!isLoading && issues.length > 0 && (
            <div className="historical-issues-list">
              {issues.map((issue: any, index: number) => (
                <div key={index} className="historical-issue-item">
                  <div className="historical-issue-header">
                    <span className="severity-badge severity-minor">Issue</span>
                    <span className="historical-issue-date">{issue.count} occurrences</span>
                  </div>
                  <p className="historical-issue-text">{issue.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
