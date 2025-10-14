"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Clock, TrendingUp, FileText, CreditCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function FinanceDashboard() {
 const [syncingInvoice, setSyncingInvoice] = useState(false);
 const { user, loading: authLoading } = useAuth();
 const _router = useRouter();

 // Auth is handled by middleware - no client-side redirect needed

 // API queries
 const { data: connectionStatus, isLoading: loadingConnection } =
 api.quickbooksSync.getConnectionStatus.useQuery(undefined, { enabled: !authLoading && !!user });

 const { data: syncStats, isLoading: loadingStats } =
 api.quickbooksSync.getSyncStats.useQuery(undefined, { enabled: !authLoading && !!user });

 // Get tRPC utils for cache invalidation
 const utils = api.useUtils();

 // Get all production invoices for manual sync
 const { data: invoicesData } = api.productionInvoices.getAll.useQuery(
 {
 limit: 50,
 offset: 0,
 },
 { enabled: !authLoading && !!user }
 );

 // Get all payments (via invoice payments)
 const { data: outstandingInvoices } = api.productionInvoices.getOutstanding.useQuery({}, { enabled: !authLoading && !!user });

 // Sync mutations
 const syncInvoiceMutation = api.quickbooksSync.syncInvoice.useMutation({
 onSuccess: (data: { success: boolean; quickbooks_invoice_id?: string; message: string }) => {
 toast.success(data.message);
 // Invalidate queries for instant updates
 utils.quickbooksSync.getSyncStats.invalidate();
 setSyncingInvoice(false);
 },
 onError: (error: { message: string }) => {
 toast.error(`Sync failed: ${error.message}`);
 setSyncingInvoice(false);
 },
 });

 const handleSyncInvoice = (invoiceId: string) => {
 setSyncingInvoice(true);
 syncInvoiceMutation.mutate({ production_invoice_id: invoiceId });
 };

 // Show loading state while checking authentication
 if (authLoading) {
 return (
 <div className="container mx-auto py-8">
 <div className="flex items-center justify-center h-64">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border mx-auto mb-4"></div>
 <p className="text-muted-foreground">Loading...</p>
 </div>
 </div>
 </div>
 );
 }

 // Don't render if not authenticated (will redirect)
 if (!user) {
 return null;
 }

 if (loadingConnection || loadingStats) {
 return (
 <div className="container mx-auto py-8">
 <div className="flex items-center justify-center h-64">
 <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
 </div>
 </div>
 );
 }

 return (
 <div className="container mx-auto py-8 space-y-8">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">Finance Dashboard</h1>
 <p className="text-muted-foreground mt-2">
 Manage QuickBooks integration, invoices, and payments
 </p>
 </div>
 </div>

 {/* QuickBooks Connection Status */}
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <div>
 <CardTitle className="flex items-center gap-2">
 QuickBooks Connection
 {connectionStatus?.connected ? (
 <CheckCircle2 className="h-5 w-5 text-success" />
 ) : (
 <XCircle className="h-5 w-5 text-destructive" />
 )}
 </CardTitle>
 <CardDescription>
 {connectionStatus?.connected
 ? `Connected to ${connectionStatus.company_name || "QuickBooks"}`
 : "QuickBooks not connected"}
 </CardDescription>
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => utils.quickbooksSync.getConnectionStatus.invalidate()}
 >
 <RefreshCw className="h-4 w-4 mr-2" />
 Refresh Status
 </Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 {connectionStatus?.connected ? (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Company</p>
 <p className="text-lg font-semibold">{connectionStatus.company_name || "N/A"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Token Status</p>
 <div>
 {connectionStatus.token_expired ? (
 <Badge variant="destructive">Expired</Badge>
 ) : (
 <Badge variant="default" className="bg-success-muted">Active</Badge>
 )}
 </div>
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Connected Since</p>
 <p className="text-lg font-semibold">
 {connectionStatus.connected_at
 ? new Date(connectionStatus.connected_at).toLocaleDateString()
 : "N/A"}
 </p>
 </div>
 </div>
 ) : (
 <Alert>
 <AlertDescription>
 QuickBooks is not connected. Please configure QuickBooks OAuth credentials in your environment variables
 and connect your QuickBooks account.
 </AlertDescription>
 </Alert>
 )}
 </CardContent>
 </Card>

 {/* Sync Statistics */}
 {connectionStatus?.connected && syncStats && (
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
 <TrendingUp className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{syncStats.totalSyncs}</div>
 <p className="text-xs text-muted-foreground mt-1">
 All-time sync operations
 </p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
 <CheckCircle2 className="h-4 w-4 text-success" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{syncStats.successRate}%</div>
 <p className="text-xs text-muted-foreground mt-1">
 {syncStats.completedSyncs} successful
 </p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Invoices Synced</CardTitle>
 <FileText className="h-4 w-4 text-info" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{syncStats.invoicesSynced}</div>
 <p className="text-xs text-muted-foreground mt-1">
 Total invoices in QuickBooks
 </p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Payments Synced</CardTitle>
 <CreditCard className="h-4 w-4 text-secondary" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{syncStats.paymentsSynced}</div>
 <p className="text-xs text-muted-foreground mt-1">
 Total payments in QuickBooks
 </p>
 </CardContent>
 </Card>
 </div>
 )}

 {/* Outstanding Invoices - Manual Sync Interface */}
 {connectionStatus?.connected && outstandingInvoices && outstandingInvoices.length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Clock className="h-5 w-5" />
 Outstanding Invoices
 </CardTitle>
 <CardDescription>
 Invoices pending payment or partial payment - sync to QuickBooks
 </CardDescription>
 </CardHeader>
 <CardContent>
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Invoice #</TableHead>
 <TableHead>Order #</TableHead>
 <TableHead>Project</TableHead>
 <TableHead>Customer</TableHead>
 <TableHead>Amount Due</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {outstandingInvoices.map((invoice) => (
 <TableRow key={invoice.id}>
 <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
 <TableCell>{invoice.production_orders?.order_number || "N/A"}</TableCell>
 <TableCell>{invoice.projects?.name || "N/A"}</TableCell>
 <TableCell>{invoice.customers?.name || "N/A"}</TableCell>
 <TableCell>${Number(invoice.amount_due).toFixed(2)}</TableCell>
 <TableCell>
 <Badge variant={
 invoice.status === "overdue" ? "destructive" :
 invoice.status === "partial_payment" ? "default" :
 "secondary"
 }>
 {invoice.status}
 </Badge>
 </TableCell>
 <TableCell>
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleSyncInvoice(invoice.id)}
 disabled={syncingInvoice}
 >
 {syncingInvoice ? (
 <RefreshCw className="h-4 w-4 animate-spin" />
 ) : (
 "Sync to QB"
 )}
 </Button>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 )}

 {/* Recent Invoices - All Invoices with Sync Option */}
 {connectionStatus?.connected && invoicesData && (
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 Recent Invoices
 </CardTitle>
 <CardDescription>
 All production invoices - sync to QuickBooks as needed
 </CardDescription>
 </CardHeader>
 <CardContent>
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Invoice #</TableHead>
 <TableHead>Type</TableHead>
 <TableHead>Date</TableHead>
 <TableHead>Total</TableHead>
 <TableHead>Amount Paid</TableHead>
 <TableHead>Amount Due</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {invoicesData.items.slice(0, 10).map((invoice: {
 id: string;
 invoice_number: string;
 invoice_type: string;
 invoice_date: Date | string;
 total: number | string;
 amount_paid: number | string;
 amount_due: number | string;
 status: string;
 }) => (
 <TableRow key={invoice.id}>
 <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
 <TableCell>
 <Badge variant="outline">
 {invoice.invoice_type}
 </Badge>
 </TableCell>
 <TableCell>
 {new Date(invoice.invoice_date).toLocaleDateString()}
 </TableCell>
 <TableCell>${Number(invoice.total).toFixed(2)}</TableCell>
 <TableCell>${Number(invoice.amount_paid).toFixed(2)}</TableCell>
 <TableCell>${Number(invoice.amount_due).toFixed(2)}</TableCell>
 <TableCell>
 <Badge variant={
 invoice.status === "paid" ? "default" :
 invoice.status === "overdue" ? "destructive" :
 invoice.status === "partial_payment" ? "secondary" :
 "outline"
 }>
 {invoice.status}
 </Badge>
 </TableCell>
 <TableCell>
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleSyncInvoice(invoice.id)}
 disabled={syncingInvoice}
 >
 {syncingInvoice ? (
 <RefreshCw className="h-4 w-4 animate-spin" />
 ) : (
 "Sync to QB"
 )}
 </Button>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 )}

 {/* Not Connected Warning */}
 {!connectionStatus?.connected && (
 <Alert>
 <XCircle className="h-4 w-4" />
 <AlertDescription>
 <strong>QuickBooks Not Connected</strong>
 <br />
 To use QuickBooks integration features, please configure your QuickBooks OAuth credentials
 and connect your QuickBooks account.
 </AlertDescription>
 </Alert>
 )}
 </div>
 );
}
