"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Link2,
} from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface FlipbookAnalyticsProps {
  flipbookId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function FlipbookAnalytics({ flipbookId }: FlipbookAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<number>(30);

  // Fetch analytics data
  const { data: analytics, isLoading } = api.flipbooks.getFlipbookAnalytics.useQuery({
    flipbookId,
    days: timeRange,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics</h2>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No analytics data available
      </div>
    );
  }

  // Calculate growth rate (if we have more than 1 day of data)
  const growthRate = analytics.viewsByDay.length > 1
    ? (((analytics.viewsByDay[analytics.viewsByDay.length - 1]?.views || 0) -
        (analytics.viewsByDay[0]?.views || 0)) /
        Math.max(analytics.viewsByDay[0]?.views || 1, 1)) *
      100
    : 0;

  // Format data for charts
  const viewsChartData = analytics.viewsByDay.map((item) => ({
    date: format(new Date(item.date), 'MMM d'),
    views: item.views,
  }));

  const referrersChartData = analytics.topReferrers.map((item) => ({
    name: item.referrer === 'Direct' ? 'Direct Traffic' : new URL(item.referrer.startsWith('http') ? item.referrer : `http://${item.referrer}`).hostname,
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track views and engagement metrics
          </p>
        </div>
        <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.totalUniqueViews.toLocaleString()} unique
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Share Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.shareLinksCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active share links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. per Link</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.shareLinksCount > 0
                ? Math.round(analytics.totalViews / analytics.shareLinksCount)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Views per share link
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {growthRate > 0 ? '+' : ''}
              {growthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. first day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Views Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Views Over Time</CardTitle>
          <CardDescription>
            Daily view count for the past {timeRange} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#0088FE"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No view data for this time period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Share Links and Referrers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Share Links */}
        <Card>
          <CardHeader>
            <CardTitle>Top Share Links</CardTitle>
            <CardDescription>
              Best performing share links by total views
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topShareLinks.length > 0 ? (
              <div className="space-y-3">
                {analytics.topShareLinks.map((link, index) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{link.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {format(new Date(link.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{link.views}</p>
                      <p className="text-xs text-muted-foreground">
                        {link.uniqueViews} unique
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No share links yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>
              Where your viewers are coming from
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrersChartData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={referrersChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {referrersChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {analytics.topReferrers.slice(0, 5).map((referrer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate max-w-[200px]">
                          {referrer.referrer === 'Direct' ? 'Direct Traffic' : referrer.referrer}
                        </span>
                      </div>
                      <span className="font-medium">{referrer.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No traffic data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      {analytics.shareLinksCount === 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Get Started with Share Links
            </CardTitle>
            <CardDescription>
              Create share links to track views and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Share links allow you to distribute your flipbook and track detailed analytics
              including views, referrers, and viewer behavior.
            </p>
            <Button size="sm">
              <Link2 className="h-4 w-4 mr-2" />
              Create Your First Share Link
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
