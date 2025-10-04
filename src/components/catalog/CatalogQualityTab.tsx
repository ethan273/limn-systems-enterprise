"use client";

/**
 * Catalog Quality & QC Tab Component
 *
 * Displays:
 * - Summary statistics cards (total inspections, pass rate, avg defects, last inspection date)
 * - Recent QC inspections table (last 5 inspections)
 * - Links to full QC detail pages (/production/qc/[id])
 *
 * Created: October 2, 2025
 */

import Link from "next/link";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";

interface CatalogQualityTabProps {
  itemId: string;
}

export default function CatalogQualityTab({ itemId }: CatalogQualityTabProps) {
  // Fetch QC inspections for this catalog item
  const { data: qcData, isLoading, error } = api.qc.getInspectionsByCatalogItem.useQuery({
    itemId,
    limit: 5,
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading QC data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="error-card">
        <CardHeader>
          <CardTitle>Error Loading QC Data</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { inspections, summary } = qcData || {
    inspections: [],
    summary: {
      totalInspections: 0,
      passRate: 0,
      avgDefects: 0,
      lastInspectionDate: null,
    },
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="status-icon passed" />;
      case "failed":
        return <XCircle className="status-icon failed" />;
      case "in_progress":
        return <Clock className="status-icon in-progress" />;
      case "on_hold":
        return <AlertCircle className="status-icon on-hold" />;
      default:
        return null;
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="badge-success">Passed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "in_progress":
        return <Badge className="badge-warning">In Progress</Badge>;
      case "on_hold":
        return <Badge variant="secondary">On Hold</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="catalog-quality-tab">
      {/* Summary Statistics Cards */}
      <div className="quality-summary-grid">
        <Card className="stat-card">
          <CardHeader>
            <CardDescription>Total QC Inspections</CardDescription>
            <CardTitle className="stat-value">{summary.totalInspections}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-subtitle">
              {summary.totalInspections === 0
                ? "No inspections yet"
                : `Across all orders of this item`}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader>
            <CardDescription>Pass Rate</CardDescription>
            <CardTitle className="stat-value">
              {summary.passRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-subtitle">
              {summary.passRate >= 90
                ? "Excellent quality"
                : summary.passRate >= 70
                ? "Good quality"
                : summary.passRate > 0
                ? "Needs improvement"
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader>
            <CardDescription>Avg Defects per Inspection</CardDescription>
            <CardTitle className="stat-value">
              {summary.avgDefects.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-subtitle">
              {summary.avgDefects === 0
                ? "Perfect record"
                : summary.avgDefects < 1
                ? "Very good"
                : "Monitor closely"}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader>
            <CardDescription>Last Inspection</CardDescription>
            <CardTitle className="stat-value-date">
              {summary.lastInspectionDate
                ? new Date(summary.lastInspectionDate).toLocaleDateString()
                : "N/A"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-subtitle">
              {summary.lastInspectionDate
                ? `${Math.floor(
                    (Date.now() - new Date(summary.lastInspectionDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )} days ago`
                : "No inspections yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Inspections Table */}
      <div className="data-table-container">
        <div className="data-table-header">
          <h3 className="data-table-title">Recent QC Inspections</h3>
          <p className="data-table-description">
            {inspections.length > 0
              ? `Last ${inspections.length} inspection(s) for this catalog item`
              : "No QC inspections found"}
          </p>
        </div>
        {inspections.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Full SKU</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Defects</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection: any) => (
                <TableRow key={inspection.id}>
                  <TableCell>
                    {new Date(inspection.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {inspection.order_items?.full_sku || "N/A"}
                  </TableCell>
                  <TableCell>
                    {inspection.qc_stage ? (
                      <Badge variant="outline">
                        {inspection.qc_stage.replace(/_/g, " ")}
                      </Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(inspection.status)}
                      {getStatusBadge(inspection.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={inspection._count?.qc_defects > 0 ? "destructive" : "secondary"}>
                      {inspection._count?.qc_defects || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {inspection.notes || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/production/qc/${inspection.id}`}
                      className="view-detail-link"
                    >
                      <span>View Details</span>
                      <ExternalLink className="link-icon" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="empty-state">
            <AlertCircle className="empty-state-icon" />
            <p className="empty-state-text">No QC inspections yet</p>
            <p className="empty-state-subtext">
              QC inspections will appear here once orders for this catalog item are produced and inspected.
            </p>
          </div>
        )}
      </div>

      {/* View All Inspections Link */}
      {inspections.length > 0 && (
        <div className="view-all-container">
          <Link href="/production/qc" className="view-all-link">
            View All QC Inspections
            <ExternalLink className="link-icon" />
          </Link>
        </div>
      )}
    </div>
  );
}
