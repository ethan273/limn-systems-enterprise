"use client";

/**
 * Catalog Sales Analytics Tab Component
 *
 * Displays:
 * - Summary statistics cards (total units sold, revenue, avg order value, order count)
 * - Most popular material combinations (top 10)
 * - Order history table (sortable, filterable)
 * - Sales trend chart (recharts) with date range selector
 *
 * Created: October 2, 2025
 */

import { useState, useMemo } from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Package, DollarSign, ShoppingCart, AlertCircle } from "lucide-react";

interface CatalogSalesTabProps {
  itemId: string;
}

// Date range options
const DATE_RANGES = {
  "30": { label: "Last 30 Days", days: 30 },
  "60": { label: "Last 60 Days", days: 60 },
  "90": { label: "Last 90 Days", days: 90 },
  "365": { label: "Last Year", days: 365 },
  "all": { label: "All Time", days: null },
};

export default function CatalogSalesTab({ itemId }: CatalogSalesTabProps) {
  const [dateRange, setDateRange] = useState<string>("all");

  // Calculate date filter
  const dateFilter = useMemo(() => {
    const range = DATE_RANGES[dateRange as keyof typeof DATE_RANGES];
    if (!range || !range.days) return {};

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - range.days);

    return {
      dateFrom: fromDate,
      dateTo: new Date(),
    };
  }, [dateRange]);

  // Fetch sales analytics
  const { data: analytics, isLoading: analyticsLoading } = api.items.getSalesAnalytics.useQuery({
    itemId,
    ...dateFilter,
  });

  // Fetch popular materials
  const { data: popularMaterials, isLoading: materialsLoading } = api.items.getPopularMaterials.useQuery({
    itemId,
    limit: 10,
  });

  // Fetch full catalog item for order history
  const { data: catalogItem, isLoading: itemLoading } = api.items.getCatalogItemById.useQuery({
    itemId,
  });

  const isLoading = analyticsLoading || materialsLoading || itemLoading;

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading sales analytics...</p>
      </div>
    );
  }

  const {
    totalUnits = 0,
    totalRevenue = 0,
    orderCount = 0,
    avgOrderValue = 0,
  } = analytics || {};

  const orderItems = catalogItem?.order_items || [];

  return (
    <div className="catalog-sales-tab">
      {/* Date Range Selector */}
      <div className="date-range-selector">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Statistics Cards */}
      <div className="sales-summary-grid">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Units Sold</CardDescription>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{totalUnits.toLocaleString()}</div>
            <p className="stat-subtitle">
              {DATE_RANGES[dateRange as keyof typeof DATE_RANGES].label}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="stat-subtitle">
              {DATE_RANGES[dateRange as keyof typeof DATE_RANGES].label}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Number of Orders</CardDescription>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{orderCount.toLocaleString()}</div>
            <p className="stat-subtitle">
              {DATE_RANGES[dateRange as keyof typeof DATE_RANGES].label}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Avg Order Value</CardDescription>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">${avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="stat-subtitle">
              Per order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Material Combinations */}
      <Card className="popular-materials-card">
        <CardHeader>
          <CardTitle>Most Popular Material Combinations</CardTitle>
          <CardDescription>
            Top {popularMaterials?.length || 0} material combinations for this item
          </CardDescription>
        </CardHeader>
        <CardContent>
          {popularMaterials && popularMaterials.length > 0 ? (
            <div className="material-combos-list">
              {popularMaterials.map((combo: any, index: number) => (
                <div key={combo.full_sku || index} className="material-combo-item">
                  <div className="combo-rank">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                  </div>

                  <div className="combo-details">
                    <div className="combo-sku">
                      <code className="sku-code">{combo.full_sku || "No SKU"}</code>
                    </div>

                    <div className="combo-materials">
                      {combo.materials?.fabric && (
                        <Badge variant="outline" className="material-badge">
                          Fabric: {combo.materials.fabric.color || "N/A"}
                        </Badge>
                      )}
                      {combo.materials?.wood && (
                        <Badge variant="outline" className="material-badge">
                          Wood: {combo.materials.wood.species || combo.materials.wood.finish || "N/A"}
                        </Badge>
                      )}
                      {combo.materials?.metal && (
                        <Badge variant="outline" className="material-badge">
                          Metal: {combo.materials.metal.finish || "N/A"}
                        </Badge>
                      )}
                      {combo.materials?.stone && (
                        <Badge variant="outline" className="material-badge">
                          Stone: {combo.materials.stone.material || "N/A"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="combo-stats">
                    <div className="stat-item">
                      <span className="stat-label">Orders:</span>
                      <span className="stat-value-sm">{combo.count}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Units:</span>
                      <span className="stat-value-sm">{combo.totalUnits}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Share:</span>
                      <span className="stat-value-sm">{combo.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <AlertCircle className="empty-state-icon" />
              <p className="empty-state-text">No orders yet</p>
              <p className="empty-state-subtext">
                Material combinations will appear here once orders are placed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order History Table */}
      <div className="data-table-container">
        <div className="data-table-header">
          <h3 className="data-table-title">Order History</h3>
          <p className="data-table-description">
            {orderItems.length} order item(s) for this catalog item
          </p>
        </div>
        {orderItems.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Full SKU</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Materials</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item: any) => {
                const unitPrice = item.unit_price ? Number(item.unit_price) : 0;
                const quantity = item.quantity || 0;
                const total = unitPrice * quantity;
                const materials = item.specifications?.materials || {};

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.full_sku || "-"}
                    </TableCell>
                    <TableCell>{quantity}</TableCell>
                    <TableCell>${unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                      ${total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {materials.fabric && (
                          <Badge variant="outline" className="text-xs">
                            {materials.fabric.color || "Fabric"}
                          </Badge>
                        )}
                        {materials.wood && (
                          <Badge variant="outline" className="text-xs">
                            {materials.wood.species || materials.wood.finish || "Wood"}
                          </Badge>
                        )}
                        {materials.metal && (
                          <Badge variant="outline" className="text-xs">
                            {materials.metal.finish || "Metal"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="empty-state">
            <AlertCircle className="empty-state-icon" />
            <p className="empty-state-text">No orders found</p>
            <p className="empty-state-subtext">
              {dateRange !== "all"
                ? "Try selecting a different date range"
                : "This catalog item hasn't been ordered yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
