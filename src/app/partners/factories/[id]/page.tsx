'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
 Star,
 Package,
 Clock,
 TrendingUp,
 Users,
 FileText,
 ArrowLeft,
 Edit,
 Calendar,
} from 'lucide-react';
import { notFound } from 'next/navigation';

interface FactoryDetailPageProps {
 params: {
 id: string;
 };
}

export default function FactoryDetailPage({ params }: FactoryDetailPageProps) {
 const router = useRouter();
 const [activeTab, setActiveTab] = useState('overview');

 // Fetch factory details
 const { data: factory, isLoading, error } = api.partners.getById.useQuery({ id: params.id });

 if (error) {
 notFound();
 }

 if (isLoading) {
 return (
 <div className="container mx-auto py-6">
 <div className="text-center py-12 text-muted-foreground">Loading factory details...</div>
 </div>
 );
 }

 if (!factory) {
 notFound();
 }

 const getStatusBadgeVariant = (status: string) => {
 switch (status) {
 case 'active':
 return 'default';
 case 'inactive':
 return 'secondary';
 case 'pending_approval':
 return 'outline';
 case 'suspended':
 return 'destructive';
 default:
 return 'secondary';
 }
 };

 const formatStatus = (status: string) => {
 return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
 };

 const formatDate = (date: Date | string | null | undefined) => {
 if (!date) return '—';
 return new Date(date).toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'short',
 day: 'numeric',
 });
 };

 return (
 <div className="container mx-auto py-6 space-y-6">
 {/* Header */}
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => router.push('/partners/factories')}
 >
 <ArrowLeft className="h-4 w-4 mr-2" />
 Back to Factories
 </Button>
 </div>
 <div className="flex items-center gap-3">
 <Building2 className="h-8 w-8 text-muted-foreground" />
 <div>
 <h1 className="text-3xl font-bold tracking-tight">{factory.company_name}</h1>
 {factory.business_name && factory.business_name !== factory.company_name && (
 <p className="text-muted-foreground">{factory.business_name}</p>
 )}
 </div>
 <Badge variant={getStatusBadgeVariant(factory.status)}>
 {formatStatus(factory.status)}
 </Badge>
 </div>
 </div>
 <Button onClick={() => router.push(`/partners/factories/${params.id}/edit`)}>
 <Edit className="mr-2 h-4 w-4" />
 Edit Factory
 </Button>
 </div>

 {/* Quick Info Cards */}
 <div className="grid gap-4 md:grid-cols-4">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Location</CardTitle>
 <MapPin className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-sm font-medium">{factory.city}, {factory.country}</div>
 <p className="text-xs text-muted-foreground mt-1">{factory.address_line1}</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Production Orders</CardTitle>
 <Package className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{factory._count.production_orders}</div>
 <p className="text-xs text-muted-foreground">Total orders</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Lead Time</CardTitle>
 <Clock className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{factory.lead_time_days || '—'}</div>
 <p className="text-xs text-muted-foreground">days average</p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Quality Rating</CardTitle>
 <Star className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">
 {factory.quality_rating ? Number(factory.quality_rating).toFixed(1) : '—'}
 </div>
 <p className="text-xs text-muted-foreground">out of 5.0</p>
 </CardContent>
 </Card>
 </div>

 {/* Tabs */}
 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList>
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="contacts">
 Contacts ({factory._count.contacts})
 </TabsTrigger>
 <TabsTrigger value="documents">
 Documents ({factory._count.documents})
 </TabsTrigger>
 <TabsTrigger value="performance">Performance</TabsTrigger>
 <TabsTrigger value="orders">
 Production Orders ({factory._count.production_orders})
 </TabsTrigger>
 </TabsList>

 {/* Overview Tab */}
 <TabsContent value="overview" className="space-y-4">
 <div className="grid gap-4 md:grid-cols-2">
 {/* Company Information */}
 <Card>
 <CardHeader>
 <CardTitle>Company Information</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <div>
 <label className="text-sm font-medium text-muted-foreground">Legal Name</label>
 <p className="text-sm">{factory.company_name}</p>
 </div>
 {factory.business_name && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Business Name</label>
 <p className="text-sm">{factory.business_name}</p>
 </div>
 )}
 {factory.registration_number && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
 <p className="text-sm">{factory.registration_number}</p>
 </div>
 )}
 <div>
 <label className="text-sm font-medium text-muted-foreground">Address</label>
 <p className="text-sm">
 {factory.address_line1}
 {factory.address_line2 && <br />}
 {factory.address_line2}
 <br />
 {factory.city}, {factory.state} {factory.postal_code}
 <br />
 {factory.country}
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Primary Contact */}
 <Card>
 <CardHeader>
 <CardTitle>Primary Contact</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <div>
 <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
 <p className="text-sm font-medium">{factory.primary_contact}</p>
 </div>
 <div className="flex items-center gap-2">
 <Mail className="h-4 w-4 text-muted-foreground" />
 <a href={`mailto:${factory.primary_email}`} className="text-sm text-info hover:underline">
 {factory.primary_email}
 </a>
 </div>
 <div className="flex items-center gap-2">
 <Phone className="h-4 w-4 text-muted-foreground" />
 <a href={`tel:${factory.primary_phone}`} className="text-sm">
 {factory.primary_phone}
 </a>
 </div>
 {factory.website && (
 <div className="flex items-center gap-2">
 <Globe className="h-4 w-4 text-muted-foreground" />
 <a
 href={factory.website}
 target="_blank"
 rel="noopener noreferrer"
 className="text-sm text-info hover:underline"
 >
 {factory.website}
 </a>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Capabilities */}
 <Card>
 <CardHeader>
 <CardTitle>Capabilities & Specializations</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <div>
 <label className="text-sm font-medium text-muted-foreground">Specializations</label>
 <div className="flex flex-wrap gap-2 mt-1">
 {factory.specializations.map((spec: string, idx: number) => (
 <Badge key={idx} variant="secondary">{spec}</Badge>
 ))}
 </div>
 </div>
 <div>
 <label className="text-sm font-medium text-muted-foreground">Capabilities</label>
 <div className="flex flex-wrap gap-2 mt-1">
 {factory.capabilities.map((cap: string, idx: number) => (
 <Badge key={idx} variant="outline">{cap}</Badge>
 ))}
 </div>
 </div>
 {factory.certifications.length > 0 && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Certifications</label>
 <div className="flex flex-wrap gap-2 mt-1">
 {factory.certifications.map((cert: string, idx: number) => (
 <Badge key={idx} variant="default">{cert}</Badge>
 ))}
 </div>
 </div>
 )}
 {factory.languages.length > 0 && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Languages</label>
 <p className="text-sm">{factory.languages.join(', ')}</p>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Business Details */}
 <Card>
 <CardHeader>
 <CardTitle>Business Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 {factory.production_capacity && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Production Capacity</label>
 <p className="text-sm">{factory.production_capacity.toLocaleString()} units/month</p>
 </div>
 )}
 {factory.lead_time_days && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Lead Time</label>
 <p className="text-sm">{factory.lead_time_days} days</p>
 </div>
 )}
 {factory.minimum_order && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Minimum Order Quantity</label>
 <p className="text-sm">{factory.minimum_order.toLocaleString()} units</p>
 </div>
 )}
 {factory.payment_terms && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Payment Terms</label>
 <p className="text-sm">{factory.payment_terms}</p>
 </div>
 )}
 <div>
 <label className="text-sm font-medium text-muted-foreground">Currency</label>
 <p className="text-sm">{factory.currency}</p>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Notes */}
 {factory.notes && (
 <Card>
 <CardHeader>
 <CardTitle>Notes</CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-sm whitespace-pre-wrap">{factory.notes}</p>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* Contacts Tab */}
 <TabsContent value="contacts">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <div>
 <CardTitle>Factory Contacts</CardTitle>
 <CardDescription>Manage multiple contacts for this factory</CardDescription>
 </div>
 <Button size="sm">
 <Users className="mr-2 h-4 w-4" />
 Add Contact
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {factory.contacts && factory.contacts.length > 0 ? (
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Name</TableHead>
 <TableHead>Role</TableHead>
 <TableHead>Email</TableHead>
 <TableHead>Phone</TableHead>
 <TableHead>Type</TableHead>
 <TableHead>Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {factory.contacts.map((contact: {
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
 <TableCell>
 <Button variant="ghost" size="sm">Edit</Button>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 ) : (
 <div className="text-center py-12 text-muted-foreground">
 <Users className="mx-auto h-12 w-12 opacity-50 mb-4" />
 <p>No additional contacts</p>
 <Button size="sm" className="mt-4">Add Contact</Button>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Documents Tab */}
 <TabsContent value="documents">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <div>
 <CardTitle>Documents</CardTitle>
 <CardDescription>Contracts, certifications, and other documents</CardDescription>
 </div>
 <Button size="sm">
 <FileText className="mr-2 h-4 w-4" />
 Upload Document
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {factory.documents && factory.documents.length > 0 ? (
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
 {factory.documents.map((doc: {
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
 <div className="text-center py-12 text-muted-foreground">
 <FileText className="mx-auto h-12 w-12 opacity-50 mb-4" />
 <p>No documents uploaded</p>
 <Button size="sm" className="mt-4">Upload Document</Button>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Performance Tab */}
 <TabsContent value="performance">
 <Card>
 <CardHeader>
 <CardTitle>Performance Metrics</CardTitle>
 <CardDescription>Quality and delivery performance over time</CardDescription>
 </CardHeader>
 <CardContent>
 {factory.partner_performance && factory.partner_performance.length > 0 ? (
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
 {factory.partner_performance.map((perf: {
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
 <div className="text-center py-12 text-muted-foreground">
 <TrendingUp className="mx-auto h-12 w-12 opacity-50 mb-4" />
 <p>No performance data available yet</p>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Production Orders Tab */}
 <TabsContent value="orders">
 <Card>
 <CardHeader>
 <CardTitle>Production Orders</CardTitle>
 <CardDescription>Orders assigned to this factory</CardDescription>
 </CardHeader>
 <CardContent>
 {factory.production_orders && factory.production_orders.length > 0 ? (
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
 {factory.production_orders.map((order: {
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
 <div className="text-center py-12 text-muted-foreground">
 <Package className="mx-auto h-12 w-12 opacity-50 mb-4" />
 <p>No production orders assigned to this factory yet</p>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </div>
 );
}
