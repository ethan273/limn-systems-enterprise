'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface QuickBooksConnection {
  realmId: string;
  companyId: string;
  companyName: string;
  isActive: boolean;
  tokenExpiresAt: string | null;
  tokenExpired: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

interface QuickBooksStatus {
  connected: boolean;
  connections: QuickBooksConnection[];
  totalConnections: number;
  activeConnections: number;
}

export default function QuickBooksIntegrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<QuickBooksStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch connection status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quickbooks/status');
      if (!response.ok) {
        throw new Error('Failed to fetch QuickBooks status');
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check for success/error query params
    const success = searchParams?.get('success');
    const errorParam = searchParams?.get('error');

    if (success === 'true') {
      setError(null);
      // Remove query params
      router.replace('/admin/integrations/quickbooks');
    } else if (errorParam) {
      const errorMessages: Record<string, string> = {
        cancelled: 'QuickBooks connection was cancelled',
        missing_params: 'Invalid callback parameters',
        invalid_state: 'Invalid or expired security token. Please try again.',
        token_exchange_failed: 'Failed to exchange authorization code for tokens',
        unexpected: 'An unexpected error occurred',
      };
      setError(errorMessages[errorParam] || 'Failed to connect to QuickBooks');
      router.replace('/admin/integrations/quickbooks');
    }
  }, [searchParams, router]);

  const handleConnect = () => {
    window.location.href = '/api/quickbooks/connect';
  };

  const handleDisconnect = async (realmId?: string) => {
    if (!confirm('Are you sure you want to disconnect from QuickBooks?')) {
      return;
    }

    try {
      setDisconnecting(true);
      const response = await fetch('/api/quickbooks/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realmId }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect from QuickBooks');
      }

      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRefresh = async (realmId?: string) => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/quickbooks/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realmId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.reconnectRequired) {
          setError(data.error);
        } else {
          throw new Error(data.error || 'Failed to refresh token');
        }
      } else {
        await fetchStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh token');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getTokenStatus = (connection: QuickBooksConnection) => {
    if (!connection.isActive) return '❌ Inactive';
    if (connection.tokenExpired) return '⚠️ Expired';
    return '✅ Active';
  };

  return (
    <div className="quickbooks-integration-page">
      <div className="page-header">
        <h1>QuickBooks Integration</h1>
        <p className="page-description">
          Connect your QuickBooks Online account to sync invoices, payments, and customers.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
          <button
            className="alert-close"
            onClick={() => setError(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading QuickBooks connection status...</p>
        </div>
      ) : (
        <div className="connection-status-container">
          {!status?.connected ? (
            <div className="connection-card not-connected">
              <div className="connection-icon">🔌</div>
              <h2>Not Connected</h2>
              <p>Connect your QuickBooks Online account to enable invoice and payment sync.</p>
              <button
                className="btn btn-primary"
                onClick={handleConnect}
                disabled={disconnecting}
              >
                Connect to QuickBooks
              </button>
            </div>
          ) : (
            <div className="connections-list">
              <div className="connections-header">
                <h2>Connected Accounts</h2>
                <button
                  className="btn btn-secondary"
                  onClick={handleConnect}
                >
                  Add Another Account
                </button>
              </div>

              {status.connections.filter(c => c.isActive).map((connection) => (
                <div key={connection.realmId} className="connection-card connected">
                  <div className="connection-details">
                    <div className="connection-name">
                      <h3>{connection.companyName}</h3>
                      <span className={`status-badge ${connection.tokenExpired ? 'expired' : 'active'}`}>
                        {getTokenStatus(connection)}
                      </span>
                    </div>

                    <div className="connection-info">
                      <div className="info-row">
                        <span className="info-label">Company ID:</span>
                        <span className="info-value">{connection.realmId}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Connected:</span>
                        <span className="info-value">{formatDate(connection.createdAt)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Token Expires:</span>
                        <span className="info-value">{formatDate(connection.tokenExpiresAt)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Last Updated:</span>
                        <span className="info-value">{formatDate(connection.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="connection-actions">
                    {connection.tokenExpired && (
                      <button
                        className="btn btn-warning"
                        onClick={() => handleRefresh(connection.realmId)}
                        disabled={refreshing}
                      >
                        {refreshing ? 'Refreshing...' : 'Refresh Token'}
                      </button>
                    )}
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDisconnect(connection.realmId)}
                      disabled={disconnecting}
                    >
                      {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                </div>
              ))}

              {status.connections.filter(c => !c.isActive).length > 0 && (
                <details className="inactive-connections">
                  <summary>Inactive Connections ({status.connections.filter(c => !c.isActive).length})</summary>
                  {status.connections.filter(c => !c.isActive).map((connection) => (
                    <div key={connection.realmId} className="connection-card inactive">
                      <div className="connection-name">
                        <h4>{connection.companyName}</h4>
                        <span className="status-badge inactive">Inactive</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Disconnected:</span>
                        <span className="info-value">{formatDate(connection.updatedAt)}</span>
                      </div>
                    </div>
                  ))}
                </details>
              )}
            </div>
          )}

          <div className="integration-features">
            <h2>Features</h2>
            <ul className="features-list">
              <li>✅ Sync invoices to QuickBooks Online</li>
              <li>✅ Record payments automatically</li>
              <li>✅ Sync customer information</li>
              <li>✅ Real-time invoice status updates</li>
              <li>✅ Automatic token refresh</li>
              <li>✅ Secure OAuth 2.0 authentication</li>
            </ul>
          </div>

          <div className="integration-help">
            <h3>Need Help?</h3>
            <p>
              Learn more about QuickBooks integration in our{' '}
              <a href="/docs/integrations/quickbooks" className="link">
                documentation
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
