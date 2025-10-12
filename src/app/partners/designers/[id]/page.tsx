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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Palette,
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
} from 'lucide-react';

interface DesignerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DesignerDetailPage({ params }: DesignerDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch designer details
  const { data: designer, isLoading, error } = api.partners.getById.useQuery({ id: id });

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading designer details..." size="md" />
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Designer Not Found"
          description="The designer you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Designers',
            onClick: () => router.push('/partners/designers'),
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
          onClick={() => router.push('/partners/designers')}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Designer Header */}
      <EntityDetailHeader
        icon={Palette}
        title={designer.company_name}
        subtitle={designer.business_name && designer.business_name !== designer.company_name ? designer.business_name : undefined}
        metadata={[
          { icon: MapPin, value: `${designer.city}, ${designer.country}`, type: 'text' as const },
          ...(designer.primary_email ? [{ icon: Mail, value: designer.primary_email, type: 'email' as const }] : []),
          ...(designer.primary_phone ? [{ icon: Phone, value: designer.primary_phone, type: 'phone' as const }] : []),
          ...(designer.website ? [{ icon: Globe, value: designer.website, type: 'link' as const, href: designer.website }] : []),
        ]}
        status={designer.status}
        actions={[
          {
            label: 'Edit Designer',
            icon: Edit,
            onClick: () => router.push(`/partners/designers/${id}/edit`),
          },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Design Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{designer._count.production_orders}</div>
            <p className="stat-label">Total projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Lead Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{designer.lead_time_days || '—'}</div>
            <p className="stat-label">days average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Quality Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">
              {designer.quality_rating ? Number(designer.quality_rating).toFixed(1) : '—'}
            </div>
            <p className="stat-label">out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{designer._count.contacts}</div>
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
            Contacts ({designer._count.contacts})
          </TabsTrigger>
          <TabsTrigger value="documents" className="tabs-trigger">
            <FileText className="icon-sm" aria-hidden="true" />
            Documents ({designer._count.documents})
          </TabsTrigger>
          <TabsTrigger value="performance" className="tabs-trigger">
            <TrendingUp className="icon-sm" aria-hidden="true" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="projects" className="tabs-trigger">
            <Package className="icon-sm" aria-hidden="true" />
            Design Projects ({designer._count.production_orders})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Information */}
            <InfoCard
              title="Company Information"
              items={[
                { label: 'Legal Name', value: designer.company_name },
                ...(designer.business_name ? [{ label: 'Business Name', value: designer.business_name }] : []),
                ...(designer.registration_number ? [{ label: 'Registration Number', value: designer.registration_number }] : []),
                {
                  label: 'Address',
                  value: (
                    <>
                      {designer.address_line1}
                      {designer.address_line2 && <><br />{designer.address_line2}</>}
                      <br />
                      {designer.city}, {designer.state} {designer.postal_code}
                      <br />
                      {designer.country}
                    </>
                  ),
                },
              ]}
            />

            {/* Primary Contact */}
            <InfoCard
              title="Primary Contact"
              items={[
                { label: 'Contact Person', value: designer.primary_contact },
                { label: 'Email', value: designer.primary_email, type: 'email' as const },
                { label: 'Phone', value: designer.primary_phone, type: 'phone' as const },
                ...(designer.website ? [{ label: 'Website', value: designer.website, type: 'link' as const, href: designer.website }] : []),
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
                    {(designer.specializations || []).length > 0 ? (
                      (designer.specializations || []).map((spec: string, idx: number) => (
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
                    {(designer.capabilities || []).length > 0 ? (
                      (designer.capabilities || []).map((cap: string, idx: number) => (
                        <Badge key={idx} variant="outline">{cap}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                {(designer.certifications || []).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Certifications</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(designer.certifications || []).map((cert: string, idx: number) => (
                        <Badge key={idx} variant="default">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(designer.languages || []).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Languages</label>
                    <p className="text-sm">{(designer.languages || []).join(', ')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Details */}
            <InfoCard
              title="Business Details"
              items={[
                ...(designer.production_capacity ? [{ label: 'Production Capacity', value: `${designer.production_capacity.toLocaleString()} units/month` }] : []),
                ...(designer.lead_time_days ? [{ label: 'Lead Time', value: `${designer.lead_time_days} days` }] : []),
                ...(designer.minimum_order ? [{ label: 'Minimum Order Quantity', value: `${designer.minimum_order.toLocaleString()} units` }] : []),
                ...(designer.payment_terms ? [{ label: 'Payment Terms', value: designer.payment_terms }] : []),
                { label: 'Currency', value: designer.currency },
              ]}
            />
          </div>

          {/* Notes */}
          {designer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{designer.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Designer Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {designer.contacts && designer.contacts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designer.contacts.map((contact: {
                      id: string;
                      name: string;
                      role: string;
                      email: string;
                      phone: string | null;
                      is_primary: boolean;
                      is_qc: boolean;
                      is_production: boolean;
                      is_finance: boolean;
                    }) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.name}
                          {contact.is_primary && (
                            <Badge variant="default" className="ml-2">Primary</Badge>
                          )}
                        </TableCell>
                        <TableCell>{contact.role}</TableCell>
                        <TableCell>
                          <a href={`mailto:${contact.email}`} className="text-info hover:underline">
                            {contact.email}
                          </a>
                        </TableCell>
                        <TableCell>{contact.phone || '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {contact.is_qc && <Badge variant="secondary" className="text-xs">QC</Badge>}
                            {contact.is_production && <Badge variant="secondary" className="text-xs">Production</Badge>}
                            {contact.is_finance && <Badge variant="secondary" className="text-xs">Finance</Badge>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No Additional Contacts"
                  description="No additional contacts have been added for this designer."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {designer.documents && designer.documents.length > 0 ? (
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
                    {designer.documents.map((doc: {
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
                  description="No documents have been uploaded for this designer."
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
              {designer.partner_performance && designer.partner_performance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>On-Time Rate</TableHead>
                      <TableHead>Defect Rate</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Avg Project Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designer.partner_performance.map((perf: {
                      id: string;
                      period_start: Date;
                      period_end: Date;
                      orders_completed: number;
                      on_time_rate: number;
                      defect_rate: number;
                      total_revenue: number;
                      average_order_value: number;
                    }) => (
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
                  description="No performance data is available for this designer yet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Design Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {designer.production_orders && designer.production_orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project #</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Ship Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designer.production_orders.map((order: {
                      id: string;
                      order_number: string;
                      item_name: string;
                      quantity: number;
                      total_cost: number;
                      status: string;
                      order_date: Date;
                      estimated_ship_date: Date | null;
                    }) => (
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
                  title="No Design Projects"
                  description="No design projects have been assigned to this designer yet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
