'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
 Package,
 Clock,
 AlertCircle,
 CheckCircle,
 TrendingUp,
 FileText,
 Calendar,
 DollarSign,
} from 'lucide-react';

/**
 * Factory Portal Dashboard
 * External portal for factory partners to view their orders and performance
 */
export default function FactoryPortalPage() {
 const router = useRouter();
 const { user: currentUser, loading: userLoading } = useAuth();

 // Get partner profile for this portal user
 const { data: partner, isLoading: partnerLoading } = api.partners.getByPortalUser.useQuery(
 undefined,
 { enabled: !!currentUser }
 );

 // Get production orders assigned to this factory
 const { data: ordersData, isLoading: ordersLoading } = api.productionOrders.getByFactory.useQuery(
 { factoryId: partner?.id || '' },
 { enabled: !!partner?.id }
 );

 // Get performance statistics
 const { data: performance } = api.partners.getPerformanceStats.useQuery(
 { partnerId: partner?.id || '', months: 6 },
 { enabled: !!partner?.id }
 );

 useEffect(() => {
 // Redirect to login if not authenticated
 if (!userLoading && !currentUser) {
 router.push('/login?redirect=/portal/factory');
 }

 // Redirect to main app if user is not a factory portal user
 if (!partnerLoading && currentUser && !partner) {
 router.push('/');
 }
 }, [currentUser, partner, userLoading, partnerLoading, router]);

 if (userLoading || partnerLoading || !partner) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="text-center">
 <div className="text-muted-foreground">Loading factory portal...</div>
 </div>
 </div>
 );
 }

 const orders = ordersData?.orders || [];

 // Calculate statistics
 const activeOrders = orders.filter((o: { status: string }) =>
 ['deposit_paid', 'in_progress', 'awaiting_final_payment'].includes(o.status)
 ).length;

 const completedOrders = orders.filter((o: { status: string }) =>
 o.status === 'shipped'
 ).length;

 const pendingOrders = orders.filter((o: { status: string }) =>
 o.status === 'awaiting_deposit'
 ).length;

 const totalRevenue = orders.reduce((sum: number, o: { total_cost: number }) =>
 sum + Number(o.total_cost), 0
 );

 const getStatusBadge = (status: string) => {
 const variants: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
 awaiting_deposit: { variant: 'outline', label: 'Awaiting Deposit' },
 deposit_paid: { variant: 'default', label: 'Ready to Start' },
 in_progress: { variant: 'default', label: 'In Progress' },
 awaiting_final_payment: { variant: 'outline', label: 'Awaiting Payment' },
 ready_to_ship: { variant: 'default', label: 'Ready to Ship' },
 shipped: { variant: 'secondary', label: 'Shipped' },
 };

 const config = Object.prototype.hasOwnProperty.call(variants, status)
 ? variants[status as keyof typeof variants]
 : { variant: 'secondary' as const, label: status };

 return <Badge variant={config.variant}>{config.label}</Badge>;
 };

 const formatCurrency = (amount: number) => {
 return new Intl.NumberFormat('en-US', {
 style: 'currency',
 currency: partner.currency || 'USD',
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
 <div className="min-h-screen card">
 {/* Header */}
 <div className="bg-white border-b">
 <div className="container mx-auto px-4 py-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold">{partner.company_name}</h1>
 <p className="text-muted-foreground">Factory Production Portal</p>
 </div>
 <div className="flex items-center gap-4">
 <div className="text-right">
 <p className="text-sm text-muted-foreground">Logged in as</p>
 <p className="font-medium">{currentUser?.email}</p>
 </div>
 <Button variant="outline" onClick={() => router.push('/api/auth/signout')}>
 Sign Out
 </Button>
 </div>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8 space-y-6">
 {/* Statistics Cards */}
 <div className="grid gap-4 md:grid-cols-4">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
 <Package className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{activeOrders}</div>
 <p className="text-xs text-muted-foreground">Currently in production</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Pending Start</CardTitle>
 <Clock className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{pendingOrders}</div>
 <p className="text-xs text-muted-foreground">Awaiting deposit payment</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Completed</CardTitle>
 <CheckCircle className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{completedOrders}</div>
 <p className="text-xs text-muted-foreground">Successfully shipped</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
 <DollarSign className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
 <p className="text-xs text-muted-foreground">All orders</p>
 </CardContent>
 </Card>
 </div>

 {/* Performance Metrics */}
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
 <div>
 <p className="text-sm text-muted-foreground">On-Time Delivery</p>
 <p className="text-2xl font-bold text-green-600">
 {performance.summary.onTimePercentage}%
 </p>
 <p className="text-xs text-muted-foreground">
 {performance.summary.totalOnTime} of {performance.summary.totalOrders} orders
 </p>
 </div>
 <div>
 <p className="text-sm text-muted-foreground">Quality Rate</p>
 <p className="text-2xl font-bold text-blue-600">
 {100 - performance.summary.defectPercentage}%
 </p>
 <p className="text-xs text-muted-foreground">
 {performance.summary.totalDefects} defects total
 </p>
 </div>
 <div>
 <p className="text-sm text-muted-foreground">Total Revenue</p>
 <p className="text-2xl font-bold">
 {formatCurrency(performance.summary.totalRevenue)}
 </p>
 <p className="text-xs text-muted-foreground">
 6-month period
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Active Orders List */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 Production Orders
 </CardTitle>
 </CardHeader>
 <CardContent>
 {ordersLoading ? (
 <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
 ) : orders.length === 0 ? (
 <div className="text-center py-12">
 <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
 <p className="text-muted-foreground">No production orders assigned yet</p>
 </div>
 ) : (
 <div className="space-y-4">
 {orders.map((order: {
 id: string;
 order_number: string;
 item_name: string;
 quantity: number;
 total_cost: number;
 status: string;
 order_date: Date;
 estimated_ship_date: Date | null;
 payment_status: string;
 }) => (
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
 <p className="font-semibold">{formatCurrency(order.total_cost)}</p>
 <p className="text-sm text-muted-foreground">Qty: {order.quantity}</p>
 </div>
 </div>

 <div className="flex items-center gap-6 text-sm">
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
 <div className="flex items-center gap-1 text-yellow-600">
 <AlertCircle className="h-4 w-4" />
 <span>Waiting for customer deposit</span>
 </div>
 )}
 {order.status === 'awaiting_final_payment' && (
 <div className="flex items-center gap-1 text-yellow-600">
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

 {/* Quick Actions */}
 <Card>
 <CardHeader>
 <CardTitle>Quick Actions</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid gap-4 md:grid-cols-3">
 <Button
 variant="outline"
 className="h-auto py-4 flex flex-col items-center gap-2"
 onClick={() => router.push('/portal/factory/documents')}
 >
 <FileText className="h-6 w-6" />
 <span>View Documents</span>
 </Button>
 <Button
 variant="outline"
 className="h-auto py-4 flex flex-col items-center gap-2"
 onClick={() => router.push('/portal/factory/quality')}
 >
 <CheckCircle className="h-6 w-6" />
 <span>Quality Reports</span>
 </Button>
 <Button
 variant="outline"
 className="h-auto py-4 flex flex-col items-center gap-2"
 onClick={() => router.push('/portal/factory/settings')}
 >
 <Package className="h-6 w-6" />
 <span>Factory Settings</span>
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
