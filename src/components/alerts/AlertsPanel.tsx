'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  X,
  Bell,
  BellOff,
  RefreshCw,
  Settings,
  Filter,
} from 'lucide-react';
import { Alert, AlertSeverity, AlertStatus, globalThresholdMonitor } from '@/lib/alerts/threshold-monitor';
import { formatDistanceToNow } from 'date-fns';

const SEVERITY_ICONS = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const SEVERITY_COLORS = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_COLORS = {
  active: 'bg-red-100 text-red-800',
  acknowledged: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
};

interface AlertsPanelProps {
  dashboardId?: string;
  showResolved?: boolean;
  maxAlerts?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAlertClick?: (alert: Alert) => void;
}

export function AlertsPanel({
  dashboardId,
  showResolved = false,
  maxAlerts = 10,
  autoRefresh = true,
  refreshInterval = 30000,
  onAlertClick,
}: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [muted, setMuted] = useState(false);

  const loadAlerts = () => {
    let allAlerts = showResolved
      ? globalThresholdMonitor.getAllAlerts()
      : globalThresholdMonitor.getActiveAlerts({ dashboardId });

    if (filterSeverity !== 'all') {
      allAlerts = allAlerts.filter((alert) => alert.severity === filterSeverity);
    }

    setAlerts(allAlerts.slice(0, maxAlerts));
  };

  useEffect(() => {
    loadAlerts();

    if (autoRefresh) {
      const interval = setInterval(loadAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [dashboardId, showResolved, filterSeverity, autoRefresh, refreshInterval]);

  const handleAcknowledge = (alertId: string, userId: string = 'current-user') => {
    globalThresholdMonitor.acknowledgeAlert(alertId, userId);
    loadAlerts();
  };

  const handleResolve = (alertId: string) => {
    globalThresholdMonitor.resolveAlert(alertId);
    loadAlerts();
  };

  const clearResolved = () => {
    const cleared = globalThresholdMonitor.clearResolvedAlerts();
    loadAlerts();
    return cleared;
  };

  const activeCount = alerts.filter((a) => a.status === 'active').length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length;

  return (
    <Card className="alerts-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Alerts & Notifications</CardTitle>
            {activeCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeCount} active
              </Badge>
            )}
            {criticalCount > 0 && (
              <Badge variant="destructive" className="ml-1 animate-pulse">
                {criticalCount} critical
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as AlertSeverity | 'all')}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMuted(!muted)}
              title={muted ? 'Unmute alerts' : 'Mute alerts'}
            >
              {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={loadAlerts} title="Refresh alerts">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="text-lg font-medium">All clear!</p>
            <p className="text-sm">No active alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const SeverityIcon = SEVERITY_ICONS[alert.severity];

              return (
                <div
                  key={alert.id}
                  className={`p-4 border-l-4 rounded-lg ${SEVERITY_COLORS[alert.severity]} ${
                    onAlertClick ? 'cursor-pointer hover:shadow-md' : ''
                  } transition-all`}
                  onClick={() => onAlertClick?.(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <SeverityIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{alert.message}</p>
                          <Badge className={STATUS_COLORS[alert.status]} variant="outline">
                            {alert.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Triggered {formatDistanceToNow(alert.triggeredAt, { addSuffix: true })}
                          </span>
                          <span className="font-mono">Metric: {alert.metric}</span>
                          <span className="font-mono">
                            Value: {alert.currentValue.toLocaleString()}
                          </span>
                        </div>
                        {alert.acknowledgedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Acknowledged {formatDistanceToNow(alert.acknowledgedAt, { addSuffix: true })}
                            {alert.acknowledgedBy && ` by ${alert.acknowledgedBy}`}
                          </p>
                        )}
                        {alert.resolvedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Resolved {formatDistanceToNow(alert.resolvedAt, { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                    {alert.status === 'active' && (
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcknowledge(alert.id);
                          }}
                          title="Acknowledge alert"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolve(alert.id);
                          }}
                          title="Resolve alert"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showResolved && alerts.some((a) => a.status === 'resolved') && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={clearResolved} className="w-full">
              Clear Resolved Alerts
            </Button>
          </div>
        )}

        {!muted && activeCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span>
                Notifications enabled • {activeCount} alert{activeCount !== 1 ? 's' : ''} requiring
                attention
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AlertsPanel;
