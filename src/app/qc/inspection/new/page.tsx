'use client';

/**
 * QC Inspection Start Page
 * Select item/prototype to inspect and start new inspection
 * QC PWA Enhancement - Phase 4
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { trackInspectionStart } from '@/lib/analytics/qcMetrics';

export default function NewInspectionPage() {
  const router = useRouter();
  const [inspectionType, setInspectionType] = useState<'qc' | 'factory_review'>('qc');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);

  // Fetch ready-for-QC items
  const {
    data: qcItemsData,
    isLoading: isLoadingQcItems,
  } = api.qcPwa.getReadyForQcItems.useQuery(
    {
      offset: 0,
      limit: 50,
    },
    {
      enabled: inspectionType === 'qc',
    }
  );

  // Fetch ready-for-review prototypes
  const {
    data: prototypesData,
    isLoading: isLoadingPrototypes,
  } = api.qcPwa.getReadyForReviewPrototypes.useQuery(
    {
      offset: 0,
      limit: 50,
    },
    {
      enabled: inspectionType === 'factory_review',
    }
  );

  // Start inspection mutation
  const startInspectionMutation = api.qcPwa.startInspection.useMutation({
    onSuccess: (inspection) => {
      // Track inspection start
      trackInspectionStart({
        inspection_id: inspection.id,
        inspection_type: inspectionType,
        item_id: inspection.production_item_id || undefined,
        prototype_id: inspection.prototype_production_id || undefined,
      });

      // Navigate to inspection page
      router.push(`/qc/inspection/${inspection.id}`);
    },
    onError: (error) => {
      alert(`Failed to start inspection: ${error.message}`);
      setIsStarting(false);
    },
  });

  /**
   * Handle inspection start
   */
  const handleStartInspection = async () => {
    if (!selectedItemId) {
      alert('Please select an item/prototype');
      return;
    }

    setIsStarting(true);

    try {
      // Get default template - simplified for MVP
      const templateId = crypto.randomUUID();
      const idempotencyKey = crypto.randomUUID();

      const input =
        inspectionType === 'qc'
          ? {
              production_item_id: selectedItemId,
              template_id: templateId,
              idempotency_key: idempotencyKey,
            }
          : {
              prototype_production_id: selectedItemId,
              template_id: templateId,
              idempotency_key: idempotencyKey,
            };

      await startInspectionMutation.mutateAsync(input);
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  const items = inspectionType === 'qc' ? qcItemsData?.items || [] : prototypesData?.prototypes || [];
  const isLoading = inspectionType === 'qc' ? isLoadingQcItems : isLoadingPrototypes;

  return (
    <div className="page-container qc-new-inspection-page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Start New Inspection</h1>
        <p className="page-subtitle">Select an item or prototype to inspect</p>
      </div>

      {/* Inspection Type Selector */}
      <div className="inspection-type-selector">
        <button
          className={`btn-inspection-type ${inspectionType === 'qc' ? 'active' : ''}`}
          onClick={() => {
            setInspectionType('qc');
            setSelectedItemId('');
          }}
          aria-pressed={inspectionType === 'qc'}
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <span>QC Inspection</span>
        </button>

        <button
          className={`btn-inspection-type ${inspectionType === 'factory_review' ? 'active' : ''}`}
          onClick={() => {
            setInspectionType('factory_review');
            setSelectedItemId('');
          }}
          aria-pressed={inspectionType === 'factory_review'}
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
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>Factory Review</span>
        </button>
      </div>

      {/* Item List */}
      <div className="item-list-container">
        {isLoading && (
          <div className="loading-state">
            <div className="spinner" aria-label="Loading items..." />
            <p>Loading {inspectionType === 'qc' ? 'production items' : 'prototypes'}...</p>
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="empty-state">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon-large"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h2>No Items Available</h2>
            <p>
              There are currently no {inspectionType === 'qc' ? 'production items' : 'prototypes'}{' '}
              ready for inspection.
            </p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="item-list" role="list">
            {items.map((item: any) => {
              const itemId = item.id;
              const itemName =
                inspectionType === 'qc'
                  ? item.production_order?.order?.item_name || 'Unknown Item'
                  : item.prototype_details?.prototype_name || 'Unknown Prototype';
              const orderNumber =
                inspectionType === 'qc'
                  ? item.production_order?.order_number
                  : item.project?.project_number;
              const factoryName =
                inspectionType === 'qc'
                  ? item.production_order?.assigned_factory?.factory_name
                  : item.assigned_factory?.factory_name;

              return (
                <button
                  key={itemId}
                  className={`item-card ${selectedItemId === itemId ? 'selected' : ''}`}
                  onClick={() => setSelectedItemId(itemId)}
                  role="listitem"
                >
                  <div className="item-card-header">
                    <div className="item-card-checkbox">
                      <div className={`checkbox ${selectedItemId === itemId ? 'checked' : ''}`}>
                        {selectedItemId === itemId && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="item-card-title">
                      <h3>{itemName}</h3>
                      {orderNumber && <p className="item-card-meta">Order: {orderNumber}</p>}
                    </div>
                  </div>

                  {factoryName && (
                    <div className="item-card-detail">
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
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      <span>{factoryName}</span>
                    </div>
                  )}

                  <div className="item-card-detail">
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
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Ready for {inspectionType === 'qc' ? 'QC' : 'Review'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Start Inspection Button */}
      <div className="page-footer">
        <button
          className="btn btn-primary btn-start-inspection"
          onClick={handleStartInspection}
          disabled={!selectedItemId || isStarting}
          aria-label="Start inspection"
        >
          {isStarting ? (
            <>
              <div className="spinner spinner-small" />
              <span>Starting Inspection...</span>
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
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Start Inspection</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
