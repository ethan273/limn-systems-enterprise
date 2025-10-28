"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { BarChart3, Eye, MousePointerClick, Clock, TrendingUp, AlertTriangle, RefreshCw, DollarSign, Target, Activity } from "lucide-react";
import { PageHeader, LoadingState, StatsGrid, EmptyState, type StatItem } from "@/components/common";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Flipbook Analytics Page
 *
 * View comprehensive analytics across all flipbooks including:
 * - Session duration metrics
 * - Hotspot click analytics
 * - Conversion tracking
 */
export default function AnalyticsPage() {
  const router = useRouter();
  const [selectedFlipbook, setSelectedFlipbook] = useState<string>("all");

  // Query all flipbooks for selection dropdown
  const { data: flipbooksData, isLoading: flipbooksLoading } = api.flipbooks.list.useQuery({
    limit: 100,
  });

  const flipbooks = flipbooksData?.flipbooks || [];

  // Query analytics for selected flipbook (or aggregate)
  const flipbookId = selectedFlipbook === "all" ? flipbooks[0]?.id : selectedFlipbook;

  const { data: sessionData, isLoading: sessionLoading } = api.flipbookAnalytics.getSessionDurationStats.useQuery(
    { flipbookId: flipbookId || "" },
    { enabled: !!flipbookId }
  );

  const { data: hotspotData, isLoading: hotspotLoading } = api.flipbookAnalytics.getHotspotAnalytics.useQuery(
    { flipbookId: flipbookId || "" },
    { enabled: !!flipbookId }
  );

  const { data: conversionData, isLoading: conversionLoading } = api.flipbookAnalytics.getConversionMetrics.useQuery(
    { flipbookId: flipbookId || "" },
    { enabled: !!flipbookId }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Calculate aggregate stats across all flipbooks
  const aggregateStats = useMemo(() => {
    if (selectedFlipbook === "all") {
      // Aggregate basic stats from all flipbooks
      const totalViews = flipbooks.reduce((sum: number, f: any) => sum + (f.view_count || 0), 0);
      const totalFlipbooks = flipbooks.length;
      const avgViewsPerFlipbook = totalFlipbooks > 0 ? Math.round(totalViews / totalFlipbooks) : 0;

      return {
        totalViews,
        totalFlipbooks,
        avgViews: avgViewsPerFlipbook,
        totalSessions: 0, // Would need to aggregate from all
        avgDuration: 0,
        totalClicks: 0,
        conversions: 0,
        revenue: 0,
      };
    } else {
      // Stats for specific flipbook
      return {
        totalViews: sessionData?.totalSessions || 0,
        avgDuration: sessionData?.averageDuration || 0,
        totalClicks: hotspotData?.hotspots.reduce((sum, h) => sum + h.periodClicks, 0) || 0,
        conversions: conversionData?.totalConversions || 0,
        revenue: conversionData?.totalRevenue || 0,
        conversionRate: conversionData?.conversionRate || 0,
        avgOrderValue: conversionData?.averageOrderValue || 0,
      };
    }
  }, [selectedFlipbook, flipbooks, sessionData, hotspotData, conversionData]);

  const stats: StatItem[] = selectedFlipbook === "all"
    ? [
        {
          title: 'Total Views',
          value: aggregateStats.totalViews.toLocaleString(),
          description: 'All time views',
          icon: Eye,
          iconColor: 'info',
        },
        {
          title: 'Total Flipbooks',
          value: String(aggregateStats.totalFlipbooks),
          description: 'Active flipbooks',
          icon: BarChart3,
          iconColor: 'success',
        },
        {
          title: 'Avg Views',
          value: (aggregateStats.avgViews || 0).toLocaleString(),
          description: 'Per flipbook',
          icon: TrendingUp,
          iconColor: 'warning',
        },
      ]
    : [
        {
          title: 'Total Sessions',
          value: aggregateStats.totalViews.toLocaleString(),
          description: 'Viewing sessions',
          icon: Eye,
          iconColor: 'info',
        },
        {
          title: 'Avg Duration',
          value: `${Math.floor(aggregateStats.avgDuration / 60)}m ${aggregateStats.avgDuration % 60}s`,
          description: 'Time per session',
          icon: Clock,
          iconColor: 'success',
        },
        {
          title: 'Hotspot Clicks',
          value: aggregateStats.totalClicks.toLocaleString(),
          description: 'Total interactions',
          icon: MousePointerClick,
          iconColor: 'warning',
        },
        {
          title: 'Conversions',
          value: String(aggregateStats.conversions),
          description: `${(aggregateStats.conversionRate || 0).toFixed(1)}% rate`,
          icon: Target,
          iconColor: 'info',
        },
        {
          title: 'Revenue',
          value: `$${aggregateStats.revenue.toLocaleString()}`,
          description: 'From conversions',
          icon: DollarSign,
          iconColor: 'success',
        },
      ];

  const isLoading = flipbooksLoading || sessionLoading || hotspotLoading || conversionLoading;

  // Handle query error
  if (!flipbooksLoading && flipbooks.length === 0) {
    return (
      <div className="page-container">
        <PageHeader
          title="Flipbook Analytics"
          subtitle="View performance metrics across all your flipbooks"
        />
        <EmptyState
          icon={BarChart3}
          title="No flipbooks yet"
          description="Create and publish flipbooks to start tracking analytics."
          action={{
            label: 'Create Flipbook',
            onClick: () => router.push("/flipbooks"),
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading analytics..." size="lg" />;
  }

  // Prepare chart data
  const topHotspots = hotspotData?.hotspots.slice(0, 10) || [];
  const hotspotChartData = topHotspots.map(h => ({
    name: h.product?.name || `Page ${h.pageNumber}`,
    clicks: h.periodClicks,
    totalClicks: h.totalClicks,
  }));

  const sessionDurationData = (sessionData?.sessionTrend || [])
    .slice(0, 20)
    .map((s, idx) => ({
      session: `Session ${idx + 1}`,
      duration: Math.round(s.duration / 60), // Convert to minutes
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Flipbook Analytics"
        subtitle="Comprehensive performance metrics and insights"
        actions={[
          {
            label: 'Back to Library',
            onClick: () => router.push("/flipbooks"),
            variant: 'outline',
          },
        ]}
      />

      {/* Flipbook Selector */}
      <div className="mb-6">
        <Select value={selectedFlipbook} onValueChange={setSelectedFlipbook}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a flipbook" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Flipbooks (Aggregate)</SelectItem>
            {flipbooks.map((fb: any) => (
              <SelectItem key={fb.id} value={fb.id}>
                {fb.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={selectedFlipbook === "all" ? 3 : 4} />

      {/* Analytics Content */}
      {selectedFlipbook === "all" ? (
        // Aggregate View - Show top performing flipbooks
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Flipbooks
            </h2>
            <div className="space-y-3">
              {flipbooks
                .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
                .slice(0, 8)
                .map((flipbook: any) => (
                  <div
                    key={flipbook.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setSelectedFlipbook(flipbook.id)}
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

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Select a Flipbook for Detailed Analytics
            </h2>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a specific flipbook from the dropdown above to view:
                </p>
                <ul className="text-xs text-muted-foreground mt-3 space-y-1">
                  <li>• Session duration analytics</li>
                  <li>• Hotspot click tracking</li>
                  <li>• Conversion metrics</li>
                  <li>• Revenue attribution</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Specific Flipbook View - Show detailed analytics
        <div className="space-y-6 mt-6">
          {/* Session Duration Chart */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Duration (Recent 20 Sessions)
            </h2>
            {sessionDurationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sessionDurationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" />
                  <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="duration" stroke="#8884d8" strokeWidth={2} name="Duration (min)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No session data available yet
              </div>
            )}
          </div>

          {/* Hotspot Analytics */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MousePointerClick className="h-5 w-5" />
                Top Clicked Hotspots
              </h2>
              {hotspotChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={hotspotChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="clicks" fill="#00C49F" name="Period Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No hotspot click data available yet
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Hotspot Distribution
              </h2>
              {hotspotChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={hotspotChartData.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="clicks"
                    >
                      {hotspotChartData.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No hotspot data to display
                </div>
              )}
            </div>
          </div>

          {/* Conversion Metrics */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Conversion Metrics
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Conversions</p>
                <p className="text-2xl font-bold">{conversionData?.totalConversions || 0}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionData?.conversionRate.toFixed(1) || 0}%</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">${conversionData?.totalRevenue.toLocaleString() || 0}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold">${conversionData?.averageOrderValue.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          {/* Detailed Hotspot Table */}
          {hotspotData && hotspotData.hotspots.length > 0 && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Detailed Hotspot Analytics</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium">Page</th>
                      <th className="text-left p-3 text-sm font-medium">Product</th>
                      <th className="text-right p-3 text-sm font-medium">Period Clicks</th>
                      <th className="text-right p-3 text-sm font-medium">Total Clicks</th>
                      <th className="text-left p-3 text-sm font-medium">Target URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotspotData.hotspots.map((hotspot) => (
                      <tr key={hotspot.hotspotId} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">{hotspot.pageNumber}</td>
                        <td className="p-3 text-sm">{hotspot.product?.name || '-'}</td>
                        <td className="p-3 text-sm text-right font-medium">{hotspot.periodClicks}</td>
                        <td className="p-3 text-sm text-right text-muted-foreground">{hotspot.totalClicks}</td>
                        <td className="p-3 text-sm truncate max-w-xs">{hotspot.targetUrl || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
