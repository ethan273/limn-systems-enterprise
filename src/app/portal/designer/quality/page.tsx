'use client';

import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { CheckCircle } from 'lucide-react';

/**
 * Designer Quality Reports Page
 * External portal for designers to view quality feedback and reports
 * Phase 3: Portal router integration
 */
export default function DesignerQualityPage() {
  const { data: _userInfo, isLoading } = api.portal.getCurrentUser.useQuery();

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading quality reports..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Quality Reports</h1>
        <p className="page-subtitle">View quality feedback and performance metrics</p>
      </div>

      {/* Quality Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Quality Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground">No quality items available</p>
            <p className="text-sm text-muted-foreground mt-2">Quality reporting coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
