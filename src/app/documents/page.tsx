"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  Upload,
  FolderOpen,
  Download,
  ExternalLink,
  HardDrive,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function DocumentsPage() {
  const router = useRouter();
  const { user: _user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [storageFilter, setStorageFilter] = useState<"all" | "google_drive" | "supabase">("all");

  const { data, isLoading, error } = api.storage.listFiles.useQuery(
    {
      storageType: storageFilter === "all" ? undefined : storageFilter,
      limit: 100,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  const { data: statsData, error: statsError } = api.storage.getStorageStats.useQuery(
    undefined,
    {
      enabled: true,
    }
  );

  const utils = api.useUtils();

  const documents = data?.files || [];
  const stats = statsData || {
    total: {
      files: 0,
      size: 0,
    },
    supabase: {
      files: 0,
      size: 0,
    },
    googleDrive: {
      files: 0,
      size: 0,
    },
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes: readonly string[] = ["Bytes", "KB", "MB", "GB"] as const;
    const i = Math.min(Math.max(Math.floor(Math.log(bytes) / Math.log(k)), 0), sizes.length - 1);
    // Safely access array with validated index - security warning is false positive
    // eslint-disable-next-line security/detect-object-injection
    const sizeLabel = i >= 0 && i < sizes.length ? sizes[i] : "Bytes";
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizeLabel;
  };

  // Error handling
  if (error || statsError) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Documents</h1>
            <p className="page-description">
              Global document hub with Google Drive integration
            </p>
          </div>
        </div>
        <div className="error-state">
          <AlertTriangle className="error-state-icon" aria-hidden="true" />
          <h3 className="error-state-title">Failed to Load Documents</h3>
          <p className="error-state-description">
            {error?.message || statsError?.message || "An error occurred while loading documents"}
          </p>
          <button
            onClick={() => {
              void utils.storage.listFiles.invalidate();
              void utils.storage.getStorageStats.invalidate();
            }}
            className="btn-primary mt-4"
          >
            <RefreshCw className="icon-sm" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-description">
            Global document hub with Google Drive integration
          </p>
        </div>
        <Button className="btn-primary">
          <Upload className="icon-sm" aria-hidden="true" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats.total.files}</div>
            <p className="stat-label">All storage types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-info">{formatFileSize(stats.total.size)}</div>
            <p className="stat-label">Across all files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Google Drive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-success">
              {stats.googleDrive.files}
            </div>
            <p className="stat-label">Documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Supabase Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-secondary">
              {stats.supabase.files}
            </div>
            <p className="stat-label">Documents</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="card-content-compact">
          <div className="filters-section">
            <div className="search-input-wrapper">
              <Search className="search-icon" aria-hidden="true" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <Select value={storageFilter} onValueChange={(value) => setStorageFilter(value as "all" | "google_drive" | "supabase")}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Storage Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Storage Types</SelectItem>
                <SelectItem value="google_drive">Google Drive</SelectItem>
                <SelectItem value="supabase">Supabase Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
            <div className="loading-state">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <FolderOpen className="empty-state-icon" aria-hidden="true" />
              <h3 className="empty-state-title">No Documents Found</h3>
              <p className="empty-state-description">
                No documents match your current filters. Upload your first document to get started.
              </p>
              <Button className="btn-primary mt-4">
                <Upload className="icon-sm" aria-hidden="true" />
                Upload Document
              </Button>
            </div>
          ) : (
        <div className="data-table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc: any) => {
                    return (
                      <TableRow
                        key={doc.id}
                        className="table-row-clickable"
                        onClick={() => router.push(`/documents/${doc.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted" aria-hidden="true" />
                            <span>{doc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.file_type ? (
                            <Badge variant="outline" className="badge-neutral uppercase text-xs">
                              {doc.file_type}
                            </Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {doc.storage_type === "google_drive" ? (
                            <Badge variant="outline" className="bg-success-muted text-success border-success">
                              <ExternalLink className="icon-sm" aria-hidden="true" />
                              <span>Google Drive</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="btn-secondary text-secondary border-secondary">
                              <HardDrive className="icon-sm" aria-hidden="true" />
                              <span>Supabase</span>
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {doc.projects ? (
                            <div className="text-sm">{doc.projects.project_name}</div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {doc.orders ? (
                            <div className="text-sm">{doc.orders.order_number}</div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {doc.file_size ? (
                            <span className="text-sm">{formatFileSize(doc.file_size)}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {doc.created_at ? (
                            <div className="text-sm">
                              <div>{format(new Date(doc.created_at), "MMM d, yyyy")}</div>
                              {doc.uploaded_by && (
                                <div className="text-muted">by {doc.uploaded_by}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" aria-hidden="true" />
                            </Button>
                            {doc.storage_type === "google_drive" && doc.google_drive_id && (
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}


      {/* Google Drive Integration Notice */}
      <Card className="bg-success/10 border-success/20 dark:bg-success/5 dark:border-success/30">
        <CardContent className="card-content-compact">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-success/20 dark:bg-success/10 rounded-lg">
              <ExternalLink className="w-5 h-5 text-success" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-success dark:text-success">Google Drive Integration Active</h3>
              <p className="text-sm text-success/90 dark:text-success/80 mt-1">
                This document hub is integrated with Google Drive for centralized file storage. Upload documents
                to Google Drive or Supabase Storage for different use cases.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
