'use client';

/**
 * Credential Rotation Page
 *
 * Zero-downtime credential rotation management
 */

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { LoadingState } from '@/components/common';
import Link from 'next/link';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';

export default function CredentialRotationPage() {
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [confirmRotation, setConfirmRotation] = useState(false);

  // Fetch all credentials
  const { data: credentials, isLoading } = api.apiCredentials.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading credentials..." size="lg" />
      </div>
    );
  }

  // Fetch rotation status for selected credential
  const { data: rotationStatus, refetch: refetchStatus } =
    api.apiRotation.getRotationStatus.useQuery(
      { credentialId: selectedCredential! },
      { enabled: !!selectedCredential, refetchInterval: 5000 }
    );

  // Fetch rotation history
  const { data: rotationHistory } = api.apiRotation.getRotationHistory.useQuery(
    { credentialId: selectedCredential!, limit: 20 },
    { enabled: !!selectedCredential }
  );

  // Mutations
  const initiateRotation = api.apiRotation.initiateRotation.useMutation({
    onSuccess: () => {
      refetchStatus();
      setConfirmRotation(false);
    },
  });

  const rollbackRotation = api.apiRotation.rollbackRotation.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10 border-success/20';
      case 'in_progress':
      case 'grace_period':
        return 'text-info bg-info/10 border-info/20';
      case 'failed':
      case 'rolled_back':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'in_progress':
      case 'grace_period':
        return <RefreshCw className="h-5 w-5 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5" />;
      case 'rolled_back':
        return <RotateCcw className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className="page-container">
      {/* Back Navigation */}
      <Link
        href="/admin/api-management"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to API Management
      </Link>

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Credential Rotation</h1>
        <p className="page-description">
          Zero-downtime rotation for supported credential types
        </p>
      </div>

      {/* Credentials List */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-primary">Credentials</h2>
        </div>

        <div className="divide-y">
          {credentials?.map((credential: Record<string, any>) => (
            <div
              key={credential.id}
              className={`p-6 hover-card cursor-pointer ${
                selectedCredential === credential.id ? 'bg-muted' : ''
              }`}
              onClick={() => setSelectedCredential(credential.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    {credential.display_name}
                  </h3>
                  <p className="text-sm text-secondary mt-1">
                    {credential.service_template || 'Custom'}
                  </p>
                  {credential.last_rotated_at && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Last rotated:{' '}
                      {new Date(credential.last_rotated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rotation Controls */}
      {selectedCredential && rotationStatus && (
        <div className="card">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-primary">
              Rotation Status
            </h2>
          </div>

          <div className="p-6">
            {/* Current Status */}
            <div className="mb-6">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  rotationStatus.status
                )}`}
              >
                {getStatusIcon(rotationStatus.status)}
                {rotationStatus.status.toUpperCase().replace('_', ' ')}
              </span>
            </div>

            {/* Active Rotation Session */}
            {rotationStatus.currentSession && (
              <div className="mb-6 p-4 alert-info">
                <h3 className="font-semibold text-primary mb-2">
                  Active Rotation Session
                </h3>
                <div className="space-y-2 text-sm text-secondary">
                  <p>
                    Started:{' '}
                    {new Date(
                      rotationStatus.currentSession.started_at
                    ).toLocaleString()}
                  </p>
                  {rotationStatus.currentSession.grace_period_ends_at && (
                    <p>
                      Grace period ends:{' '}
                      {new Date(
                        rotationStatus.currentSession.grace_period_ends_at
                      ).toLocaleString()}
                    </p>
                  )}
                  {rotationStatus.currentSession.error_message && (
                    <p className="text-destructive">
                      Error: {rotationStatus.currentSession.error_message}
                    </p>
                  )}
                </div>

                {rotationStatus.currentSession.status === 'grace_period' && (
                  <button
                    onClick={() =>
                      rollbackRotation.mutate({
                        sessionId: rotationStatus.currentSession!.id,
                      })
                    }
                    disabled={rollbackRotation.isPending}
                    className="mt-4 px-4 py-2 btn btn-destructive disabled:opacity-50"
                  >
                    <RotateCcw className="inline h-4 w-4 mr-2" />
                    Rollback
                  </button>
                )}
              </div>
            )}

            {/* Initiate Rotation */}
            {rotationStatus.canRotate && !confirmRotation && (
              <button
                onClick={() => setConfirmRotation(true)}
                className="px-6 py-3 btn btn-primary flex items-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Rotate Credentials
              </button>
            )}

            {/* Confirmation Dialog */}
            {confirmRotation && (
              <div className="p-4 alert-warning rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-2">
                      Confirm Credential Rotation
                    </h3>
                    <p className="text-sm text-secondary mb-4">
                      This will initiate a zero-downtime rotation process:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-secondary space-y-1 mb-4">
                      <li>Generate new credentials in the service provider</li>
                      <li>Run health checks on new credentials</li>
                      <li>Enter 5-minute grace period (old + new both active)</li>
                      <li>Deactivate old credentials if healthy</li>
                    </ol>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          initiateRotation.mutate({
                            credentialId: selectedCredential,
                          })
                        }
                        disabled={initiateRotation.isPending}
                        className="px-4 py-2 btn btn-primary disabled:opacity-50"
                      >
                        {initiateRotation.isPending ? 'Starting...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmRotation(false)}
                        className="px-4 py-2 btn btn-ghost"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!rotationStatus.canRotate && !rotationStatus.currentSession && (
              <div className="p-4 bg-muted/30 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Automatic rotation is not supported for this credential type.
                  Manual rotation required.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rotation History */}
      {selectedCredential && rotationHistory && rotationHistory.length > 0 && (
        <div className="card">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-primary">
              Rotation History
            </h2>
          </div>

          <div className="w-full">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Initiated By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rotationHistory.map((rotation) => (
                  <tr key={rotation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                      {new Date(rotation.started_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                      {rotation.completed_at
                        ? new Date(rotation.completed_at).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          rotation.status
                        )}`}
                      >
                        {rotation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                      {rotation.initiated_by}
                    </td>
                    <td className="px-6 py-4 text-sm text-primary">
                      {rotation.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
