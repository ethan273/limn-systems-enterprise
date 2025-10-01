'use client';

/**
 * Customer Portal Dashboard
 * Phase 3: Customer Self-Service Portal
 * Main landing page with stats and recent activity
 */

import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  CreditCard,
  Truck,
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
  Bell,
  Loader2,
} from 'lucide-react';

export default function PortalDashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = api.portal.getDashboardStats.useQuery();

  // Fetch recent notifications
  const { data: notificationData, isLoading: notificationsLoading } =
    api.portal.getNotifications.useQuery({
      limit: 5,
      offset: 0,
    });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#91bdbd] mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here is an overview of your account.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Orders */}
        <Link href="/portal/orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Orders</CardTitle>
              <ShoppingCart className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.activeOrders || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Orders in progress</p>
            </CardContent>
          </Card>
        </Link>

        {/* Pending Payments */}
        <Link href="/portal/financials">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
              <CreditCard className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.pendingPayments || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Invoices to pay</p>
            </CardContent>
          </Card>
        </Link>

        {/* Recent Shipments */}
        <Link href="/portal/shipping">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Recent Shipments</CardTitle>
              <Truck className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.recentShipments || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </Link>

        {/* Documents */}
        <Link href="/portal/documents">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Documents</CardTitle>
              <FileText className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.documentsCount || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Available files</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-400" />
            <CardTitle>Recent Notifications</CardTitle>
          </div>
          <Link href="/portal/notifications">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {notificationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#91bdbd]" />
            </div>
          ) : notificationData?.notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notificationData?.notifications.map((notification: {
                id: string;
                type: string;
                title: string;
                message: string;
                link: string | null;
                read: boolean;
                created_at: Date | string;
              }) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg border ${
                    notification.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.type === 'order_update'
                        ? 'bg-blue-100'
                        : notification.type === 'payment_received'
                          ? 'bg-green-100'
                          : notification.type === 'shipment_update'
                            ? 'bg-purple-100'
                            : 'bg-gray-100'
                    }`}
                  >
                    {notification.type === 'order_update' ? (
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                    ) : notification.type === 'payment_received' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : notification.type === 'shipment_update' ? (
                      <Truck className="w-5 h-5 text-purple-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      {!notification.read && (
                        <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {notification.link && (
                    <Link href={notification.link}>
                      <Button variant="ghost" size="sm">
                        View
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/portal/orders">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-5 h-5 text-[#91bdbd]" />
                  <div className="text-left">
                    <div className="font-medium">View Orders</div>
                    <div className="text-xs text-gray-500">Track your order status</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/portal/financials">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-[#91bdbd]" />
                  <div className="text-left">
                    <div className="font-medium">Pay Invoice</div>
                    <div className="text-xs text-gray-500">View and pay invoices</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/portal/documents">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-[#91bdbd]" />
                  <div className="text-left">
                    <div className="font-medium">View Documents</div>
                    <div className="text-xs text-gray-500">Access your files</div>
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="bg-gradient-to-r from-[#91bdbd] to-[#7da9a9] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-white/90">
                Our support team is here to assist you with any questions.
              </p>
            </div>
            <Button
              variant="secondary"
              className="bg-white text-[#91bdbd] hover:bg-gray-100"
              onClick={() => (window.location.href = 'mailto:support@limnsystems.com')}
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
