'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Clock,
  Calendar,
  Search,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

/**
 * Factory Production Orders List Page
 * External portal for factories to view and manage all their assigned production orders
 * Phase 3: Portal router integration
 */
export default function FactoryOrdersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Use portal router procedures
  const { data: _userInfo } = api.portal.getCurrentUser.useQuery();
  const { data: ordersData, isLoading } = api.portal.getFactoryOrders.useQuery({
    limit: 100,
    offset: 0,
  });

  const orders = ordersData?.orders || [];

  // Filter orders based on search query and status
  const filteredOrders = orders.filter((order: any) => {
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;

    // Search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(query) ||
      order.item_name?.toLowerCase().includes(query) ||
      order.status?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusLabels: Record<string, string> = {
      awaiting_deposit: 'Awaiting Deposit',
      deposit_paid: 'Ready to Start',
      in_progress: 'In Production',
      awaiting_final_payment: 'Awaiting Payment',
      ready_to_ship: 'Ready to Ship',
      shipped: 'Shipped',
    };
    return <Badge variant="outline">{statusLabels[status as keyof typeof statusLabels] || status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Production Orders</h1>
        <p className="page-subtitle">View and manage all your assigned production orders</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search and Filter Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="search"
              placeholder="Search by order number, item name, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="awaiting_deposit">Awaiting Deposit</SelectItem>
                <SelectItem value="deposit_paid">Ready to Start</SelectItem>
                <SelectItem value="in_progress">In Production</SelectItem>
                <SelectItem value="awaiting_final_payment">Awaiting Payment</SelectItem>
                <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              All Orders ({filteredOrders.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' ? 'No orders match your filters' : 'No production orders assigned yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/portal/factory/orders/${order.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{order.order_number}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{order.item_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(order.total_cost))}</p>
                      <p className="text-sm text-muted-foreground">Qty: {order.quantity}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm flex-wrap">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Ordered: {formatDate(order.order_date)}</span>
                    </div>
                    {order.estimated_ship_date && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Ship by: {formatDate(order.estimated_ship_date)}</span>
                      </div>
                    )}
                    {order.status === 'awaiting_deposit' && (
                      <div className="flex items-center gap-1 text-warning">
                        <AlertCircle className="h-4 w-4" />
                        <span>Waiting for customer deposit</span>
                      </div>
                    )}
                    {order.status === 'awaiting_final_payment' && (
                      <div className="flex items-center gap-1 text-warning">
                        <AlertCircle className="h-4 w-4" />
                        <span>Waiting for final payment before shipping</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
