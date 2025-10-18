'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Shield,
  ArrowLeft,
  FileDown,
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable plugin properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

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

  const handleExportPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Compliance Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(report.generatedAt), 'PPP')}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Period: ${format(new Date(dateRange.start), 'PP')} - ${format(new Date(dateRange.end), 'PP')}`, pageWidth / 2, 34, { align: 'center' });

    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 45);

    const summaryData = [
      ['Total Events', report.summary.totalEvents.toString()],
      ['Successful Events', report.summary.successfulEvents.toString()],
      ['Failed Events', report.summary.failedEvents.toString()],
      ['Unique Users', report.summary.uniqueUsers.toString()],
      ['Credentials Accessed', report.summary.uniqueCredentials.toString()],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Compliance Sections
    let currentY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

    report.sections.forEach((section) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, 14, currentY);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${section.status.toUpperCase()}`, 14, currentY + 6);

      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(section.description, pageWidth - 28);
      doc.text(descLines, 14, currentY + 12);

      // Evidence table
      if (section.evidence && section.evidence.length > 0) {
        const evidenceData = section.evidence.map(ev => [
          ev.description,
          ev.count !== undefined ? ev.count.toString() : (ev.percentage !== undefined ? `${ev.percentage}%` : 'N/A')
        ]);

        autoTable(doc, {
          startY: currentY + 12 + (descLines.length * 4),
          head: [['Evidence', 'Value']],
          body: evidenceData,
          theme: 'striped',
          headStyles: { fillColor: [100, 116, 139] },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
      } else {
        currentY += 25;
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`compliance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isLoading ? 'Generating...' : 'Generate Report'}
              </Button>
              {report && (
                <Button
                  onClick={handleExportPDF}
                  variant="outline"
                  className="flex-1"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              )}
            </div>
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
