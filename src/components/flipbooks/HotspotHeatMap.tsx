"use client";

import React from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp } from "lucide-react";

interface HotspotHeatMapProps {
  flipbookId: string;
  pageId?: string;
}

export function HotspotHeatMap({ flipbookId, pageId }: HotspotHeatMapProps) {
  // Fetch heat map data
  const { data: heatMap, isLoading } = api.flipbooks.getHotspotHeatMap.useQuery({
    flipbookId,
    pageId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Hotspot Heat Map
          </CardTitle>
          <CardDescription>Loading heat map data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!heatMap || heatMap.hotspots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Hotspot Heat Map
          </CardTitle>
          <CardDescription>Click tracking visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            No hotspots found. Add hotspots to see click tracking data.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group hotspots by page for summary
  const hotspotsByPage = heatMap.hotspots.reduce((acc, hotspot) => {
    if (!acc[hotspot.pageNumber]) {
      acc[hotspot.pageNumber] = [];
    }
    acc[hotspot.pageNumber].push(hotspot);
    return {};
  }, {} as Record<number, typeof heatMap.hotspots>);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hotspots</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{heatMap.hotspots.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{heatMap.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All hotspot clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {heatMap.hotspots.length > 0
                ? Math.round(heatMap.totalClicks / heatMap.hotspots.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per hotspot
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Heat Map Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Top Performing Hotspots
          </CardTitle>
          <CardDescription>
            Ranked by click count - shows product interest
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {heatMap.hotspots.slice(0, 10).map((hotspot, index) => (
              <div
                key={hotspot.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="w-8 h-8 flex items-center justify-center text-xs"
                  >
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{hotspot.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      Page {hotspot.pageNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-sm">{hotspot.clickCount} clicks</p>
                    <p className="text-xs text-muted-foreground">
                      {((hotspot.clickCount / heatMap.totalClicks) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: hotspot.color }}
                    title={`Intensity: ${(hotspot.intensity * 100).toFixed(0)}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Heat Map Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: 'No Clicks', color: '#E5E7EB', range: '0' },
              { label: 'Low', color: '#3B82F6', range: '1-10' },
              { label: 'Medium', color: '#10B981', range: '11-50' },
              { label: 'High', color: '#F59E0B', range: '51-100' },
              { label: 'Very High', color: '#F97316', range: '101-500' },
              { label: 'Extremely High', color: '#EF4444', range: '500+' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.range}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {heatMap.maxClicks > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm">Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Your most-clicked product is <strong>{heatMap.hotspots[0]?.productName}</strong> with{' '}
                  <strong>{heatMap.hotspots[0]?.clickCount} clicks</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  {heatMap.hotspots.filter(h => h.clickCount === 0).length} hotspot(s) have received no clicks yet
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Consider repositioning low-performing hotspots or highlighting different products
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
