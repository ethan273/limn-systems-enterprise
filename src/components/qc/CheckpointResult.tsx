'use client';

/**
 * Checkpoint Result Component
 * Individual checkpoint result capture with photos and voice notes
 * QC PWA Enhancement - Phase 4
 */

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { CameraCapture } from './CameraCapture';
import { getSingleVoiceNote } from '@/lib/voiceToText';
import { trackCheckpointResult, trackPhotoCapture, trackVoiceNote } from '@/lib/analytics/qcMetrics';

export interface CheckpointResultProps {
  checkpoint: any; // qc_checkpoint_results
  inspectionId: string;
  checkpointNumber: number;
  onResultChange?: () => void; // Callback when result changes
}

export function CheckpointResult({
  checkpoint,
  inspectionId,
  checkpointNumber,
  onResultChange,
}: CheckpointResultProps) {
  const [notes, setNotes] = useState(checkpoint.notes || '');
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stopRecording, setStopRecording] = useState<(() => void) | null>(null);

  // Submit checkpoint result mutation
  const submitResultMutation = api.qcPwa.submitCheckpointResult.useMutation({
    onSuccess: () => {
      onResultChange?.();
    },
    onError: (error) => {
      alert(`Failed to submit result: ${error.message}`);
    },
  });

  /**
   * Handle checkpoint result selection
   */
  const handleResultSelect = async (
    status: 'pass' | 'fail' | 'na',
    severity?: 'minor' | 'major' | 'critical'
  ) => {
    try {
      await submitResultMutation.mutateAsync({
        inspection_id: inspectionId,
        checkpoint_id: checkpoint.id,
        status: status === 'na' ? 'na' : status === 'pass' ? 'pass' : 'fail',
        severity,
        note: notes,
      });

      // Track analytics
      trackCheckpointResult({
        inspection_id: inspectionId,
        checkpoint_id: checkpoint.id,
        checkpoint_code: checkpoint.checkpoint_code || 'unknown',
        status,
        severity,
        has_photo: (checkpoint.photos_captured || 0) > 0,
        has_note: !!notes,
        has_voice_note: false, // Will be tracked separately
      });
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  /**
   * Start voice recording
   */
  const handleStartVoiceRecording = () => {
    setIsRecording(true);

    const stop = getSingleVoiceNote(
      (transcript) => {
        // Append transcript to notes
        const newNotes = notes ? `${notes}\n${transcript}` : transcript;
        setNotes(newNotes);
        setIsRecording(false);
        setStopRecording(null);

        // Track voice note usage
        trackVoiceNote({
          inspection_id: inspectionId,
          checkpoint_id: checkpoint.id,
          transcript_length: transcript.length,
        });
      },
      (error) => {
        alert(`Voice recording error: ${error}`);
        setIsRecording(false);
        setStopRecording(null);
      }
    );

    setStopRecording(() => stop);
  };

  /**
   * Stop voice recording
   */
  const handleStopVoiceRecording = () => {
    if (stopRecording) {
      stopRecording();
      setIsRecording(false);
      setStopRecording(null);
    }
  };

  /**
   * Save notes
   */
  const handleSaveNotes = async () => {
    try {
      await submitResultMutation.mutateAsync({
        inspection_id: inspectionId,
        checkpoint_id: checkpoint.id,
        status: checkpoint.status === 'pending' ? 'pass' : checkpoint.status,
        severity: checkpoint.severity,
        note: notes,
      });
      setIsNotesExpanded(false);
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  /**
   * Handle photo captured
   */
  const handlePhotoCapture = async (_photoUrl: string) => {
    // Photo uploaded - no need to update count, just trigger refresh
    onResultChange?.();

    // Track photo capture
    trackPhotoCapture({
      inspection_id: inspectionId,
      checkpoint_id: checkpoint.id,
      photo_count: (checkpoint.photos_captured || 0) + 1,
    });
  };

  const isComplete = checkpoint.status !== 'pending';
  const isPassed = checkpoint.status === 'pass';
  const isFailed = checkpoint.status === 'fail';
  const isNA = checkpoint.status === 'na';

  return (
    <div className={`checkpoint-result ${checkpoint.status}`}>
      {/* Checkpoint Header */}
      <div className="checkpoint-result-header">
        <div className="checkpoint-result-number">{checkpointNumber}</div>
        <div className="checkpoint-result-title">
          <h3>{checkpoint.checkpoint_text}</h3>
          {checkpoint.guidance_notes && (
            <p className="checkpoint-result-guidance">{checkpoint.guidance_notes}</p>
          )}
        </div>
      </div>

      {/* Result Buttons */}
      <div className="checkpoint-result-buttons">
        <button
          className={`btn-result btn-result-pass ${isPassed ? 'active' : ''}`}
          onClick={() => handleResultSelect('pass')}
          disabled={submitResultMutation.isPending}
          aria-pressed={isPassed}
          aria-label="Mark as passed"
        >
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
          <span>Pass</span>
        </button>

        <button
          className={`btn-result btn-result-fail ${isFailed ? 'active' : ''}`}
          onClick={() => {
            // Show severity selection modal (simplified here)
            const severity = window.prompt('Select severity: minor, major, or critical');
            if (severity === 'minor' || severity === 'major' || severity === 'critical') {
              handleResultSelect('fail', severity);
            }
          }}
          disabled={submitResultMutation.isPending}
          aria-pressed={isFailed}
          aria-label="Mark as failed"
        >
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
          <span>Fail</span>
        </button>

        <button
          className={`btn-result btn-result-na ${isNA ? 'active' : ''}`}
          onClick={() => handleResultSelect('na')}
          disabled={submitResultMutation.isPending}
          aria-pressed={isNA}
          aria-label="Mark as not applicable"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>N/A</span>
        </button>
      </div>

      {/* Additional Actions (Notes & Photos) */}
      {isComplete && (
        <div className="checkpoint-result-actions">
          {/* Notes Section */}
          <div className="checkpoint-result-notes">
            {!isNotesExpanded ? (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setIsNotesExpanded(true)}
                aria-label="Add notes"
              >
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
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>{notes ? 'Edit Notes' : 'Add Notes'}</span>
              </button>
            ) : (
              <div className="checkpoint-notes-editor">
                <textarea
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={4}
                  aria-label="Checkpoint notes"
                />

                <div className="checkpoint-notes-actions">
                  {/* Voice Recording Button */}
                  <button
                    className={`btn btn-sm btn-secondary ${isRecording ? 'recording' : ''}`}
                    onClick={isRecording ? handleStopVoiceRecording : handleStartVoiceRecording}
                    aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
                  >
                    {isRecording ? (
                      <>
                        <div className="recording-indicator" />
                        <span>Stop Recording</span>
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
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="23" />
                          <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                        <span>Voice Note</span>
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleSaveNotes}
                    disabled={submitResultMutation.isPending}
                    aria-label="Save notes"
                  >
                    Save
                  </button>

                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setNotes(checkpoint.notes || '');
                      setIsNotesExpanded(false);
                    }}
                    aria-label="Cancel editing notes"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Camera Section */}
          {!showCamera ? (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowCamera(true)}
              aria-label="Add photos"
            >
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
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>
                Add Photos {checkpoint.photos_captured > 0 && `(${checkpoint.photos_captured})`}
              </span>
            </button>
          ) : (
            <div className="checkpoint-camera">
              <CameraCapture
                inspectionId={inspectionId}
                checkpointId={checkpoint.id}
                onPhotoCapture={handlePhotoCapture}
                onError={(error) => alert(`Camera error: ${error}`)}
                maxPhotos={10}
              />
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowCamera(false)}
                aria-label="Close camera"
              >
                Close Camera
              </button>
            </div>
          )}
        </div>
      )}

      {/* Severity Badge (if failed) */}
      {isFailed && checkpoint.severity && (
        <div className={`checkpoint-result-severity severity-${checkpoint.severity}`}>
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
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{checkpoint.severity.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}
