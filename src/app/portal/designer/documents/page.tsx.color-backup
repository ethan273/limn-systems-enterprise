'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Upload, FileIcon } from 'lucide-react';

/**
 * Designer Portal Documents Page
 * View and download documents shared with the designer
 */
export default function DesignerDocumentsPage() {
 const router = useRouter();
 const { user: currentUser, loading: userLoading } = useAuth();

 // Get partner profile
 const { data: partner } = api.partners.getByPortalUser.useQuery(
 undefined,
 { enabled: !!currentUser }
 );

 useEffect(() => {
 if (!userLoading && !currentUser) {
 router.push('/login?redirect=/portal/designer/documents');
 }
 }, [currentUser, userLoading, router]);

 if (userLoading || !partner) {
 return (
 <div className="min-h-screen flex items-center justify-center card">
 <div className="text-center">
 <div className="text-muted-foreground">Loading documents...</div>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen card">
 {/* Header */}
 <div className="bg-white border-b">
 <div className="container mx-auto px-4 py-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Button
 variant="ghost"
 onClick={() => router.push('/portal/designer')}
 >
 <ArrowLeft className="h-4 w-4 mr-2" />
 Back to Dashboard
 </Button>
 <div>
 <h1 className="text-2xl font-bold">Documents</h1>
 <p className="text-muted-foreground">{partner.company_name}</p>
 </div>
 </div>
 <Button>
 <Upload className="h-4 w-4 mr-2" />
 Upload Document
 </Button>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 Shared Documents
 </CardTitle>
 </CardHeader>
 <CardContent>
 {/* Placeholder: Documents list will be implemented */}
 <div className="text-center py-12">
 <FileIcon className="mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4" />
 <h3 className="text-lg font-semibold mb-2">Document Management Coming Soon</h3>
 <p className="text-muted-foreground mb-6">
 View and download production documents, specifications, and quality reports.
 </p>
 <div className="space-y-2 text-sm text-muted-foreground">
 <p>✓ Technical drawings and specifications</p>
 <p>✓ Quality control reports</p>
 <p>✓ Production orders and invoices</p>
 <p>✓ Shipping documents</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
