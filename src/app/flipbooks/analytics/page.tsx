"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { BarChart3, Eye, MousePointerClick, Clock, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { PageHeader, LoadingState, StatsGrid, EmptyState, type StatItem } from "@/components/common";

/**
 * Flipbook Analytics Page
 *
 * View aggregated analytics across all flipbooks.
 * Shows views, engagement metrics, and performance data.
 */
export default function AnalyticsPage() {
  const router = useRouter();

  // Query all flipbooks for aggregate analytics
  const { data, isLoading, error } = api.flipbooks.list.useQuery({
    limit: 100,
  });

  const flipbooks = data?.flipbooks || [];

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Calculate aggregate stats
  const totalViews = flipbooks.reduce((sum: number, f: any) => sum + (f.view_count || 0), 0);
  const totalFlipbooks = flipbooks.length;
  // FIXME: publishedCount disabled - status field is Unsupported type in Prisma
  // const publishedCount = flipbooks.filter((f: any) => f.status === 'PUBLISHED').length;
  const avgViewsPerFlipbook = totalFlipbooks > 0 ? Math.round(totalViews / totalFlipbooks) : 0;

  const stats: StatItem[] = [
    {
      title: 'Total Views',
      value: totalViews.toLocaleString(),
      description: 'All time views',
      icon: Eye,
      iconColor: 'info',
    },
    // FIXME: Published Flipbooks stat disabled - status field is Unsupported type in Prisma
    // {
    //   title: 'Published Flipbooks',
    //   value: publishedCount,
    //   description: 'Live flipbooks',
    //   icon: BarChart3,
    //   iconColor: 'success',
    // },
    {
      title: 'Avg Views per Flipbook',
      value: avgViewsPerFlipbook.toLocaleString(),
      description: 'Engagement metric',
      icon: TrendingUp,
      iconColor: 'warning',
    },
    {
      title: 'Total Flipbooks',
      value: totalFlipbooks,
      description: 'All flipbooks',
      icon: BarChart3,
      iconColor: 'info',
    },
  ];

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Flipbook Analytics"
          subtitle="View performance metrics across all your flipbooks"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load analytics"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.flipbooks.list.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading analytics..." size="lg" />;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Flipbook Analytics"
        subtitle="View performance metrics across all your flipbooks"
        actions={[
          {
            label: 'Back to Library',
            onClick: () => router.push("/flipbooks"),
            variant: 'outline',
          },
        ]}
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Analytics Content */}
      {flipbooks.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics data yet"
          description="Create and publish flipbooks to start tracking analytics."
          action={{
            label: 'Create Flipbook',
            onClick: () => router.push("/flipbooks"),
          }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Top Performing Flipbooks */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing
            </h2>
            <div className="space-y-3">
              {flipbooks
                .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
                .slice(0, 5)
                .map((flipbook: any) => (
                  <div
                    key={flipbook.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => router.push(`/flipbooks/${flipbook.id}`)}
                  >
                    <div>
                      <p className="font-medium">{flipbook.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {flipbook.page_count || 0} pages
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{flipbook.view_count || 0}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Detailed Analytics Placeholder */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Detailed Analytics
            </h2>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Detailed analytics charts will be implemented in Phase 5
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Including: Page turn rates, hotspot click tracking, session duration, and more
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Features Coming Soon */}
      <div className="bg-card rounded-lg border p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Upcoming Analytics Features</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MousePointerClick className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Hotspot Analytics</p>
              <p className="text-xs text-muted-foreground">Track which products get the most clicks</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Session Duration</p>
              <p className="text-xs text-muted-foreground">Average time spent viewing flipbooks</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Conversion Tracking</p>
              <p className="text-xs text-muted-foreground">Link flipbook views to orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
