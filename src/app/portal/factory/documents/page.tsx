'use client';

import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState, EmptyState } from '@/components/common';
import { FileText, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Factory Documents Page
 * External portal for factories to view and manage production documents
 * Phase 3: Portal router integration
 */
export default function FactoryDocumentsPage() {
  const { data: _userInfo, isLoading, error } = api.portal.getCurrentUser.useQuery();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Production Documents</h1>
          <p className="page-subtitle">Access and manage production documentation</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load user information"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getCurrentUser.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading documents..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Production Documents</h1>
        <p className="page-subtitle">Access and manage production documentation</p>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground">No documents available</p>
            <p className="text-sm text-muted-foreground mt-2">Document management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
