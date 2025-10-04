'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, TrendingUp, Award, BarChart3 } from 'lucide-react';

/**
 * Designer Portal Quality Reports Page
 * View quality metrics and performance statistics
 */
export default function DesignerQualityPage() {
 const router = useRouter();
 const { user: currentUser, loading: userLoading } = useAuth();

 // Get partner profile
 const { data: partner } = api.partners.getByPortalUser.useQuery(
 undefined,
 { enabled: !!currentUser }
 );

 // Get performance statistics
 const { data: performance } = api.partners.getPerformanceStats.useQuery(
 { partnerId: partner?.id || '', months: 6 },
 { enabled: !!partner?.id }
 );

 useEffect(() => {
 if (!userLoading && !currentUser) {
 router.push('/login?redirect=/portal/designer/quality');
 }
 }, [currentUser, userLoading, router]);

 if (userLoading || !partner) {
 return (
 <div className="min-h-screen flex items-center justify-center card">
 <div className="text-center">
 <div className="text-muted-foreground">Loading quality reports...</div>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen card">
 {/* Header */}
 <div className="bg-card border-b">
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
 <h1 className="text-2xl font-bold">Quality Reports</h1>
 <p className="text-muted-foreground">{partner.company_name}</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8 space-y-6">
 {/* Current Performance Metrics */}
 {performance?.summary && (
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <TrendingUp className="h-5 w-5" />
 Performance Metrics (Last 6 Months)
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid gap-4 md:grid-cols-3">
 <div className="p-4 border rounded-lg">
 <div className="flex items-center gap-2 mb-2">
 <CheckCircle className="h-5 w-5 text-success" />
 <span className="text-sm text-muted-foreground">On-Time Delivery</span>
 </div>
 <p className="text-3xl font-bold text-success">
 {performance.summary.onTimePercentage}%
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 {performance.summary.totalOnTime} of {performance.summary.totalOrders} projects
 </p>
 </div>
 <div className="p-4 border rounded-lg">
 <div className="flex items-center gap-2 mb-2">
 <Award className="h-5 w-5 text-info" />
 <span className="text-sm text-muted-foreground">Quality Rate</span>
 </div>
 <p className="text-3xl font-bold text-info">
 {100 - performance.summary.defectPercentage}%
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 {performance.summary.totalDefects} defects total
 </p>
 </div>
 <div className="p-4 border rounded-lg">
 <div className="flex items-center gap-2 mb-2">
 <BarChart3 className="h-5 w-5 text-secondary" />
 <span className="text-sm text-muted-foreground">Total Revenue</span>
 </div>
 <p className="text-3xl font-bold text-secondary">
 {new Intl.NumberFormat('en-US', {
 style: 'currency',
 currency: partner.currency || 'USD',
 }).format(performance.summary.totalRevenue)}
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 6-month period
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Quality Reports Placeholder */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <CheckCircle className="h-5 w-5" />
 Detailed Quality Reports
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-center py-12">
 <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4" />
 <h3 className="text-lg font-semibold mb-2">Advanced Quality Analytics Coming Soon</h3>
 <p className="text-muted-foreground mb-6">
 Track quality metrics, defect trends, and improvement opportunities.
 </p>
 <div className="space-y-2 text-sm text-muted-foreground">
 <p>✓ Monthly quality trend analysis</p>
 <p>✓ Defect categorization and root cause tracking</p>
 <p>✓ Production efficiency metrics</p>
 <p>✓ Customer satisfaction scores</p>
 <p>✓ Continuous improvement recommendations</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
