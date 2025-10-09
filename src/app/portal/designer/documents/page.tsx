'use client';

import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

/**
 * Designer Documents Page
 * External portal for designers to view and manage project documents
 * Phase 3: Portal router integration
 */
export default function DesignerDocumentsPage() {
  const { data: _userInfo } = api.portal.getCurrentUser.useQuery();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Design Documents</h1>
        <p className="page-subtitle">Access and manage your project documentation</p>
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
