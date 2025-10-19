'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EntityDetailHeader } from '@/components/common/EntityDetailHeader';
import { InfoCard } from '@/components/common/InfoCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import {
  ArrowLeft,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileText,
  Info,
  CreditCard,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface DesignerProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DesignerProjectDetailPage({ params }: DesignerProjectDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser, loading: userLoading } = useAuth();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Get partner profile
  const { data: partner, error: partnerError } = api.partners.getByPortalUser.useQuery(
    undefined,
    { enabled: !!currentUser }
  );

  // Get production order details
  const { data: project, isLoading, error } = api.productionOrders.getById.useQuery(
    { id: id },
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

  // Handle partner query error
  if (partnerError) {
    return (
      <div className="page-container">
        <PageHeader
          title="Project Details"
          subtitle="View project information"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load partner profile"
          description={partnerError.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.partners.getByPortalUser.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  // Handle project query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Project Details"
          subtitle="View project information"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load project details"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.productionOrders.getById.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading || !project || !partner) {
    return (
      <div className="page-container">
        <LoadingState message="Loading project details..." size="md" />
      </div>
    );
  }

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
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Button
          onClick={() => router.push('/portal/designer')}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Entity Header */}
      <EntityDetailHeader
        icon={Package}
        title={project.order_number}
        subtitle={partner.company_name}
        metadata={[
          { icon: Package, value: `${project.quantity} units`, label: 'Quantity' },
          { icon: DollarSign, value: formatCurrency(project.total_cost), label: 'Total Value' },
        ]}
        status={project.status}
      />

      {/* Payment Status Alerts */}
      {project.status === 'awaiting_deposit' && (
        <Alert>
          <AlertCircle className="icon-sm" aria-hidden="true" />
          <AlertDescription>
            <strong>Waiting for Customer Deposit</strong>
            <br />
            Production cannot begin until the customer pays the 50% deposit ({formatCurrency(depositAmount)}).
          </AlertDescription>
        </Alert>
      )}

      {project.status === 'awaiting_final_payment' && (
        <Alert>
          <AlertCircle className="icon-sm" aria-hidden="true" />
          <AlertDescription>
            <strong>Waiting for Final Payment</strong>
            <br />
            Project cannot be shipped until the customer pays the final 50% balance ({formatCurrency(balanceAmount)}).
          </AlertDescription>
        </Alert>
      )}

      {project.status === 'deposit_paid' && (
        <Alert className="border-success bg-success-muted">
          <CheckCircle className="icon-sm status-completed" aria-hidden="true" />
          <AlertDescription className="text-success">
            <strong>Ready to Start Production</strong>
            <br />
            Deposit has been paid. You can begin production on this project.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Project Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{formatCurrency(project.total_cost)}</div>
            <p className="stat-label">
              {project.quantity} units @ {formatCurrency(project.unit_price)} each
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{project.quantity}</div>
            <p className="stat-label">units to produce</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Project Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{formatDate(project.order_date)}</div>
            <p className="stat-label">placed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Ship Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{formatDate(project.estimated_ship_date)}</div>
            <p className="stat-label">target</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tabs-trigger">
            <FileText className="icon-sm" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="payments" className="tabs-trigger">
            <CreditCard className="icon-sm" aria-hidden="true" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="items" className="tabs-trigger">
            <Package className="icon-sm" aria-hidden="true" />
            Project Items ({project.ordered_items?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="notes" className="tabs-trigger">
            <FileText className="icon-sm" aria-hidden="true" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <InfoCard
            title="Project Details"
            items={[
              { label: 'Item Name', value: project.item_name },
              { label: 'Product Type', value: <span className="capitalize">{project.product_type}</span> },
              { label: 'Description', value: project.item_description || '—' },
              { label: 'Quantity', value: `${project.quantity} units` },
              { label: 'Unit Price', value: formatCurrency(project.unit_price) },
              { label: 'Total Cost', value: formatCurrency(project.total_cost) },
            ]}
          />

          {project.factory_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="icon-sm" aria-hidden="true" />
                  Production Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="card-content-compact">
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
            <CardContent className="card-content-compact">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Deposit Payment */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Deposit (50%)</h3>
                    <StatusBadge status={project.deposit_paid ? "completed" : "pending"} />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(depositAmount)}</p>
                  <p className="text-sm text-muted mt-1">
                    {project.deposit_paid ? 'Required to start production' : 'Blocks production until paid'}
                  </p>
                </div>

                {/* Final Payment */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Final Payment (50%)</h3>
                    <StatusBadge status={project.final_payment_paid ? "completed" : "pending"} />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(balanceAmount)}</p>
                  <p className="text-sm text-muted mt-1">
                    {project.final_payment_paid ? 'Required to ship project' : 'Blocks shipping until paid'}
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="icon-sm" aria-hidden="true" />
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
            <CardContent className="card-content-compact">
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
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell>
                          {item.qc_status ? (
                            <StatusBadge status={item.qc_status} />
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted">
                          {item.notes || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={Package}
                  title="No individual units created yet"
                  description="Units are automatically created when deposit payment is received"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="icon-sm" aria-hidden="true" />
                Production Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              {project.factory_notes ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{project.factory_notes}</p>
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No production notes"
                  description="No production notes for this project"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
