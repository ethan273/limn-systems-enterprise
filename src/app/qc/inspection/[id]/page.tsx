'use client';

/**
 * QC Inspection Page
 * Main checklist interface for conducting inspections
 * QC PWA Enhancement - Phase 4
 */

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { ChecklistSection } from '@/components/qc/ChecklistSection';
import { ProgressBar } from '@/components/qc/ProgressBar';
import { HistoricalIssuesPanel } from '@/components/qc/HistoricalIssuesPanel';
import { trackInspectionComplete } from '@/lib/analytics/qcMetrics';

export default function InspectionPage() {
  const router = useRouter();
  const params = useParams();
  const inspectionId = params.id as string;

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showHistoricalIssues, setShowHistoricalIssues] = useState(false);

  // Get current user (for future use with permissions/audit)
  const { data: _currentUser } = api.userProfile.getCurrentUser.useQuery();

  // Fetch inspection progress
  const {
    data: inspectionData,
    isLoading,
    refetch: refetchInspection,
  } = api.qcPwa.getInspectionProgress.useQuery(
    {
      inspection_id: inspectionId,
    },
    {
      enabled: !!inspectionId,
      refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    }
  );

  // Submit inspection mutation
  const submitInspectionMutation = api.qcPwa.submitInspection.useMutation({
    onSuccess: () => {
      alert('Inspection submitted successfully!');
      router.push('/qc/dashboard');
    },
    onError: (error) => {
      alert(`Failed to submit inspection: ${error.message}`);
    },
  });

  const inspection = inspectionData as typeof inspectionData & {
    id: string;
    inspection_type: string;
    inspection_date: Date;
    qc_section_results: any[];
    production_items?: { items?: { item_name?: string } };
    prototype_production?: { prototypes?: { name?: string } };
    production_item_id?: string;
    prototype_production_id?: string;
  };
  const sections = inspection?.qc_section_results || [];
  // eslint-disable-next-line security/detect-object-injection
  const currentSection = sections[currentSectionIndex];

  // Calculate progress
  const totalCheckpoints = sections.reduce(
    (sum: number, section: any) => sum + (section.qc_checkpoint_results?.length || 0),
    0
  );
  const completedCheckpoints = sections.reduce(
    (sum: number, section: any) =>
      sum +
      (section.qc_checkpoint_results?.filter((cp: any) => cp.status !== 'pending').length || 0),
    0
  );
  const progressPercentage = totalCheckpoints > 0 ? (completedCheckpoints / totalCheckpoints) * 100 : 0;

  /**
   * Navigate to next section
   */
  const goToNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Navigate to previous section
   */
  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Handle inspection submission
   */
  const handleSubmitInspection = async () => {
    if (!inspection) return;

    // Check if all checkpoints are complete
    const allComplete = sections.every((section: any) =>
      section.qc_checkpoint_results?.every((cp: any) => cp.status !== 'pending')
    );

    if (!allComplete) {
      const confirm = window.confirm(
        'Not all checkpoints are complete. Do you want to continue?'
      );
      if (!confirm) return;
    }

    // Determine final status (passed/failed)
    const hasCriticalFailures = sections.some((section: any) =>
      section.qc_checkpoint_results?.some(
        (cp: any) => cp.status === 'fail' && cp.severity === 'critical'
      )
    );

    const status = hasCriticalFailures ? 'failed' : 'passed';

    // Calculate metrics for analytics
    const passedCount = sections.reduce(
      (sum: number, section: any) =>
        sum + (section.qc_checkpoint_results?.filter((cp: any) => cp.status === 'pass').length || 0),
      0
    );
    const failedCount = sections.reduce(
      (sum: number, section: any) =>
        sum + (section.qc_checkpoint_results?.filter((cp: any) => cp.status === 'fail').length || 0),
      0
    );
    const photoCount = sections.reduce(
      (sum: number, section: any) =>
        sum + (section.qc_checkpoint_results?.reduce((s: number, cp: any) => s + (cp.photos_captured || 0), 0) || 0),
      0
    );

    try {
      await submitInspectionMutation.mutateAsync({
        inspection_id: inspectionId,
        final_status: status,
      });

      // Track completion analytics
      const inspectionDate = new Date(inspection.inspection_date as unknown as string);
      const durationSeconds = Math.round((new Date().getTime() - inspectionDate.getTime()) / 1000);

      trackInspectionComplete({
        inspection_id: inspectionId,
        inspection_type: inspection.inspection_type as 'qc' | 'factory_review',
        final_status: status,
        duration_seconds: durationSeconds,
        total_checkpoints: totalCheckpoints,
        passed_checkpoints: passedCount,
        failed_checkpoints: failedCount,
        photos_captured: photoCount,
        voice_notes_used: 0, // Not tracked in current schema
      });
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  if (isLoading) {
    return (
      <div className="page-container qc-inspection-page">
        <div className="loading-state loading-state-full">
          <div className="spinner" aria-label="Loading inspection..." />
          <p>Loading inspection...</p>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="page-container qc-inspection-page">
        <div className="error-state">
          <h2>Inspection Not Found</h2>
          <p>The requested inspection could not be found.</p>
          <button onClick={() => router.push('/qc/inspection/new')} className="btn btn-primary">
            Start New Inspection
          </button>
        </div>
      </div>
    );
  }

  const isLastSection = currentSectionIndex === sections.length - 1;

  return (
    <div className="page-container qc-inspection-page">
      {/* Header */}
      <div className="page-header page-header-sticky">
        <div className="page-header-top">
          <button
            onClick={() => router.back()}
            className="btn-icon"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>

          <div className="page-header-title">
            <h1 className="page-title">
              {inspection.inspection_type === 'qc' ? 'QC Inspection' : 'Factory Review'}
            </h1>
            <p className="page-subtitle">
              {inspection.production_items?.items?.item_name ||
                inspection.prototype_production?.prototypes?.name ||
                'Unknown Item'}
            </p>
          </div>

          <button
            onClick={() => setShowHistoricalIssues(!showHistoricalIssues)}
            className="btn-icon"
            aria-label="Toggle historical issues"
            aria-pressed={showHistoricalIssues}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          current={completedCheckpoints}
          total={totalCheckpoints}
          percentage={progressPercentage}
        />
      </div>

      {/* Historical Issues Panel (Slide-out) */}
      {showHistoricalIssues && (
        <HistoricalIssuesPanel
          productionItemId={inspection.production_item_id}
          prototypeProductionId={inspection.prototype_production_id}
          onClose={() => setShowHistoricalIssues(false)}
        />
      )}

      {/* Section Navigation */}
      <div className="section-navigation">
        {sections.map((section: any, index: number) => {
          const isComplete = section.qc_checkpoint_results?.every(
            (cp: any) => cp.status !== 'pending'
          );
          const hasFailed = section.qc_checkpoint_results?.some(
            (cp: any) => cp.status === 'fail'
          );

          return (
            <button
              key={section.id}
              className={`section-nav-item ${index === currentSectionIndex ? 'active' : ''} ${
                isComplete ? 'complete' : ''
              } ${hasFailed ? 'failed' : ''}`}
              onClick={() => setCurrentSectionIndex(index)}
              aria-label={`Go to section ${index + 1}: ${section.section_name}`}
              aria-current={index === currentSectionIndex ? 'step' : undefined}
            >
              <div className="section-nav-number">{index + 1}</div>
              <div className="section-nav-label">{section.section_name}</div>
            </button>
          );
        })}
      </div>

      {/* Current Section */}
      {currentSection && (
        <ChecklistSection
          section={currentSection}
          inspectionId={inspectionId}
          onSectionComplete={refetchInspection}
        />
      )}

      {/* Navigation Footer */}
      <div className="page-footer page-footer-sticky">
        <button
          onClick={goToPreviousSection}
          disabled={currentSectionIndex === 0}
          className="btn btn-secondary"
          aria-label="Previous section"
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
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Previous</span>
        </button>

        {!isLastSection ? (
          <button
            onClick={goToNextSection}
            className="btn btn-primary"
            aria-label="Next section"
          >
            <span>Next Section</span>
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
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSubmitInspection}
            className="btn btn-success btn-submit-inspection"
            aria-label="Submit inspection"
            disabled={submitInspectionMutation.isPending}
          >
            {submitInspectionMutation.isPending ? (
              <>
                <div className="spinner spinner-small" />
                <span>Submitting...</span>
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
                  className="icon"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Submit Inspection</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
