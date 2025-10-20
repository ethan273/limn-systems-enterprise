'use client';

/**
 * Progress Bar Component
 * Shows inspection completion progress
 */

export interface ProgressBarProps {
  current: number;
  total: number;
  percentage: number;
}

export function ProgressBar({ current, total, percentage }: ProgressBarProps) {
  return (
    <div className="progress-bar-container" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-bar-label">
        <span>{current} of {total} checkpoints</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
