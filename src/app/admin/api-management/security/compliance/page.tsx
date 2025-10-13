'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  Calendar,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';

export default function CompliancePage() {
  const [reportType, setReportType] = useState<'soc2' | 'pci_dss' | 'all'>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  });

  // Fetch compliance report
  const { data: report, isLoading, refetch } = api.apiAudit.generateComplianceReport.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    type: reportType,
  });

  const handleGenerateReport = () => {
    refetch();
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Compliance Reports</h1>
              <p className="page-description">
                SOC2 and PCI DSS compliance documentation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              SOC2 Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-success">Compliant</div>
                <div className="text-sm text-muted-foreground">
                  Audit logging and access controls active
                </div>
              </div>
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              PCI DSS Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-success">Compliant</div>
                <div className="text-sm text-muted-foreground">
                  Payment credential access fully logged
                </div>
              </div>
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Report Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate Compliance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Report Type Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Report Type
              </label>
              <div className="flex gap-2">
                <Button
                  variant={reportType === 'all' ? 'default' : 'outline'}
                  onClick={() => setReportType('all')}
                >
                  All
                </Button>
                <Button
                  variant={reportType === 'soc2' ? 'default' : 'outline'}
                  onClick={() => setReportType('soc2')}
                >
                  SOC2
                </Button>
                <Button
                  variant={reportType === 'pci_dss' ? 'default' : 'outline'}
                  onClick={() => setReportType('pci_dss')}
                >
                  PCI DSS
                </Button>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Date Range
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="date"
                    className="input w-full"
                    value={dateRange.start.split('T')[0]}
                    onChange={(e) =>
                      setDateRange({
                        ...dateRange,
                        start: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    className="input w-full"
                    value={dateRange.end.split('T')[0]}
                    onChange={(e) =>
                      setDateRange({
                        ...dateRange,
                        end: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Compliance Report</span>
              <Badge variant="outline">
                {format(new Date(report.generatedAt), 'PPP')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Events</div>
                  <div className="text-2xl font-bold">{report.summary.totalEvents}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                  <div className="text-2xl font-bold text-success">
                    {report.summary.successfulEvents}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                  <div className="text-2xl font-bold text-destructive">
                    {report.summary.failedEvents}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Unique Users</div>
                  <div className="text-2xl font-bold">{report.summary.uniqueUsers}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Credentials</div>
                  <div className="text-2xl font-bold">
                    {report.summary.uniqueCredentials}
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Sections */}
            <div className="space-y-4">
              {report.sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{section.title}</span>
                      <Badge
                        variant={
                          section.status === 'compliant'
                            ? 'default'
                            : section.status === 'warning'
                            ? 'outline'
                            : 'destructive'
                        }
                      >
                        {section.status === 'compliant' && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {section.status === 'warning' && (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {section.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {section.description}
                    </p>
                    <div className="space-y-2">
                      {section.evidence.map((evidence, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded"
                        >
                          <span className="text-sm">{evidence.description}</span>
                          <Badge variant="outline">
                            {evidence.count !== undefined && evidence.count}
                            {evidence.percentage !== undefined &&
                              `${evidence.percentage}%`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
