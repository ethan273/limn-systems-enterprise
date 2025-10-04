"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
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
  Activity,
  ArrowLeft,
  Edit,
  Package,
  ShoppingCart,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function CRMProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = api.projects.getById.useQuery(
    { id: projectId },
    { enabled: !!user && !!projectId }
  );

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading project details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" aria-hidden="true" />
          <h3 className="empty-state-title">Project Not Found</h3>
          <p className="empty-state-description">
            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Button onClick={() => router.push("/crm/projects")} className="btn-primary">
            <ArrowLeft className="icon-sm" aria-hidden="true" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const { project, customer, orders, orderedItems, analytics } = data;

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      planning: "btn-primary text-info dark:btn-primary dark:text-info",
      active: "bg-success-muted text-success dark:bg-success-muted dark:text-success",
      review: "btn-secondary text-secondary dark:btn-secondary dark:text-secondary",
      completed: "status-completed",
      on_hold: "bg-orange-100 text-warning dark:bg-orange-900 dark:text-warning",
      cancelled: "status-cancelled",
    };
    return statusColors[status as keyof typeof statusColors] || "badge-neutral";
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors: Record<string, string> = {
      low: "priority-low",
      medium: "priority-medium",
      high: "priority-high",
      urgent: "bg-destructive-muted text-destructive dark:bg-destructive-muted dark:text-destructive",
    };
    return priorityColors[priority as keyof typeof priorityColors] || "badge-neutral";
  };

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <Button
          onClick={() => router.push("/crm/projects")}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Project Info Card */}
      <Card className="detail-header-card">
        <CardContent>
          <div className="detail-header">
            <div className="detail-avatar">
              <Briefcase className="detail-avatar-icon" aria-hidden="true" />
            </div>
            <div className="detail-info">
              <h1 className="detail-title">{project.name || "Unnamed Project"}</h1>
              <div className="detail-meta">
                <span className="detail-meta-item">
                  <User className="icon-sm" aria-hidden="true" />
                  {customer?.name || "No customer"}
                </span>
                {customer?.company && (
                  <span className="detail-meta-item">
                    <Building2 className="icon-sm" aria-hidden="true" />
                    {customer.company}
                  </span>
                )}
                <Badge variant="outline" className={getStatusColor(project.status || "planning")}>
                  {project.status || "unknown"}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(project.priority || "medium")}>
                  {project.priority || "medium"}
                </Badge>
              </div>
              {project.description && (
                <p className="detail-description mt-2">{project.description}</p>
              )}
              {customer && (
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
                </div>
              )}
            </div>
            <div className="detail-actions">
              <Button className="btn-primary">
                <Edit className="icon-sm" aria-hidden="true" />
                Edit Project
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">${(project.budget ? Number(project.budget) : 0).toLocaleString()}</div>
            <p className="stat-label">Allocated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Actual Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`stat-value ${Number(project.actual_cost || 0) > Number(project.budget || 0) ? 'stat-warning' : 'stat-success'}`}>
              ${(project.actual_cost ? Number(project.actual_cost) : 0).toLocaleString()}
            </div>
            <p className="stat-label">Spent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{analytics.totalOrders}</div>
            <p className="stat-label">
              ${(analytics.totalOrderValue || 0).toLocaleString()} value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{project.completion_percentage || 0}%</div>
            <p className="stat-label">Completed</p>
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
          <TabsTrigger value="orders" className="tabs-trigger">
            <ShoppingCart className="icon-sm" aria-hidden="true" />
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="items" className="tabs-trigger">
            <Package className="icon-sm" aria-hidden="true" />
            Ordered Items ({orderedItems.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="detail-list">
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Status</dt>
                    <dd className="detail-list-value">{project.status || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Priority</dt>
                    <dd className="detail-list-value">{project.priority || "—"}</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Budget</dt>
                    <dd className="detail-list-value">
                      {project.budget ? `$${Number(project.budget).toLocaleString()}` : "—"}
                    </dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Actual Cost</dt>
                    <dd className="detail-list-value">
                      {project.actual_cost ? `$${Number(project.actual_cost).toLocaleString()}` : "—"}
                    </dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Start Date</dt>
                    <dd className="detail-list-value">
                      {project.start_date
                        ? format(new Date(project.start_date), "MMM d, yyyy")
                        : "—"}
                    </dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">End Date</dt>
                    <dd className="detail-list-value">
                      {project.end_date
                        ? format(new Date(project.end_date), "MMM d, yyyy")
                        : "—"}
                    </dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Completion</dt>
                    <dd className="detail-list-value">{project.completion_percentage || 0}%</dd>
                  </div>
                  <div className="detail-list-item">
                    <dt className="detail-list-label">Created</dt>
                    <dd className="detail-list-value">
                      {project.created_at
                        ? format(new Date(project.created_at), "MMM d, yyyy")
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                {customer ? (
                  <dl className="detail-list">
                    <div className="detail-list-item">
                      <dt className="detail-list-label">Name</dt>
                      <dd className="detail-list-value">{customer.name || "—"}</dd>
                    </div>
                    <div className="detail-list-item">
                      <dt className="detail-list-label">Company</dt>
                      <dd className="detail-list-value">{customer.company || "—"}</dd>
                    </div>
                    <div className="detail-list-item">
                      <dt className="detail-list-label">Email</dt>
                      <dd className="detail-list-value">{customer.email || "—"}</dd>
                    </div>
                    <div className="detail-list-item">
                      <dt className="detail-list-label">Phone</dt>
                      <dd className="detail-list-value">{customer.phone || "—"}</dd>
                    </div>
                    <div className="detail-list-item">
                      <dt className="detail-list-label">Status</dt>
                      <dd className="detail-list-value">{customer.status || "—"}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-muted">No customer assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          {project.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{project.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          {orders.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart className="empty-state-icon" aria-hidden="true" />
              <h3 className="empty-state-title">No Orders</h3>
              <p className="empty-state-description">
                This project hasn&apos;t had any orders placed yet.
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
                    <TableHead>Created Date</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow
                      key={order.id}
                      className="table-row-clickable"
                      onClick={() => router.push(`/crm/orders/${order.id}`)}
                    >
                      <TableCell className="font-medium">{order.order_number || order.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="badge-neutral">
                          {order.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.total_amount ? `$${Number(order.total_amount).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        {order.created_at ? format(new Date(order.created_at), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityColor(order.priority || "medium")}>
                          {order.priority || "medium"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Ordered Items Tab */}
        <TabsContent value="items">
          {orderedItems.length === 0 ? (
            <div className="empty-state">
              <Package className="empty-state-icon" aria-hidden="true" />
              <h3 className="empty-state-title">No Items Ordered</h3>
              <p className="empty-state-description">
                No items have been ordered for this project yet.
              </p>
            </div>
          ) : (
            <div className="data-table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name || "—"}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{item.product_sku || "—"}</span>
                      </TableCell>
                      <TableCell>{item.quantity || 0}</TableCell>
                      <TableCell>
                        {item.unit_price ? `$${Number(item.unit_price).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.total_price ? `$${Number(item.total_price).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="badge-neutral">
                          {item.status || "pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
