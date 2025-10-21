'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntityDetailHeader } from '@/components/common/EntityDetailHeader';
import { InfoCard } from '@/components/common/InfoCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { EmployeeManagement } from '@/components/partners/EmployeeManagement';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Package,
  TrendingUp,
  Users,
  FileText,
  ArrowLeft,
  Edit,
  Calendar,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface SourcingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SourcingDetailPage({ params }: SourcingDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const utils = api.useUtils();

  // Fetch sourcing details
  const { data: sourcing, isLoading, error } = api.partners.getById.useQuery({ id: id });

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load sourcing details"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.partners.getById.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading sourcing details..." size="md" />
      </div>
    );
  }

  if (!sourcing) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Sourcing Not Found"
          description="The sourcing you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Sourcing',
            onClick: () => router.push('/partners/sourcing'),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <Button
          onClick={() => router.push('/partners/sourcing')}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Sourcing Header */}
      <EntityDetailHeader
        icon={Building2}
        title={sourcing.company_name}
        subtitle={sourcing.business_name && sourcing.business_name !== sourcing.company_name ? sourcing.business_name : undefined}
        metadata={[
          { icon: MapPin, value: `${sourcing.city}, ${sourcing.country}`, type: 'text' as const },
          ...(sourcing.primary_email ? [{ icon: Mail, value: sourcing.primary_email, type: 'email' as const }] : []),
          ...(sourcing.primary_phone ? [{ icon: Phone, value: sourcing.primary_phone, type: 'phone' as const }] : []),
          ...(sourcing.website ? [{ icon: Globe, value: sourcing.website, type: 'link' as const, href: sourcing.website }] : []),
        ]}
        status={sourcing.status}
        actions={[
          {
            label: 'Edit Sourcing',
            icon: Edit,
            onClick: () => router.push(`/partners/sourcing/${id}/edit`),
          },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Production Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{sourcing._count?.production_orders || 0}</div>
            <p className="stat-label">Total orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Lead Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{sourcing.lead_time_days || '—'}</div>
            <p className="stat-label">days average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Quality Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">
              {sourcing.quality_rating ? Number(sourcing.quality_rating).toFixed(1) : '—'}
            </div>
            <p className="stat-label">out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{sourcing._count?.partner_contacts || 0}</div>
            <p className="stat-label">team members</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tabs-trigger">
            Overview
          </TabsTrigger>
          <TabsTrigger value="contacts" className="tabs-trigger">
            <Users className="icon-sm" aria-hidden="true" />
            Contacts ({sourcing._count?.partner_contacts || 0})
          </TabsTrigger>
          <TabsTrigger value="documents" className="tabs-trigger">
            <FileText className="icon-sm" aria-hidden="true" />
            Documents ({sourcing._count?.partner_documents || 0})
          </TabsTrigger>
          <TabsTrigger value="performance" className="tabs-trigger">
            <TrendingUp className="icon-sm" aria-hidden="true" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="orders" className="tabs-trigger">
            <Package className="icon-sm" aria-hidden="true" />
            Production Orders ({sourcing._count?.production_orders || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Information */}
            <InfoCard
              title="Company Information"
              items={[
                { label: 'Legal Name', value: sourcing.company_name },
                ...(sourcing.business_name ? [{ label: 'Business Name', value: sourcing.business_name }] : []),
                ...(sourcing.registration_number ? [{ label: 'Registration Number', value: sourcing.registration_number }] : []),
                {
                  label: 'Address',
                  value: (
                    <>
                      {sourcing.address_line1}
                      {sourcing.address_line2 && <><br />{sourcing.address_line2}</>}
                      <br />
                      {sourcing.city}, {sourcing.state} {sourcing.postal_code}
                      <br />
                      {sourcing.country}
                    </>
                  ),
                },
              ]}
            />

            {/* Primary Contact */}
            <InfoCard
              title="Primary Contact"
              items={[
                { label: 'Contact Person', value: sourcing.primary_contact },
                { label: 'Email', value: sourcing.primary_email, type: 'email' as const },
                { label: 'Phone', value: sourcing.primary_phone, type: 'phone' as const },
                ...(sourcing.website ? [{ label: 'Website', value: sourcing.website, type: 'link' as const, href: sourcing.website }] : []),
              ]}
            />

            {/* Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle>Capabilities & Specializations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Specializations</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(sourcing.specializations || []).length > 0 ? (
                      (sourcing.specializations || []).map((spec: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{spec}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Capabilities</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(sourcing.capabilities || []).length > 0 ? (
                      (sourcing.capabilities || []).map((cap: string, idx: number) => (
                        <Badge key={idx} variant="outline">{cap}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                {(sourcing.certifications || []).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Certifications</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(sourcing.certifications || []).map((cert: string, idx: number) => (
                        <Badge key={idx} variant="default">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(sourcing.languages || []).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Languages</label>
                    <p className="text-sm">{(sourcing.languages || []).join(', ')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Details */}
            <InfoCard
              title="Business Details"
              items={[
                ...(sourcing.production_capacity ? [{ label: 'Production Capacity', value: `${sourcing.production_capacity.toLocaleString()} units/month` }] : []),
                ...(sourcing.lead_time_days ? [{ label: 'Lead Time', value: `${sourcing.lead_time_days} days` }] : []),
                ...(sourcing.minimum_order ? [{ label: 'Minimum Order Quantity', value: `${sourcing.minimum_order.toLocaleString()} units` }] : []),
                ...(sourcing.payment_terms ? [{ label: 'Payment Terms', value: sourcing.payment_terms }] : []),
                { label: 'Currency', value: sourcing.currency },
              ]}
            />
          </div>

          {/* Notes */}
          {sourcing.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{sourcing.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contacts Tab - Now with Employee Management */}
        <TabsContent value="contacts">
          <EmployeeManagement partnerId={id} partnerType="sourcing" />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {sourcing.partner_documents && sourcing.partner_documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sourcing.partner_documents.map((doc: {
                      id: string;
                      title: string;
                      document_type: string;
                      issue_date: Date | null;
                      expiry_date: Date | null;
                      status: string;
                      file_url: string;
                    }) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell>{doc.document_type}</TableCell>
                        <TableCell>{formatDate(doc.issue_date)}</TableCell>
                        <TableCell>{formatDate(doc.expiry_date)}</TableCell>
                        <TableCell>
                          <Badge variant={doc.status === 'active' ? 'default' : 'secondary'}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No Documents"
                  description="No documents have been uploaded for this sourcing."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {sourcing.partner_performance && sourcing.partner_performance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>On-Time Rate</TableHead>
                      <TableHead>Defect Rate</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Avg Order Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sourcing.partner_performance.map((perf) => (
                      <TableRow key={perf.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(perf.period_start)} - {formatDate(perf.period_end)}
                          </div>
                        </TableCell>
                        <TableCell>{perf.orders_completed}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-success" />
                            {Number(perf.on_time_rate).toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell>{Number(perf.defect_rate).toFixed(2)}%</TableCell>
                        <TableCell>${Number(perf.total_revenue).toLocaleString()}</TableCell>
                        <TableCell>${Number(perf.average_order_value).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  title="No Performance Data"
                  description="No performance data is available for this sourcing yet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Production Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {sourcing.production_orders && sourcing.production_orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Ship Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sourcing.production_orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.item_name}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>${Number(order.total_cost).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(order.order_date)}</TableCell>
                        <TableCell>{formatDate(order.estimated_ship_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={Package}
                  title="No Production Orders"
                  description="No production orders have been assigned to this sourcing yet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
