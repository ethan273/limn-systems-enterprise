'use client';

import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Key,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  ArrowRight,
  Lock,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';

export default function ApiManagementDashboard() {
  // Fetch credentials for stats
  const { data: credentials } = api.apiCredentials.getAll.useQuery();
  const { data: expiringCredentials } = api.apiCredentials.getExpiring.useQuery();

  // Calculate stats
  const totalCredentials = credentials?.length || 0;
  const activeCredentials = credentials?.filter((c) => c.is_active).length || 0;
  const expiringSoon = expiringCredentials?.length || 0;

  // Calculate credentials needing rotation (>90 days old)
  const needingRotation = credentials?.filter((c) => {
    const now = new Date();
    const created = new Date(c.created_at);
    const daysOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return daysOld >= 90;
  }).length || 0;

  // Security score (0-100)
  const calculateSecurityScore = (): number => {
    if (totalCredentials === 0) return 100;

    let score = 100;

    // Deduct points for expiring credentials
    const expiringPercentage = (expiringSoon / totalCredentials) * 100;
    score -= expiringPercentage * 0.3;

    // Deduct points for credentials needing rotation
    const needingRotationPercentage = (needingRotation / totalCredentials) * 100;
    score -= needingRotationPercentage * 0.5;

    // Deduct points for inactive credentials
    const inactiveCredentials = totalCredentials - activeCredentials;
    const inactivePercentage = (inactiveCredentials / totalCredentials) * 100;
    score -= inactivePercentage * 0.2;

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const securityScore = calculateSecurityScore();

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  // Quick action items
  const quickActions = [
    {
      title: 'View All Credentials',
      description: `Manage ${totalCredentials} API credential${totalCredentials !== 1 ? 's' : ''}`,
      icon: Key,
      href: '/admin/api-management/credentials',
      color: 'text-primary',
    },
    {
      title: 'Security & Audit',
      description: 'View audit logs and compliance reports',
      icon: Lock,
      href: '/admin/api-management/security',
      color: 'text-info',
    },
    {
      title: 'Health Checks',
      description: 'Monitor API endpoint health',
      icon: Activity,
      href: '/admin/api-management/health',
      color: 'text-success',
    },
    {
      title: 'Credential Rotation',
      description: 'Manage automated key rotation',
      icon: Clock,
      href: '/admin/api-management/rotation',
      color: 'text-warning',
    },
    {
      title: 'Analytics',
      description: 'API usage metrics and insights',
      icon: BarChart3,
      href: '/admin/api-management/analytics',
      color: 'text-secondary',
      badge: 'Coming Soon',
    },
  ];

  // Recent alerts
  const alerts: Array<{
    type: string;
    message: string;
    action: string;
    href: string;
  }> = [];

  if (expiringSoon > 0) {
    alerts.push({
      type: 'warning',
      message: `${expiringSoon} credential${expiringSoon !== 1 ? 's' : ''} expiring within 30 days`,
      action: 'View',
      href: '/admin/api-management/credentials',
    });
  }

  if (needingRotation > 0) {
    alerts.push({
      type: 'info',
      message: `${needingRotation} credential${needingRotation !== 1 ? 's' : ''} due for rotation`,
      action: 'Review',
      href: '/admin/api-management/credentials',
    });
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="page-title">API Management</h1>
              <p className="page-description">
                Centralized security, monitoring, and management for all API credentials
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Score */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Security Score</h2>
            <p className="text-sm text-muted-foreground">
              Overall health of your API credentials
            </p>
          </div>
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}
            </div>
            <div className="text-sm text-muted-foreground mt-1">out of 100</div>
          </div>
        </div>

        {securityScore < 80 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
            <p className="text-muted-foreground">
              <strong>Recommendations:</strong> Review credentials needing rotation and update expiring keys to improve your security score.
            </p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Key className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{totalCredentials}</div>
              <div className="text-sm text-muted-foreground">Total Credentials</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <div className="text-2xl font-bold">{activeCredentials}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div>
              <div className="text-2xl font-bold">{expiringSoon}</div>
              <div className="text-sm text-muted-foreground">Expiring Soon</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{needingRotation}</div>
              <div className="text-sm text-muted-foreground">Need Rotation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3 mb-6">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`alert ${
                alert.type === 'warning' ? 'alert-warning' : 'alert-info'
              }`}
            >
              {alert.type === 'warning' ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
              <div className="flex-1">
                <strong>{alert.type === 'warning' ? 'Warning:' : 'Notice:'}</strong> {alert.message}
              </div>
              <Link href={alert.href}>
                <Button variant="outline" size="sm">
                  {alert.action}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} href={action.href}>
              <div className="card p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  {action.badge && (
                    <Badge variant="outline" className="text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {action.description}
                </p>
                <div className="flex items-center text-sm text-primary">
                  {action.badge ? 'Learn more' : 'Open'}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Getting Started */}
      {totalCredentials === 0 && (
        <div className="card p-6">
          <div className="text-center max-w-md mx-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
              <Key className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Get Started with API Management</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Add your first API credential to start managing your integrations securely. We support
              11 pre-configured service templates including Stripe, QuickBooks, AWS, and more.
            </p>
            <Link href="/admin/api-management/credentials">
              <Button>
                <Key className="h-4 w-4 mr-2" />
                Add Your First Credential
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Module Features */}
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Module Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Security</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7">
              <li>• AES-256-GCM encryption</li>
              <li>• IP whitelisting</li>
              <li>• Audit logging</li>
              <li>• Emergency access</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Operations</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7">
              <li>• Health monitoring</li>
              <li>• Automated rotation</li>
              <li>• Usage analytics</li>
              <li>• Rate limiting</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Compliance</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7">
              <li>• SOC2 reporting</li>
              <li>• PCI DSS compliance</li>
              <li>• Rotation tracking</li>
              <li>• Access logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
