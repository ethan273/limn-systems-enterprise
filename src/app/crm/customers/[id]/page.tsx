"use client";

import React, { use, useState } from "react";
import { useRouter} from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import type { orders } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Activity,
  ArrowLeft,
  Edit,
  Package,
  ShoppingCart,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = api.crm.customers.getById.useQuery(
    { id: id },
    { enabled: !!user && !!id }
  );

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading customer details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" aria-hidden="true" />
          <h3 className="empty-state-title">Customer Not Found</h3>
          <p className="empty-state-description">
            The customer you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Button onClick={() => router.push("/crm/customers")} className="btn-primary">
            <ArrowLeft className="icon-sm" aria-hidden="true" />
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const { customer: customerData, projects, productionOrders, activities, payments, analytics } = data;
  const customer = customerData as any; // Cast to any due to db wrapper losing Prisma type information

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <Button
          onClick={() => router.push("/crm/customers")}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Customer Info Card */}
      <Card className="detail-header-card">
        <CardContent>
          <div className="detail-header">
            <div className="detail-avatar">
              <User className="detail-avatar-icon" aria-hidden="true" />
            </div>
            <div className="detail-info">
              <h1 className="detail-title">{customer.name || customer.company_name || "Unnamed Customer"}</h1>
              <div className="detail-meta">
                {customer.company_name && customer.name && (
                  <span className="detail-meta-item">
                    <Building2 className="icon-sm" aria-hidden="true" />
                    {customer.company_name}
                  </span>
                )}
                <Badge
                  variant="outline"
                  className={
                    customer.status === "active"
                      ? "status-completed"
                      : customer.status === "inactive"
                      ? "status-cancelled"
                      : "badge-neutral"
                  }
                >
                  {customer.status || "unknown"}
                </Badge>
                {customer.type && (
                  <Badge variant="outline" className="badge-neutral">
                    {customer.type}
                  </Badge>
                )}
              </div>
              <div className="detail-contact-info">
                {customer.email && (
                  <a href={`mailto:${customer.email}`} className="detail-contact-link">
                    <Mail className="icon-sm" aria-hidden="true" />
                    {customer.email}
                  </a>
                )}
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="detail-contact-link">
                    <Phone className="icon-sm" aria-hidden="true" />
                    {customer.phone}
                  </a>
                )}
                {(customer.billing_city || customer.billing_state) && (
                  <span className="detail-meta-item">
                    <MapPin className="icon-sm" aria-hidden="true" />
                    {[customer.billing_city, customer.billing_state].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
              {customer.tags && customer.tags.length > 0 && (
                <div className="tag-list">
                  {customer.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="badge-neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="detail-actions">
              <Button className="btn-primary">
                <Edit className="icon-sm" aria-hidden="true" />
                Edit Customer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Lifetime Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value stat-success">${analytics.lifetimeValue.toLocaleString()}</div>
            <p className="stat-label">Total order value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`stat-value ${analytics.outstandingBalance > 0 ? 'stat-warning' : 'stat-success'}`}>
              ${analytics.outstandingBalance.toLocaleString()}
            </div>
            <p className="stat-label">${analytics.totalPaid.toLocaleString()} paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics.totalOrders}</div>
            <p className="stat-label">
              Avg: ${analytics.averageOrderValue > 0 ? analytics.averageOrderValue.toLocaleString() : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Customer Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics.daysAsCustomer}</div>
            <p className="stat-label">Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tabs-trigger">
            <Activity className="icon-sm" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="tabs-trigger">
            <Briefcase className="icon-sm" aria-hidden="true" />
            Projects ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="tabs-trigger">
            <ShoppingCart className="icon-sm" aria-hidden="true" />
            Orders ({customer.orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="production" className="tabs-trigger">
            <Package className="icon-sm" aria-hidden="true" />
            Production ({productionOrders.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="tabs-trigger">
            <CreditCard className="icon-sm" aria-hidden="true" />
            Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="activities" className="tabs-trigger">
            <MessageSquare className="icon-sm" aria-hidden="true" />
            Activities ({activities.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="detail-list">
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Email</dt>
                    <dd className="detail-list-value">{customer.email || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Phone</dt>
                    <dd className="detail-list-value">{customer.phone || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Company</dt>
                    <dd className="detail-list-value">{customer.company_name || customer.company || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Type</dt>
                    <dd className="detail-list-value">{customer.type || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Status</dt>
                    <dd className="detail-list-value">{customer.status || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Credit Limit</dt>
                    <dd className="detail-list-value">
                      {customer.credit_limit ? `$${Number(customer.credit_limit).toLocaleString()}` : "—"}
                    </dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Portal Access</dt>
                    <dd className="detail-list-value">{customer.portal_access ? "Enabled" : "Disabled"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Created</dt>
                    <dd className="detail-list-value">
                      {customer.created_at
                        ? format(new Date(customer.created_at), "MMM d, yyyy")
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="address-section">
                  <h4 className="address-section-title">Billing Address</h4>
                  {customer.billing_address_line1 ? (
                    <address className="address-content">
                      {customer.billing_address_line1}
                      {customer.billing_address_line2 && (
                        <>
                          <br />
                          {customer.billing_address_line2}
                        </>
                      )}
                      <br />
                      {[customer.billing_city, customer.billing_state, customer.billing_zip]
                        .filter(Boolean)
                        .join(", ")}
                      {customer.billing_country && (
                        <>
                          <br />
                          {customer.billing_country}
                        </>
                      )}
                    </address>
                  ) : (
                    <p className="text-muted">No billing address on file</p>
                  )}
                </div>
                {/* Shipping addresses stored in separate customer_shipping_addresses table */}
              </CardContent>
            </Card>
          </div>

          {/* Analytics Section */}
          <Card>
            <CardHeader>
              <CardTitle>Business Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="analytics-grid">
                <div className="analytics-item">
                  <div className="analytics-icon">
                    <ShoppingCart className="icon-md" aria-hidden="true" />
                  </div>
                  <div className="analytics-content">
                    <p className="analytics-label">Total Orders</p>
                    <p className="analytics-value">{analytics.totalOrders}</p>
                  </div>
                </div>
                <div className="analytics-item">
                  <div className="analytics-icon">
                    <Briefcase className="icon-md" aria-hidden="true" />
                  </div>
                  <div className="analytics-content">
                    <p className="analytics-label">Total Projects</p>
                    <p className="analytics-value">{analytics.totalProjects}</p>
                  </div>
                </div>
                <div className="analytics-item">
                  <div className="analytics-icon">
                    <Package className="icon-md" aria-hidden="true" />
                  </div>
                  <div className="analytics-content">
                    <p className="analytics-label">Production Orders</p>
                    <p className="analytics-value">{analytics.totalProductionOrders}</p>
                  </div>
                </div>
                <div className="analytics-item">
                  <div className="analytics-icon">
                    <MessageSquare className="icon-md" aria-hidden="true" />
                  </div>
                  <div className="analytics-content">
                    <p className="analytics-label">Activities</p>
                    <p className="analytics-value">
                      {analytics.completedActivities} / {analytics.totalActivities}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          {projects.length === 0 ? (
                <div className="empty-state">
                  <Briefcase className="empty-state-icon" aria-hidden="true" />
                  <h3 className="empty-state-title">No Projects</h3>
                  <p className="empty-state-description">
                    This customer hasn&apos;t been assigned to any projects yet.
                  </p>
                </div>
              ) : (
        <div className="data-table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Completion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project: any) => (
                        <TableRow
                          key={project.id}
                          className="table-row-clickable"
                          onClick={() => router.push(`/crm/projects/${project.id}`)}
                        >
                          <TableCell className="font-medium">{project.name || "Unnamed Project"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="badge-neutral">
                              {project.status || "unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>{project.budget ? `$${Number(project.budget).toLocaleString()}` : "—"}</TableCell>
                          <TableCell>{project.start_date || "—"}</TableCell>
                          <TableCell>{(project.actual_completion_date ? format(new Date(project.actual_completion_date), "PP") : (project.estimated_completion_date ? format(new Date(project.estimated_completion_date), "PP") : "Pending")) || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          {!customer.orders || customer.orders.length === 0 ? (
                <div className="empty-state">
                  <ShoppingCart className="empty-state-icon" aria-hidden="true" />
                  <h3 className="empty-state-title">No Orders</h3>
                  <p className="empty-state-description">
                    This customer hasn&apos;t placed any orders yet.
                  </p>
                </div>
              ) : (
        <div className="data-table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Order Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.orders.map((order: orders) => (
                        <TableRow
                          key={order.id}
                          className="table-row-clickable"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="badge-neutral">
                              {order.status || "unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.total_amount ? `$${Number(order.total_amount).toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell>
                            {order.created_at ? format(new Date(order.created_at), "MMM d, yyyy") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

        </TabsContent>

        {/* Production Orders Tab */}
        <TabsContent value="production">
          {productionOrders.length === 0 ? (
                <div className="empty-state">
                  <Package className="empty-state-icon" aria-hidden="true" />
                  <h3 className="empty-state-title">No Production Orders</h3>
                  <p className="empty-state-description">
                    No production orders exist for this customer.
                  </p>
                </div>
              ) : (
        <div className="data-table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO #</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionOrders.map((po) => (
                        <TableRow
                          key={po.id}
                          className="table-row-clickable"
                          onClick={() => router.push(`/production/orders/${po.id}`)}
                        >
                          <TableCell className="font-medium">{po.order_number}</TableCell>
                          <TableCell>{po.item_name}</TableCell>
                          <TableCell>{po.quantity}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="badge-neutral">
                              {po.status}
                            </Badge>
                          </TableCell>
                          <TableCell>${Number(po.total_cost).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          {payments.length === 0 ? (
                <div className="empty-state">
                  <CreditCard className="empty-state-icon" aria-hidden="true" />
                  <h3 className="empty-state-title">No Payments</h3>
                  <p className="empty-state-description">
                    No payments have been recorded for this customer.
                  </p>
                </div>
              ) : (
        <div className="data-table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment #</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.payment_number || "—"}</TableCell>
                          <TableCell className="stat-success font-medium">
                            ${payment.amount ? Number(payment.amount).toLocaleString() : 0}
                          </TableCell>
                          <TableCell>{payment.payment_method || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                payment.status === "completed"
                                  ? "status-completed"
                                  : payment.status === "pending"
                                  ? "status-pending"
                                  : payment.status === "failed"
                                  ? "status-cancelled"
                                  : "badge-neutral"
                              }
                            >
                              {payment.status || "unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.created_at ? format(new Date(payment.created_at), "MMM d, yyyy") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              {activities.length === 0 ? (
                <div className="empty-state">
                  <Clock className="empty-state-icon" aria-hidden="true" />
                  <h3 className="empty-state-title">No Activities Yet</h3>
                  <p className="empty-state-description">
                    Activities like calls, emails, and meetings will appear here.
                  </p>
                </div>
              ) : (
                <div className="activity-timeline">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-timeline-item">
                      <div className="activity-timeline-icon">
                        {activity.status === "completed" ? (
                          <CheckCircle2 className="icon-sm status-completed" aria-hidden="true" />
                        ) : (
                          <Clock className="icon-sm status-pending" aria-hidden="true" />
                        )}
                      </div>
                      <div className="activity-timeline-content">
                        <div className="activity-timeline-header">
                          <h4 className="activity-timeline-title">{activity.title || "Untitled Activity"}</h4>
                          <Badge
                            variant="outline"
                            className={
                              activity.status === "completed"
                                ? "status-completed"
                                : activity.status === "pending"
                                ? "status-pending"
                                : "badge-neutral"
                            }
                          >
                            {activity.status || "unknown"}
                          </Badge>
                        </div>
                        {activity.type && (
                          <p className="activity-timeline-type">
                            <span className="activity-type-badge">{activity.type}</span>
                          </p>
                        )}
                        {activity.description && (
                          <p className="activity-timeline-description">{activity.description}</p>
                        )}
                        {activity.created_at && (
                          <p className="activity-timeline-date">
                            <Calendar className="icon-xs" aria-hidden="true" />
                            {format(new Date(activity.created_at), "MMM d, yyyy h:mm a")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
