"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import type { orders } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { InfoCard } from "@/components/common/InfoCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import {
  User,
  Mail,
  Phone,
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
        <LoadingState message="Loading customer details..." size="md" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Customer Not Found"
          description="The customer you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Customers',
            onClick: () => router.push("/crm/customers"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  const { customer: customerData, projects, productionOrders, activities, payments, analytics } = data;
  const customer = customerData as any;

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

      {/* Customer Header */}
      <EntityDetailHeader
        icon={User}
        title={customer.name || customer.company_name || "Unnamed Customer"}
        subtitle={customer.company_name && customer.name ? customer.company_name : undefined}
        status={customer.status}
        statusType={customer.status === "active" ? "active" : "inactive"}
        metadata={[
          ...(customer.email ? [{ icon: Mail, value: customer.email, type: 'email' as const }] : []),
          ...(customer.phone ? [{ icon: Phone, value: customer.phone, type: 'phone' as const }] : []),
          ...(customer.billing_city || customer.billing_state ? [{
            icon: MapPin,
            value: [customer.billing_city, customer.billing_state].filter(Boolean).join(", "),
            type: 'text' as const
          }] : []),
        ]}
        tags={customer.tags || []}
        actions={[
          {
            label: 'Edit Customer',
            icon: Edit,
            onClick: () => router.push(`/crm/customers/${id}/edit`),
          },
        ]}
      />

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details */}
            <InfoCard
              title="Customer Information"
              items={[
                { label: 'Email', value: customer.email || '—', type: 'email' },
                { label: 'Phone', value: customer.phone || '—', type: 'phone' },
                { label: 'Company', value: customer.company_name || customer.company || '—' },
                { label: 'Type', value: customer.type || '—' },
                { label: 'Status', value: customer.status || '—' },
                {
                  label: 'Credit Limit',
                  value: customer.credit_limit ? `$${Number(customer.credit_limit).toLocaleString()}` : '—'
                },
                {
                  label: 'Portal Access',
                  value: customer.portal_access ? 'Enabled' : 'Disabled'
                },
                {
                  label: 'Created',
                  value: customer.created_at
                    ? format(new Date(customer.created_at), "MMM d, yyyy")
                    : '—'
                },
              ]}
            />

            {/* Address Information */}
            <InfoCard
              title="Address Information"
              items={[
                {
                  label: 'Billing Address',
                  value: customer.billing_address_line1 ? (
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
                  ),
                },
              ]}
            />
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
            <EmptyState
              icon={Briefcase}
              title="No Projects"
              description="This customer hasn't been assigned to any projects yet."
            />
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
                        <StatusBadge status={project.status || "unknown"} />
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
            <EmptyState
              icon={ShoppingCart}
              title="No Orders"
              description="This customer hasn't placed any orders yet."
            />
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
                        <StatusBadge status={order.status || "unknown"} />
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
            <EmptyState
              icon={Package}
              title="No Production Orders"
              description="No production orders exist for this customer."
            />
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
                        <StatusBadge status={po.status} />
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
            <EmptyState
              icon={CreditCard}
              title="No Payments"
              description="No payments have been recorded for this customer."
            />
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
                        <StatusBadge status={payment.status || "unknown"} />
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
                <EmptyState
                  icon={Clock}
                  title="No Activities Yet"
                  description="Activities like calls, emails, and meetings will appear here."
                />
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
                          <StatusBadge status={activity.status || "unknown"} />
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
