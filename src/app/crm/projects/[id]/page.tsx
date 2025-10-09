"use client";

import React, { use, useState } from "react";
import { useRouter} from "next/navigation";
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
  EntityDetailHeader,
  InfoCard,
  LoadingState,
  EmptyState,
} from "@/components/common";
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CRMProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = api.projects.getById.useQuery(
    { id: id },
    { enabled: !!user && !!id }
  );

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading project details..." size="md" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Project Not Found"
          description="The project you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Projects',
            onClick: () => router.push("/crm/projects"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  const { project, customer, orders, orderedItems, analytics } = data;

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

      {/* Project Header */}
      <EntityDetailHeader
        icon={Briefcase}
        title={project.name || "Unnamed Project"}
        subtitle={project.description || customer?.company || undefined}
        status={project.status || "planning"}
        metadata={[
          { icon: User, value: customer?.name || "No customer", type: 'text' as const },
          ...(customer?.company ? [{ icon: Building2, value: customer.company, type: 'text' as const }] : []),
          ...(customer?.email ? [{ icon: Mail, value: customer.email, type: 'email' as const }] : []),
          ...(customer?.phone ? [{ icon: Phone, value: customer.phone, type: 'phone' as const }] : []),
          ...(project.priority ? [{ icon: Activity, value: `Priority: ${project.priority}`, type: 'text' as const }] : []),
        ]}
        actions={[
          {
            label: 'Edit Project',
            icon: Edit,
            onClick: () => router.push(`/crm/projects/${id}/edit`),
          },
        ]}
      />

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
            <div className="stat-value">{analytics?.totalOrders || 0}</div>
            <p className="stat-label">
              ${(analytics?.totalOrderValue || 0).toLocaleString()} value
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
            <InfoCard
              title="Project Information"
              items={[
                { label: 'Status', value: project.status || '—' },
                { label: 'Priority', value: project.priority || '—' },
                { label: 'Budget', value: project.budget ? `$${Number(project.budget).toLocaleString()}` : '—' },
                { label: 'Actual Cost', value: project.actual_cost ? `$${Number(project.actual_cost).toLocaleString()}` : '—' },
                {
                  label: 'Start Date',
                  value: project.start_date && !isNaN(new Date(project.start_date).getTime())
                    ? format(new Date(project.start_date), "MMM d, yyyy")
                    : '—'
                },
                {
                  label: 'End Date',
                  value: project.end_date && !isNaN(new Date(project.end_date).getTime())
                    ? format(new Date(project.end_date), "MMM d, yyyy")
                    : '—'
                },
                { label: 'Completion', value: `${project.completion_percentage || 0}%` },
                { label: 'Created', value: project.created_at ? format(new Date(project.created_at), "MMM d, yyyy") : '—' },
              ]}
            />

            {/* Customer Information */}
            <InfoCard
              title="Customer Information"
              items={customer ? [
                { label: 'Name', value: customer.name || '—' },
                { label: 'Company', value: customer.company || '—' },
                { label: 'Email', value: customer.email || '—', type: 'email' },
                { label: 'Phone', value: customer.phone || '—', type: 'phone' },
                { label: 'Status', value: customer.status || '—' },
              ] : [
                { label: '', value: <p className="text-muted">No customer assigned</p> },
              ]}
            />
          </div>

          {/* Notes Section */}
          {project.notes && (
            <InfoCard
              title="Notes"
              items={[
                { label: '', value: <p className="whitespace-pre-wrap">{project.notes}</p> },
              ]}
            />
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          {orders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No Orders"
              description="This project hasn't had any orders placed yet."
            />
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
            <EmptyState
              icon={Package}
              title="No Items Ordered"
              description="No items have been ordered for this project yet."
            />
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
