'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileText,
  Info,
} from 'lucide-react';
import { notFound } from 'next/navigation';

interface DesignerProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default function DesignerProjectDetailPage({ params }: DesignerProjectDetailPageProps) {
  const router = useRouter();
  const { user: currentUser, loading: userLoading } = useAuth();

  // Get partner profile
  const { data: partner } = api.partners.getByPortalUser.useQuery(
    undefined,
    { enabled: !!currentUser }
  );

  // Get production order details
  const { data: project, isLoading, error } = api.productionOrders.getById.useQuery(
    { id: params.id },
    { enabled: !!partner }
  );

  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push('/login?redirect=/portal/designer');
    }
  }, [currentUser, userLoading, router]);

  // Security: Verify this project belongs to this designer
  useEffect(() => {
    if (project && partner && project.factory_id !== partner.id) {
      router.push('/portal/designer');
    }
  }, [project, partner, router]);

  if (error) {
    notFound();
  }

  if (isLoading || !project || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-muted-foreground">Loading project details...</div>
        </div>
      </div>
    );
  }

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

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: partner.currency || 'USD',
    }).format(Number(amount));
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const depositAmount = Number(project.total_cost) * 0.5;
  const balanceAmount = Number(project.total_cost) * 0.5;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
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
                <h1 className="text-2xl font-bold">{project.order_number}</h1>
                <p className="text-muted-foreground">{partner.company_name}</p>
              </div>
            </div>
            {getStatusBadge(project.status)}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Payment Status Alerts */}
        {project.status === 'awaiting_deposit' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Waiting for Customer Deposit</strong>
              <br />
              Production cannot begin until the customer pays the 50% deposit ({formatCurrency(depositAmount)}).
            </AlertDescription>
          </Alert>
        )}

        {project.status === 'awaiting_final_payment' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Waiting for Final Payment</strong>
              <br />
              Project cannot be shipped until the customer pays the final 50% balance ({formatCurrency(balanceAmount)}).
            </AlertDescription>
          </Alert>
        )}

        {project.status === 'deposit_paid' && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Ready to Start Production</strong>
              <br />
              Deposit has been paid. You can begin production on this project.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Info Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(project.total_cost)}</div>
              <p className="text-xs text-muted-foreground">
                {project.quantity} units @ {formatCurrency(project.unit_price)} each
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quantity</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.quantity}</div>
              <p className="text-xs text-muted-foreground">units to produce</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{formatDate(project.order_date)}</div>
              <p className="text-xs text-muted-foreground">placed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ship Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{formatDate(project.estimated_ship_date)}</div>
              <p className="text-xs text-muted-foreground">target</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="items">Project Items ({project.ordered_items?.length || 0})</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Item Name</label>
                    <p className="text-lg font-semibold">{project.item_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product Type</label>
                    <p className="text-lg capitalize">{project.product_type}</p>
                  </div>
                </div>

                {project.item_description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm whitespace-pre-wrap">{project.item_description}</p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                    <p className="text-lg font-semibold">{project.quantity} units</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit Price</label>
                    <p className="text-lg font-semibold">{formatCurrency(project.unit_price)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Cost</label>
                    <p className="text-lg font-semibold">{formatCurrency(project.total_cost)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {project.factory_notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Production Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{project.factory_notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Deposit Payment */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Deposit (50%)</h3>
                      {project.deposit_paid ? (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unpaid
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(depositAmount)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.deposit_paid ? 'Required to start production' : 'Blocks production until paid'}
                    </p>
                  </div>

                  {/* Final Payment */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Final Payment (50%)</h3>
                      {project.final_payment_paid ? (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unpaid
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(balanceAmount)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.final_payment_paid ? 'Required to ship project' : 'Blocks shipping until paid'}
                    </p>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Payment Terms:</strong> 50% deposit required to begin production, 50% final payment required before shipping.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Items Tab */}
          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>Individual Units</CardTitle>
              </CardHeader>
              <CardContent>
                {project.ordered_items && project.ordered_items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>QC Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.ordered_items.map((item: {
                        id: string;
                        unit_number: number;
                        status: string;
                        qc_status: string | null;
                        notes: string | null;
                      }) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">Unit #{item.unit_number}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {item.qc_status ? (
                              <Badge variant={item.qc_status === 'passed' ? 'default' : 'destructive'}>
                                {item.qc_status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="mx-auto h-12 w-12 opacity-50 mb-4" />
                    <p>No individual units created yet</p>
                    <p className="text-sm mt-2">
                      Units are automatically created when deposit payment is received
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Production Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.factory_notes ? (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{project.factory_notes}</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 opacity-50 mb-4" />
                    <p>No production notes for this project</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
