"use client";

import React, { use, useState, useEffect } from "react";
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
import { EditableFieldGroup, EditableField } from "@/components/common/EditableField";
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
  Check,
  X,
  DollarSign,
  Calendar,
  Target,
  MessageSquare,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { OrderCreationDialog, type OrderItem } from "@/components/crm/OrderCreationDialog";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PROJECT_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CRMProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    budget: 0,
    actual_cost: 0,
    start_date: '',
    end_date: '',
    completion_percentage: 0,
    notes: '',
  });

  const { data, isLoading, error } = api.projects.getById.useQuery(
    { id: id },
    { enabled: !!user && !!id }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Sync formData with fetched project data
  useEffect(() => {
    if (data?.project) {
      const project = data.project;
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        budget: project.budget ? Number(project.budget) : 0,
        actual_cost: project.actual_cost ? Number(project.actual_cost) : 0,
        start_date: project.start_date ? format(new Date(project.start_date), "yyyy-MM-dd") : '',
        end_date: project.end_date ? format(new Date(project.end_date), "yyyy-MM-dd") : '',
        completion_percentage: project.completion_percentage || 0,
        notes: project.notes || '',
      });
    }
  }, [data]);

  // Update mutation
  const updateMutation = api.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully");
      setIsEditing(false);
      // Invalidate queries for instant updates
      utils.projects.getById.invalidate();
      utils.projects.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update project");
    },
  });

  // Order creation mutations
  const createCRMOrderMutation = api.orders.createWithItems.useMutation();
  const createProductionOrderMutation = api.productionOrders.create.useMutation();
  const createInvoiceForOrderMutation = api.productionInvoices.createForOrder.useMutation();

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Project name is required");
      return;
    }

    updateMutation.mutate({
      id: id,
      data: {
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        budget: formData.budget || undefined,
        actual_cost: formData.actual_cost || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        completion_percentage: formData.completion_percentage || undefined,
        notes: formData.notes || undefined,
      },
    });
  };

  const handleCancel = () => {
    if (data?.project) {
      const project = data.project;
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        budget: project.budget ? Number(project.budget) : 0,
        actual_cost: project.actual_cost ? Number(project.actual_cost) : 0,
        start_date: project.start_date ? format(new Date(project.start_date), "yyyy-MM-dd") : '',
        end_date: project.end_date ? format(new Date(project.end_date), "yyyy-MM-dd") : '',
        completion_percentage: project.completion_percentage || 0,
        notes: project.notes || '',
      });
    }
    setIsEditing(false);
  };

  const handleCreateOrder = () => {
    setIsOrderDialogOpen(true);
  };

  const handleFinalizeOrder = async (projectId: string) => {
    if (orderItems.length === 0) {
      toast.error("No items in order to finalize.");
      return;
    }

    try {
      // Get customer ID from project data
      const customerId = data?.customer?.id;
      if (!customerId) {
        toast.error("Customer not found for this project.");
        return;
      }

      // STEP 1: Create CRM Order with all items
      const crmOrderResult = await createCRMOrderMutation.mutateAsync({
        project_id: projectId,
        customer_id: customerId,
        order_items: orderItems.map(item => ({
          product_name: item.product_name,
          product_sku: item.product_sku,
          project_sku: item.project_sku,
          base_sku: item.base_sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          material_selections: item.material_selections,
          custom_specifications: item.custom_specifications,
        })),
        notes: `Order created from project: ${data?.project?.name}`,
        priority: 'normal',
      });

      const crmOrderId = crmOrderResult.order.id;
      const crmOrderNumber = crmOrderResult.order.order_number;

      // STEP 2: Create production orders (one per order item)
      const createdProductionOrders = [];
      let totalCost = 0;

      for (const item of orderItems) {
        const isCustomItem = !item.base_sku || item.base_sku.startsWith('TEMP-') || item.base_sku.startsWith('CUSTOM-');
        const productType = isCustomItem ? 'concept' : 'catalog';

        const result = await createProductionOrderMutation.mutateAsync({
          order_id: crmOrderId,
          project_id: projectId,
          product_type: productType,
          catalog_item_id: undefined,
          item_name: item.product_name,
          item_description: `${item.project_sku} - ${item.custom_specifications || ''}`,
          quantity: item.quantity,
          unit_price: item.unit_price,
          estimated_ship_date: undefined,
          factory_id: undefined,
          factory_notes: undefined,
        });

        createdProductionOrders.push(result.order);
        totalCost += item.total_price;
      }

      // STEP 3: Create deposit invoice (50%)
      const invoiceResult = await createInvoiceForOrderMutation.mutateAsync({
        order_id: crmOrderId,
        invoice_type: 'deposit',
      });

      toast.success(
        `Order ${crmOrderNumber} created with ${createdProductionOrders.length} item${createdProductionOrders.length > 1 ? 's' : ''} totaling $${totalCost.toFixed(2)}. Deposit invoice ${invoiceResult.invoice.invoice_number} generated for $${Number(invoiceResult.invoice.total).toFixed(2)}.`
      );

      // Clear order items and close dialog
      setOrderItems([]);
      setIsOrderDialogOpen(false);

      // Invalidate queries for instant updates
      utils.projects.getById.invalidate();
      utils.orders.getWithProductionDetails.invalidate();

    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.message || "Failed to create order. Please try again.");
    }
  };

  const handleSaveOrder = async () => {
    // This function is not used in detail page, order finalization handles everything
    return;
  };

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
        actions={
          isEditing
            ? [
                { label: 'Cancel', icon: X, onClick: handleCancel },
                { label: 'Save Changes', icon: Check, onClick: handleSave },
              ]
            : [
                { label: 'Create Order', icon: Plus, onClick: handleCreateOrder },
                { label: 'Edit Project', icon: Edit, onClick: () => setIsEditing(true) },
              ]
        }
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
            <EditableFieldGroup title="Project Information" isEditing={isEditing}>
              <EditableField
                label="Name"
                value={formData.name}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, name: value })}
                required
                icon={Briefcase}
              />
              <EditableField
                label="Description"
                value={formData.description}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, description: value })}
                type="textarea"
              />
              <EditableField
                label="Status"
                value={formData.status}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, status: value })}
                type="select"
                options={PROJECT_STATUSES}
                icon={Activity}
              />
              <EditableField
                label="Priority"
                value={formData.priority}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, priority: value })}
                type="select"
                options={PROJECT_PRIORITIES}
                icon={Target}
              />
              <EditableField
                label="Budget"
                value={String(formData.budget || 0)}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, budget: parseFloat(value) || 0 })}
                type="text"
                icon={DollarSign}
              />
              <EditableField
                label="Actual Cost"
                value={String(formData.actual_cost || 0)}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, actual_cost: parseFloat(value) || 0 })}
                type="text"
                icon={DollarSign}
              />
              <EditableField
                label="Start Date"
                value={formData.start_date}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, start_date: value })}
                type="date"
                icon={Calendar}
              />
              <EditableField
                label="End Date"
                value={formData.end_date}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, end_date: value })}
                type="date"
                icon={Calendar}
              />
              <EditableField
                label="Completion"
                value={String(formData.completion_percentage || 0)}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, completion_percentage: parseInt(value) || 0 })}
                type="text"
              />
              <EditableField
                label="Created"
                value={project.created_at ? format(new Date(project.created_at), "MMM d, yyyy h:mm a") : '—'}
                isEditing={false}
                icon={Calendar}
              />
            </EditableFieldGroup>

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
          <EditableFieldGroup title="Notes" isEditing={isEditing}>
            <EditableField
              label="Notes"
              value={formData.notes}
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, notes: value })}
              type="textarea"
              icon={MessageSquare}
            />
          </EditableFieldGroup>
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

      {/* Order Creation Dialog */}
      <OrderCreationDialog
        projectId={id}
        isOpen={isOrderDialogOpen}
        onClose={() => setIsOrderDialogOpen(false)}
        _onSave={handleSaveOrder}
        orderItems={orderItems}
        setOrderItems={setOrderItems}
        onFinalizeOrder={handleFinalizeOrder}
      />
    </div>
  );
}
