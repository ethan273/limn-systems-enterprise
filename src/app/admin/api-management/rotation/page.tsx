'use client';

/**
 * Credential Rotation Page
 *
 * Zero-downtime credential rotation management
 */

import { useState } from 'react';
import { api } from '@/lib/api/client';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function CredentialRotationPage() {
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [confirmRotation, setConfirmRotation] = useState(false);

  // Fetch all credentials
  const { data: credentials } = api.apiCredentials.getAll.useQuery();

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
        return 'text-green-600 bg-green-50';
      case 'in_progress':
      case 'grace_period':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
      case 'rolled_back':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Credential Rotation</h1>
        <p className="mt-2 text-gray-600">
          Zero-downtime rotation for supported credential types
        </p>
      </div>

      {/* Credentials List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Credentials</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {credentials?.map((credential) => (
            <div
              key={credential.id}
              className={`p-6 hover:bg-gray-50 cursor-pointer ${
                selectedCredential === credential.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedCredential(credential.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {credential.display_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {credential.service_template || 'Custom'}
                  </p>
                  {credential.last_rotated_at && (
                    <p className="text-sm text-gray-500 mt-1">
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
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
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
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Active Rotation Session
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
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
                    <p className="text-red-600">
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
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Rotate Credentials
              </button>
            )}

            {/* Confirmation Dialog */}
            {confirmRotation && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Confirm Credential Rotation
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      This will initiate a zero-downtime rotation process:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 mb-4">
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {initiateRotation.isPending ? 'Starting...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmRotation(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!rotationStatus.canRotate && !rotationStatus.currentSession && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
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
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Rotation History
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Initiated By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rotationHistory.map((rotation) => (
                  <tr key={rotation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(rotation.started_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rotation.completed_at
                        ? new Date(rotation.completed_at).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          rotation.status
                        )}`}
                      >
                        {rotation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rotation.initiated_by}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
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
